import { DatasetSchema } from "../../../../src";
import { ACCOUNT_SCHEMA } from "./account";
import { ACCOUNT_STATEMENT_SCHEMA } from "./account-statement";
import { CARD_SCHEMA } from "./card";
import { CUSTOMER_SCHEMA } from "./customer";
import { LOAN_SCHEMA } from "./loan";
import { LOAN_INSTALLMENT_SCHEMA } from "./loan-installment";
import { TRANSACTION_SCHEMA } from "./transaction";
import { TRANSFER_SCHEMA } from "./transfer";
import { TRANSFER_LEG_SCHEMA } from "./transfer-leg";

export const BANKING_SCHEMAS: DatasetSchema[] = [
  { documents: 120, name: "Customer", schema: CUSTOMER_SCHEMA },
  { documents: 180, name: "Account", schema: ACCOUNT_SCHEMA },
  { documents: 600, name: "Transaction", schema: TRANSACTION_SCHEMA },
  { documents: 150, name: "Transfer", schema: TRANSFER_SCHEMA },
  {
    documents: async ({ store }) => {
      const transfers = await store.get("Transfer");

      return transfers.length * 2;
    },
    name: "TransferLeg",
    schema: TRANSFER_LEG_SCHEMA,
  },
  { documents: 140, name: "Card", schema: CARD_SCHEMA },
  { documents: 50, name: "Loan", schema: LOAN_SCHEMA },
  {
    documents: async ({ store }) => {
      const loans = await store.get("Loan");

      return loans.reduce((total, loan) => total + loan.term_months, 0);
    },
    name: "LoanInstallment",
    schema: LOAN_INSTALLMENT_SCHEMA,
  },
  {
    documents: 180,
    name: "AccountStatement",
    schema: ACCOUNT_STATEMENT_SCHEMA,
  },
];
