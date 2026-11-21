# Banking case

A banking core: customers open accounts, move money through transactions and
transfers, hold cards, and take out loans with monthly installments.

This is the case that proves an exact sum invariant and two refs to the same
table with money involved (`Transfer.source_account_id` /
`destination_account_id`), which no other case exercises.

## Entities

| Entity             | Documents                     | Description                                                          |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------- |
| `Customer`         | 120                            | `document_number` is a unique sequence; `kyc_status` gates loans.     |
| `Account`          | 180                            | `iban` is globally unique; `overdraft_limit` depends on `type`.      |
| `Transaction`      | 600                            | A deposit/withdrawal/fee/interest movement on one account.           |
| `Transfer`         | 150                            | Moves money between two different accounts of the same currency.     |
| `TransferLeg`      | 2 per transfer                 | The debit (source) and credit (destination) side of a transfer.      |
| `Card`             | 140                            | Belongs to a non-`savings` account.                                  |
| `Loan`             | 50                             | Only `verified` customers can take one.                               |
| `LoanInstallment`  | the sum of every loan's `term_months` | One per month of the loan's term; the last absorbs rounding.   |
| `AccountStatement` | one per account                | `balance` is the exact credits − debits of `Transaction` + `TransferLeg`. |

## Schema

See [schema.md](./schema.md) for the full ER diagram, a field-by-field table per entity and the rule table — generated from the schema definitions, never hand-written.

## Business rules

Every rule below has its own assertion in [rules.ts](rules.ts) (the full, field-level list is the generated "Rules" table in [schema.md](./schema.md)).

1. **Money uses `decimal.js`, never raw `number` arithmetic**: every derived amount (`overdraft_limit`, transaction/transfer amounts, installment amounts, statement totals) is computed through a `Decimal`, rounded to 2 places before being stored. Rules compare amounts as 2-decimal strings (`.toFixed(2)`) with `toBe`, never `toBeCloseTo`.
2. **Account** (`Account.overdraft_limit`, `.type`, `.opened_at`, `Customer.created_at`): `overdraft_limit` is `0` for `savings`, 0–1000 for `checking`, 0–5000 for `credit`; `opened_at` is on or after its customer's `created_at`.
3. **No balance goes below its overdraft** (`Transaction.kind`, `.direction`, `.amount`, `AccountStatement.balance`, `Account.overdraft_limit`): an account's first transaction is always a `deposit`; a `withdrawal`/`fee` is only chosen once the running balance plus `overdraft_limit` leaves at least 50 of room, and its `amount` never exceeds that room — the mechanism that keeps this an actual invariant instead of a probabilistic hope.
4. **Transfer** (`Transfer.source_account_id`, `Account.status`, `Transfer.destination_account_id`, `.amount`, `Account.currency`): the source must be `active` with at least 10 of room; the destination excludes the source itself, non-`active` accounts, and a different currency; `amount` is capped by the source's room the same way a `Transaction` debit is.
5. **TransferLeg is the double entry of a transfer** (`TransferLeg.transfer_id`, `.kind`, `.account_id`, `.amount`, `Transfer.amount`): `documents` is 2 × the number of transfers; each transfer gets exactly one `debit` leg (the source) and one `credit` leg (the destination), each for the transfer's `amount`; the global sum of debits equals the global sum of credits.
6. **Card** (`Card.account_id`, `Account.type`): never belongs to a `savings` account.
7. **`Loan` only for verified customers** (`Loan.customer_id`, `Customer.kyc_status`): `customer_id`'s ref only accepts a `verified` customer.
8. **LoanInstallment sums exactly to principal plus interest** (`LoanInstallment.loan_id`, `.number`, `.due_date`, `.amount`, `Loan.principal`, `.annual_rate`, `.term_months`, `.granted_at`): `documents` is the sum of every loan's `term_months`; `number` runs 1..`term_months` without gaps or repeats; `due_date`s are monthly and consecutive; `amount` divides principal plus simple interest evenly, with the **last** installment taking whatever the even division didn't — so the sum is exact by construction, never by chance.
9. **`AccountStatement` is a 1:1 extension of accounts** (`AccountStatement.id`, `.credits`, `.debits`, `.balance`, `Account.overdraft_limit`): the same 1:1 "table inheritance" pattern as `Client`/`Student`/`Teacher` in the other cases; `credits`/`debits` sum every `Transaction` and `TransferLeg` touching the account, and `balance` is their exact difference, never below the account's (negative) `overdraft_limit`.
10. **Natural keys are unique** (`Customer.document_number`, `Account.iban`): each is globally unique.
