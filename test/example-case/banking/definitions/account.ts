import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { AccountStatus, AccountType, Currency } from "../types";

export const ACCOUNT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  customer_id: chaca.ref("Customer.id"),
  iban: ({ store }) => {
    const index = store.currentDocuments().length + 1;

    return `ES${String(index).padStart(20, "0")}`;
  },
  type: chaca.enum([
    AccountType.Checking,
    AccountType.Savings,
    AccountType.Credit,
  ]),
  currency: chaca.enum([Currency.Eur, Currency.Usd]),
  overdraft_limit: ({ currentFields }) => {
    if (currentFields.type === AccountType.Savings) {
      return 0;
    }

    const max = currentFields.type === AccountType.Checking ? 1000 : 5000;

    return new Decimal(modules.datatype.float({ precision: 2, min: 0, max }))
      .toDecimalPlaces(2)
      .toNumber();
  },
  opened_at: async ({ currentFields, store }) => {
    const customers = await store.get("Customer");
    const customer = FindRef.execute({
      documents: customers,
      id: currentFields.customer_id,
      from: "Account.customer_id",
    });

    return modules.date.between({ from: customer.created_at, to: new Date() });
  },
  status: chaca.probability([
    { value: AccountStatus.Active, chance: 0.8 },
    { value: AccountStatus.Frozen, chance: 0.1 },
    { value: AccountStatus.Closed, chance: 0.1 },
  ]),
});
