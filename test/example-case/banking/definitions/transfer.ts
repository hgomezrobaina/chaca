import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import type { DatasetStore } from "../../../../src/core/dataset-store/dataset-store";
import { FindRef } from "../../core/find-ref";
import {
  AccountStatus,
  BankingTransaction,
  BankingTransfer,
  MovementDirection,
} from "../types";

const MAX_TRANSFER_AMOUNT = 500;
const MINIMUM_ROOM_FOR_TRANSFER = 10;

const transactionBalanceOf = (
  transactions: BankingTransaction[],
  accountId: string,
): Decimal => {
  return transactions
    .filter((t) => t.account_id === accountId)
    .reduce((sum, t) => {
      return t.direction === MovementDirection.Credit
        ? sum.plus(t.amount)
        : sum.minus(t.amount);
    }, new Decimal(0));
};

const priorTransferEffectOn = (
  store: DatasetStore,
  accountId: string,
  selfId: string,
): Decimal => {
  return store
    .currentDocuments<BankingTransfer>()
    .filter((t) => t.id !== selfId)
    .reduce((sum, t) => {
      if (t.source_account_id === accountId) {
        return sum.minus(t.amount);
      }

      if (t.destination_account_id === accountId) {
        return sum.plus(t.amount);
      }

      return sum;
    }, new Decimal(0));
};

export const TRANSFER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  source_account_id: chaca.ref("Account.id", {
    where: async ({ refFields, currentFields, store }) => {
      if (refFields.status !== AccountStatus.Active) {
        return false;
      }

      const transactions = await store.get("Transaction");
      const room = transactionBalanceOf(transactions, refFields.id)
        .plus(priorTransferEffectOn(store, refFields.id, currentFields.id))
        .plus(refFields.overdraft_limit);

      return room.greaterThanOrEqualTo(MINIMUM_ROOM_FOR_TRANSFER);
    },
  }),
  destination_account_id: chaca.ref("Account.id", {
    where: async ({ refFields, currentFields, store }) => {
      if (refFields.id === currentFields.source_account_id) {
        return false;
      }

      if (refFields.status !== AccountStatus.Active) {
        return false;
      }

      const accounts = await store.get("Account");
      const source = FindRef.execute({
        documents: accounts,
        id: currentFields.source_account_id,
        from: "Transfer.source_account_id",
      });

      return refFields.currency === source.currency;
    },
  }),
  amount: async ({ currentFields, store }) => {
    const accounts = await store.get("Account");
    const transactions = await store.get("Transaction");
    const source = FindRef.execute({
      documents: accounts,
      id: currentFields.source_account_id,
      from: "Transfer.source_account_id",
    });

    const room = transactionBalanceOf(transactions, source.id)
      .plus(priorTransferEffectOn(store, source.id, currentFields.id))
      .plus(source.overdraft_limit);

    const max = Decimal.min(room, MAX_TRANSFER_AMOUNT);

    const value = modules.datatype.float({
      precision: 2,
      min: 1,
      max: max.toNumber(),
    });

    return new Decimal(value).toDecimalPlaces(2).toNumber();
  },
  created_at: async ({ currentFields, store }) => {
    const accounts = await store.get("Account");
    const source = FindRef.execute({
      documents: accounts,
      id: currentFields.source_account_id,
      from: "Transfer.source_account_id",
    });
    const destination = FindRef.execute({
      documents: accounts,
      id: currentFields.destination_account_id,
      from: "Transfer.destination_account_id",
    });

    const from = new Date(
      Math.max(source.opened_at.getTime(), destination.opened_at.getTime()),
    );

    return modules.date.between({ from, to: new Date() });
  },
  concept: () => modules.lorem.words(),
});
