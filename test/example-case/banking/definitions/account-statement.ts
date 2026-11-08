import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import { MovementDirection } from "../types";

export const ACCOUNT_STATEMENT_SCHEMA = chaca.schema({
  id: chaca.key(chaca.ref("Account.id", { unique: true })),
  closed_at: () => modules.date.past({ years: 1 }),
  credits: async ({ currentFields, store }) => {
    const transactions = await store.get("Transaction");
    const legs = await store.get("TransferLeg");

    const transactionCredits = transactions
      .filter(
        (t) =>
          t.account_id === currentFields.id &&
          t.direction === MovementDirection.Credit,
      )
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    const legCredits = legs
      .filter(
        (leg) =>
          leg.account_id === currentFields.id &&
          leg.kind === MovementDirection.Credit,
      )
      .reduce((sum, leg) => sum.plus(leg.amount), new Decimal(0));

    return transactionCredits.plus(legCredits).toDecimalPlaces(2).toNumber();
  },
  debits: async ({ currentFields, store }) => {
    const transactions = await store.get("Transaction");
    const legs = await store.get("TransferLeg");

    const transactionDebits = transactions
      .filter(
        (t) =>
          t.account_id === currentFields.id &&
          t.direction === MovementDirection.Debit,
      )
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    const legDebits = legs
      .filter(
        (leg) =>
          leg.account_id === currentFields.id &&
          leg.kind === MovementDirection.Debit,
      )
      .reduce((sum, leg) => sum.plus(leg.amount), new Decimal(0));

    return transactionDebits.plus(legDebits).toDecimalPlaces(2).toNumber();
  },
  balance: ({ currentFields }) => {
    return new Decimal(currentFields.credits)
      .minus(currentFields.debits)
      .toDecimalPlaces(2)
      .toNumber();
  },
});
