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

## Business rules encoded in the schemas

- **Money uses `decimal.js`, never raw `number` arithmetic.** Every derived amount (`overdraft_limit`, transaction/transfer amounts, installment amounts, statement totals) is computed through a `Decimal`, rounded to 2 places before being stored. Rules compare amounts as 2-decimal strings (`.toFixed(2)`) with `toBe`, never `toBeCloseTo`.
- **Account**: `overdraft_limit` is always `0` for `savings`, 0–1000 for `checking`, 0–5000 for `credit`. `opened_at` is on or after its customer's `created_at`.
- **Transaction**: an account's first transaction is always a `deposit` (credit), so every account starts with a positive balance before any debit is possible. A `withdrawal`/`fee` is only chosen once the account's running balance plus its `overdraft_limit` leaves at least 50 of room, and its `amount` never exceeds that room — the mechanism that keeps R5 (no balance below `-overdraft_limit`) an actual invariant instead of a probabilistic hope.
- **Transfer**: `source_account_id`'s `where` only accepts an `active` account that currently has at least 10 of room (its `Transaction` balance plus every other transfer already committed against it, plus its `overdraft_limit`); `destination_account_id`'s `where` rejects the source itself, non-`active` accounts, and a different currency. `amount` is capped by the source's room the same way `Transaction` caps a debit.
- **TransferLeg**: `documents` is dynamic (2 × `Transfer.length`). `transfer_id`'s `where` only accepts a transfer that doesn't have both legs yet; `kind` is `debit` unless the transfer already has a debit leg, in which case it's `credit`; `account_id` and `amount` are derived from the transfer (source/destination, and its `amount`).
- **Card**: `account_id`'s `where` rejects `savings` accounts.
- **Loan**: `customer_id`'s `where` only accepts a `verified` customer.
- **LoanInstallment**: `documents` is dynamic (the sum of every loan's `term_months`). `loan_id`'s `where` only accepts a loan that doesn't have all of its installments yet (a per-loan counter cached per document, the same "fewest/least assigned so far" family of pattern the hospital and airline cases use for performance). `number` is that loan's installment count so far, plus one. `amount` is the loan's principal plus simple interest over its term, divided evenly across `term_months`, with the **last** installment taking whatever the even division didn't — so the sum is exact by construction, never by chance.
- **AccountStatement**: `id` is a unique ref to `Account.id` (the same 1:1 "table inheritance" pattern as `Client`/`Student`/`Teacher` in the other cases). `credits`/`debits` sum every `Transaction` and `TransferLeg` that touches the account; `balance` is their exact difference.

## Validations (in [banking.test.ts](banking.test.ts))

- An account statement's `balance` equals `credits − debits` exactly (2-decimal string equality).
- The global sum of `TransferLeg` debits equals the global sum of credits; every transfer has exactly one debit leg and one credit leg, each for its amount.
- A transfer's source and destination accounts differ and share the same currency.
- No account's balance falls below its (negative) `overdraft_limit`.
- A loan's installments sum exactly to principal plus interest; their `due_date`s are monthly and consecutive; `number` runs 1..`term_months` without gaps or repeats.
- No card belongs to a `savings` account.
- Every transaction and transfer happens on or after its account's opening, which in turn is on or after its customer's `created_at`.
- `document_number` and `iban` are each unique.
- Only `verified` customers have loans.
- Every account has exactly one statement.
