import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import type { DatasetStore } from "../../../../src/core/dataset-store/dataset-store";
import { FindRef } from "../../core/find-ref";
import {
  BankingTransaction,
  MovementDirection,
  TransactionKind,
} from "../types";

/**
 * A withdrawal/fee can only be chosen once the account has enough room
 * (balance so far + overdraft_limit) to absorb a meaningful debit. Without
 * this, a lone early withdrawal could push a fresh account straight past
 * its overdraft limit — the one invariant (R5/c6) this whole case exists
 * to prove.
 */
const MINIMUM_ROOM_FOR_DEBIT = 50;
const MAX_CREDIT_AMOUNT = 2000;
const MAX_DEBIT_AMOUNT = 300;

const priorTransactionsOf = (
  store: DatasetStore,
  accountId: string,
  selfId: string,
): BankingTransaction[] => {
  return store
    .currentDocuments<BankingTransaction>()
    .filter((t) => t.account_id === accountId && t.id !== selfId);
};

const runningBalance = (priorTransactions: BankingTransaction[]): Decimal => {
  return priorTransactions.reduce((sum, t) => {
    return t.direction === MovementDirection.Credit
      ? sum.plus(t.amount)
      : sum.minus(t.amount);
  }, new Decimal(0));
};

export const TRANSACTION_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  account_id: chaca.ref("Account.id"),
  kind: async ({ currentFields, store }) => {
    const prior = priorTransactionsOf(
      store,
      currentFields.account_id,
      currentFields.id,
    );

    if (prior.length === 0) {
      return TransactionKind.Deposit;
    }

    const accounts = await store.get("Account");
    const account = FindRef.execute({
      documents: accounts,
      id: currentFields.account_id,
      from: "Transaction.account_id",
    });

    const room = runningBalance(prior).plus(account.overdraft_limit);

    if (room.lessThan(MINIMUM_ROOM_FOR_DEBIT)) {
      return chaca.utils.oneOfArray([
        TransactionKind.Deposit,
        TransactionKind.Interest,
      ]);
    }

    return chaca.utils.oneOfArray([
      TransactionKind.Deposit,
      TransactionKind.Withdrawal,
      TransactionKind.Fee,
      TransactionKind.Interest,
    ]);
  },
  direction: ({ currentFields }) => {
    return currentFields.kind === TransactionKind.Deposit ||
      currentFields.kind === TransactionKind.Interest
      ? MovementDirection.Credit
      : MovementDirection.Debit;
  },
  amount: async ({ currentFields, store }) => {
    if (currentFields.direction === MovementDirection.Credit) {
      const value = modules.datatype.float({
        precision: 2,
        min: 10,
        max: MAX_CREDIT_AMOUNT,
      });

      return new Decimal(value).toDecimalPlaces(2).toNumber();
    }

    const accounts = await store.get("Account");
    const account = FindRef.execute({
      documents: accounts,
      id: currentFields.account_id,
      from: "Transaction.account_id",
    });

    const prior = priorTransactionsOf(
      store,
      currentFields.account_id,
      currentFields.id,
    );
    const room = runningBalance(prior).plus(account.overdraft_limit);
    const max = Decimal.min(room, MAX_DEBIT_AMOUNT).toNumber();

    const value = modules.datatype.float({ precision: 2, min: 1, max });

    return new Decimal(value).toDecimalPlaces(2).toNumber();
  },
  posted_at: async ({ currentFields, store }) => {
    const accounts = await store.get("Account");
    const account = FindRef.execute({
      documents: accounts,
      id: currentFields.account_id,
      from: "Transaction.account_id",
    });

    return modules.date.between({ from: account.opened_at, to: new Date() });
  },
  description: () => modules.lorem.words(),
});
