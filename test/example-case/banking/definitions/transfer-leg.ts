import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { MovementDirection } from "../types";

export const TRANSFER_LEG_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  transfer_id: chaca.ref("Transfer.id", {
    where: ({ refFields, store }) => {
      const legsSoFar = store
        .currentDocuments()
        .filter((leg) => leg.transfer_id === refFields.id).length;

      return legsSoFar < 2;
    },
  }),
  kind: ({ currentFields, store }) => {
    const hasDebit = store.currentDocuments().some((leg) => {
      return (
        leg.transfer_id === currentFields.transfer_id &&
        leg.kind === MovementDirection.Debit
      );
    });

    return hasDebit ? MovementDirection.Credit : MovementDirection.Debit;
  },
  account_id: async ({ currentFields, store }) => {
    const transfers = await store.get("Transfer");
    const transfer = FindRef.execute({
      documents: transfers,
      id: currentFields.transfer_id,
      from: "TransferLeg.transfer_id",
    });

    return currentFields.kind === MovementDirection.Debit
      ? transfer.source_account_id
      : transfer.destination_account_id;
  },
  amount: async ({ currentFields, store }) => {
    const transfers = await store.get("Transfer");
    const transfer = FindRef.execute({
      documents: transfers,
      id: currentFields.transfer_id,
      from: "TransferLeg.transfer_id",
    });

    return transfer.amount;
  },
});
