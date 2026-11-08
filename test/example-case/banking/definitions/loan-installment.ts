import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { InstallmentStatus } from "../types";

/**
 * `loan_id`'s `where` runs once per candidate loan (up to 50) for every
 * installment being generated (~1,650 of them total, the sum of every
 * loan's `term_months`); the per-loan count only changes between
 * documents, not between candidates of the same one, so it's cached per
 * document count (same lesson as the airline `FlightCrew` fix).
 */
let cachedInstallmentCount = -1;
let cachedCountsByLoan: Map<string, number> | null = null;

export const LOAN_INSTALLMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  loan_id: chaca.ref("Loan.id", {
    where: ({ refFields, store }) => {
      const installmentsSoFar = store.currentDocuments();

      if (
        cachedCountsByLoan === null ||
        cachedInstallmentCount !== installmentsSoFar.length
      ) {
        const counts = new Map<string, number>();

        for (const installment of installmentsSoFar) {
          if (installment.loan_id === undefined) {
            continue;
          }

          counts.set(
            installment.loan_id,
            (counts.get(installment.loan_id) ?? 0) + 1,
          );
        }

        cachedCountsByLoan = counts;
        cachedInstallmentCount = installmentsSoFar.length;
      }

      const count = cachedCountsByLoan.get(refFields.id) ?? 0;

      return count < refFields.term_months;
    },
  }),
  number: ({ currentFields }) => {
    const priorCount = cachedCountsByLoan?.get(currentFields.loan_id) ?? 0;

    return priorCount + 1;
  },
  due_date: async ({ currentFields, store }) => {
    const loans = await store.get("Loan");
    const loan = FindRef.execute({
      documents: loans,
      id: currentFields.loan_id,
      from: "LoanInstallment.loan_id",
    });

    const dueDate = new Date(loan.granted_at);
    dueDate.setMonth(dueDate.getMonth() + currentFields.number);

    return dueDate;
  },
  amount: async ({ currentFields, store }) => {
    const loans = await store.get("Loan");
    const loan = FindRef.execute({
      documents: loans,
      id: currentFields.loan_id,
      from: "LoanInstallment.loan_id",
    });

    const total = new Decimal(loan.principal).times(
      new Decimal(1).plus(
        new Decimal(loan.annual_rate).times(loan.term_months).dividedBy(12),
      ),
    );
    const perInstallment = total.dividedBy(loan.term_months).toDecimalPlaces(2);

    if (currentFields.number === loan.term_months) {
      const allButLast = perInstallment.times(loan.term_months - 1);

      return total.minus(allButLast).toDecimalPlaces(2).toNumber();
    }

    return perInstallment.toNumber();
  },
  status: chaca.probability([
    { value: InstallmentStatus.Pending, chance: 0.5 },
    { value: InstallmentStatus.Paid, chance: 0.45 },
    { value: InstallmentStatus.Late, chance: 0.05 },
  ]),
});
