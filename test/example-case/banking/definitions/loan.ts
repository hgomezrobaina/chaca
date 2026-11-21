import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import { KycStatus, LoanStatus } from "../types";

export const LOAN_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  customer_id: chaca.ref("Customer.id", {
    where: ({ refFields }) => {
      return refFields.kyc_status === KycStatus.Verified;
    },
  }),
  principal: () =>
    new Decimal(modules.datatype.float({ precision: 2, min: 1000, max: 50000 }))
      .toDecimalPlaces(2)
      .toNumber(),
  annual_rate: () =>
    new Decimal(modules.datatype.float({ precision: 4, min: 0.02, max: 0.15 }))
      .toDecimalPlaces(4)
      .toNumber(),
  term_months: () => modules.datatype.int({ min: 6, max: 60 }),
  granted_at: () => modules.date.past({ years: 5 }),
  status: chaca.probability([
    { value: LoanStatus.Active, chance: 0.6 },
    { value: LoanStatus.PaidOff, chance: 0.3 },
    { value: LoanStatus.Defaulted, chance: 0.1 },
  ]),
});
