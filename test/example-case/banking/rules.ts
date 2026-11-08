import Decimal from "decimal.js";
import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import {
  AccountType,
  BankingDataset,
  KycStatus,
  MovementDirection,
} from "./types";

export const BANKING_RULES: CaseRule<BankingDataset>[] = [
  {
    id: "R1",
    text: "An account statement's balance equals its credits minus its debits exactly",
    fields: [
      "AccountStatement.balance",
      "AccountStatement.credits",
      "AccountStatement.debits",
    ],
    check: ({ AccountStatement }) => {
      for (const statement of AccountStatement) {
        const expected = new Decimal(statement.credits)
          .minus(statement.debits)
          .toDecimalPlaces(2);

        expect(new Decimal(statement.balance).toFixed(2)).toBe(
          expected.toFixed(2),
        );
      }
    },
  },
  {
    id: "R2",
    text: "The global sum of TransferLeg debits equals the global sum of TransferLeg credits",
    fields: ["TransferLeg.kind", "TransferLeg.amount"],
    check: ({ TransferLeg }) => {
      const totalDebits = TransferLeg.filter((leg) => {
        return leg.kind === MovementDirection.Debit;
      }).reduce((sum, leg) => sum.plus(leg.amount), new Decimal(0));
      const totalCredits = TransferLeg.filter((leg) => {
        return leg.kind === MovementDirection.Credit;
      }).reduce((sum, leg) => sum.plus(leg.amount), new Decimal(0));

      expect(totalDebits.toFixed(2)).toBe(totalCredits.toFixed(2));
    },
  },
  {
    id: "R3",
    text: "Every transfer has exactly one debit leg and one credit leg, each for its amount",
    fields: [
      "TransferLeg.transfer_id",
      "TransferLeg.kind",
      "TransferLeg.amount",
      "Transfer.amount",
    ],
    check: ({ Transfer, TransferLeg }) => {
      for (const transfer of Transfer) {
        const legs = TransferLeg.filter((leg) => {
          return leg.transfer_id === transfer.id;
        });

        expect(legs).toHaveLength(2);

        const debitLegs = legs.filter((leg) => {
          return leg.kind === MovementDirection.Debit;
        });
        const creditLegs = legs.filter((leg) => {
          return leg.kind === MovementDirection.Credit;
        });

        expect(debitLegs).toHaveLength(1);
        expect(creditLegs).toHaveLength(1);

        const transferAmount = new Decimal(transfer.amount).toFixed(2);

        expect(new Decimal(debitLegs[0].amount).toFixed(2)).toBe(
          transferAmount,
        );
        expect(new Decimal(creditLegs[0].amount).toFixed(2)).toBe(
          transferAmount,
        );
      }
    },
  },
  {
    id: "R4",
    text: "A transfer's source and destination accounts differ and share the same currency",
    fields: [
      "Transfer.source_account_id",
      "Transfer.destination_account_id",
      "Account.currency",
    ],
    check: ({ Transfer, Account }) => {
      for (const transfer of Transfer) {
        expect(transfer.destination_account_id).not.toBe(
          transfer.source_account_id,
        );

        const source = FindRef.execute({
          documents: Account,
          id: transfer.source_account_id,
          from: "Transfer.source_account_id",
        });
        const destination = FindRef.execute({
          documents: Account,
          id: transfer.destination_account_id,
          from: "Transfer.destination_account_id",
        });

        expect(destination.currency).toBe(source.currency);
      }
    },
  },
  {
    id: "R5",
    text: "No account's balance falls below its (negative) overdraft_limit",
    fields: ["AccountStatement.balance", "Account.overdraft_limit"],
    check: ({ AccountStatement, Account }) => {
      for (const statement of AccountStatement) {
        const account = FindRef.execute({
          documents: Account,
          id: statement.id,
          from: "AccountStatement.id",
        });

        expect(statement.balance).toBeGreaterThanOrEqual(
          -account.overdraft_limit,
        );
      }
    },
  },
  {
    id: "R6",
    text: "A loan's installments sum exactly to its principal plus interest",
    fields: [
      "LoanInstallment.loan_id",
      "LoanInstallment.amount",
      "Loan.principal",
      "Loan.annual_rate",
      "Loan.term_months",
    ],
    check: ({ Loan, LoanInstallment }) => {
      for (const loan of Loan) {
        const installments = LoanInstallment.filter((installment) => {
          return installment.loan_id === loan.id;
        });
        const total = installments.reduce((sum, installment) => {
          return sum.plus(installment.amount);
        }, new Decimal(0));
        const expected = new Decimal(loan.principal).times(
          new Decimal(1).plus(
            new Decimal(loan.annual_rate).times(loan.term_months).dividedBy(12),
          ),
        );

        expect(total.toFixed(2)).toBe(expected.toFixed(2));
      }
    },
  },
  {
    id: "R7",
    text: "A loan's installment due_dates are monthly and consecutive",
    fields: [
      "LoanInstallment.loan_id",
      "LoanInstallment.number",
      "LoanInstallment.due_date",
      "Loan.granted_at",
    ],
    check: ({ Loan, LoanInstallment }) => {
      for (const loan of Loan) {
        const installments = LoanInstallment.filter((installment) => {
          return installment.loan_id === loan.id;
        });

        for (const installment of installments) {
          const expectedDueDate = new Date(loan.granted_at);
          expectedDueDate.setMonth(
            expectedDueDate.getMonth() + installment.number,
          );

          expect(installment.due_date.getTime()).toBe(
            expectedDueDate.getTime(),
          );
        }
      }
    },
  },
  {
    id: "R8",
    text: "A loan's installment numbers run from 1 to term_months without gaps or repeats",
    fields: [
      "LoanInstallment.loan_id",
      "LoanInstallment.number",
      "Loan.term_months",
    ],
    check: ({ Loan, LoanInstallment }) => {
      for (const loan of Loan) {
        const numbers = LoanInstallment.filter((installment) => {
          return installment.loan_id === loan.id;
        })
          .map((installment) => installment.number)
          .sort((a, b) => a - b);

        expect(numbers).toEqual(
          Array.from({ length: loan.term_months }, (_, index) => index + 1),
        );
      }
    },
  },
  {
    id: "R9",
    text: "No card belongs to a savings account",
    fields: ["Card.account_id", "Account.type"],
    check: ({ Card, Account }) => {
      for (const card of Card) {
        const account = FindRef.execute({
          documents: Account,
          id: card.account_id,
          from: "Card.account_id",
        });

        expect(account.type).not.toBe(AccountType.Savings);
      }
    },
  },
  {
    id: "R10",
    text: "Every transaction and transfer happens on or after its account's opening",
    fields: [
      "Transaction.posted_at",
      "Transaction.account_id",
      "Transfer.created_at",
      "Transfer.source_account_id",
      "Transfer.destination_account_id",
      "Account.opened_at",
    ],
    check: ({ Transaction, Transfer, Account }) => {
      for (const transaction of Transaction) {
        const account = FindRef.execute({
          documents: Account,
          id: transaction.account_id,
          from: "Transaction.account_id",
        });

        expect(transaction.posted_at.getTime()).toBeGreaterThanOrEqual(
          account.opened_at.getTime(),
        );
      }

      for (const transfer of Transfer) {
        const source = FindRef.execute({
          documents: Account,
          id: transfer.source_account_id,
          from: "Transfer.source_account_id",
        });
        const destination = FindRef.execute({
          documents: Account,
          id: transfer.destination_account_id,
          from: "Transfer.destination_account_id",
        });

        expect(transfer.created_at.getTime()).toBeGreaterThanOrEqual(
          source.opened_at.getTime(),
        );
        expect(transfer.created_at.getTime()).toBeGreaterThanOrEqual(
          destination.opened_at.getTime(),
        );
      }
    },
  },
  {
    id: "R11",
    text: "Every customer's document_number and every account's iban are unique",
    fields: ["Customer.document_number", "Account.iban"],
    check: ({ Customer, Account }) => {
      const documentNumbers = Customer.map((customer) => {
        return customer.document_number;
      });

      expect(new Set(documentNumbers).size).toBe(documentNumbers.length);

      const ibans = Account.map((account) => account.iban);

      expect(new Set(ibans).size).toBe(ibans.length);
    },
  },
  {
    id: "R12",
    text: "Only customers with a verified kyc_status have loans",
    fields: ["Loan.customer_id", "Customer.kyc_status"],
    check: ({ Loan, Customer }) => {
      for (const loan of Loan) {
        const customer = FindRef.execute({
          documents: Customer,
          id: loan.customer_id,
          from: "Loan.customer_id",
        });

        expect(customer.kyc_status).toBe(KycStatus.Verified);
      }
    },
  },
  {
    id: "R13",
    text: "Every account has exactly one statement",
    fields: ["AccountStatement.id", "Account.id"],
    check: ({ Account, AccountStatement }) => {
      expect(AccountStatement).toHaveLength(Account.length);

      for (const account of Account) {
        const statements = AccountStatement.filter((statement) => {
          return statement.id === account.id;
        });

        expect(statements).toHaveLength(1);
      }
    },
  },
  {
    id: "R14",
    text: "Every account opens on or after its customer's created_at",
    fields: ["Customer.created_at", "Account.customer_id", "Account.opened_at"],
    check: ({ Customer, Account }) => {
      for (const account of Account) {
        const customer = FindRef.execute({
          documents: Customer,
          id: account.customer_id,
          from: "Account.customer_id",
        });

        expect(account.opened_at.getTime()).toBeGreaterThanOrEqual(
          customer.created_at.getTime(),
        );
      }
    },
  },
];
