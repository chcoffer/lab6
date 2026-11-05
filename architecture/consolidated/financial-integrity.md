# Financial Integrity

## Ledger is the financial authority

Every financial effect is an immutable, balanced ledger posting set in the canonical PostgreSQL database. Expense allocations and confirmed payments produce ledger entries. Pending/rejected expenses and recorded/unconfirmed payments do not. Balances are derived by summing signed entries by group, currency, account, and counterparty. No independently editable balance total exists. A cached projection is disposable and rebuildable.

Each entry has a stable ID, group, currency, source type/ID, unique posting key, account, counterparty, signed exact amount, effective date, recorded timestamp, actor, and optional reversal reference. Every posting set nets to zero per group/currency. An approved expense records payer credit against participants' obligations, netting the payer's own share. A confirmed payment records equal/opposite settlement postings between payer and payee.

## Splitting and money precision

Use `BigDecimal`, never binary floating point. The proposal is two decimal places and `HALF_UP` for each non-final share. Compute in deterministic participant order; assign the final participant the exact remainder so shares sum to the expense amount. Percentage totals must equal 100% at a defined percentage precision. Persist split method, input percentages, order, calculation version, and final allocations.

Proposed accepted percentage precision is four decimal places; currency precision beyond two decimals and non-USD currencies need confirmation. No foreign exchange conversion is defined.

## Expense posting and corrections

Approval transaction changes the expense from Pending to Approved, inserts the immutable approval record, creates one balanced ledger posting set, writes audit and outbox records, and commits atomically. A duplicate approval is rejected or returns the prior idempotent outcome; a unique source posting key prevents a second financial effect. Rejection records the reviewer and reason and creates no ledger entry. Approved expense facts are not edited; correction appends reversing entries and a replacement expense/posting with a reason and actor.

## Payment lifecycle and debt reduction

Payment states are `Recorded`, `Confirmed`, `Cancelled`, and `Reversed`. Recording captures the claimed transfer and intent but has no balance effect. Confirmation is the financial settlement event: within one transaction, the use case verifies authorization, current outstanding debt, amount and currency, transitions the payment, inserts balanced ledger entries, audit, and outbox records. Cancellation before confirmation has no ledger effect. A confirmed payment can only be corrected by a reversal and, if needed, a replacement payment.

Proposed policy rejects a payment greater than its selected outstanding obligation. The product must decide who may confirm, whether payer/payee confirmation is required, and how overpayments are handled. No bank transfer is initiated or verified by this architecture; “confirmed” means the application has accepted the settlement confirmation according to the policy eventually selected.

## Atomic operations and Unit of Work

| Operation | One transaction includes |
|---|---|
| Expense submission | Expense snapshot, participant allocations, audit, notification outbox intent |
| Expense approval | Expense state/version, approval record, ledger posting set, audit, outbox |
| Expense rejection | Expense state/version, rejection record, audit, outbox; no ledger |
| Membership decision | Membership transition, audit, invitation notification outbox |
| Payment recording | Payment `Recorded`, idempotency key, audit; no ledger |
| Settlement confirmation | Payment transition, ledger posting set, audit, idempotency result, outbox |

Application use cases decide which records must be atomic and invoke `UnitOfWork`. UnitOfWork owns begin/commit/rollback and ensures repositories share the same transaction/connection. Repositories perform persistence and constraints; they do not decide approval or settlement policy. On any failure before commit, all database effects roll back. External notification and receipt storage are not placed inside SQL transactions: use a transactional outbox, staged receipt storage, retries, deduplication, and cleanup.

## Idempotency and concurrency

Write commands carry an idempotency key and expected aggregate version. Store key plus request fingerprint and result; retry of identical payload returns same result, different payload conflicts. Enforce unique ledger posting keys by source. Use optimistic version checks for expense/payment transitions. During settlement confirmation, lock or otherwise serialize the outstanding obligation rows and recheck available amount in the transaction; retry known serialization conflicts with the same idempotency key. Never trust a balance read from a prior screen as current authorization to settle.

The concurrency isolation/locking configuration and retry limits are implementation decisions to validate for PostgreSQL. No multi-process file database or distributed transaction is proposed.

## Reports and reconciliation

Reports derive totals from approved expense snapshots, confirmed payment postings, and ledger entries in a consistent read snapshot with an `asOf` timestamp. Pending activity is identified separately and excluded from balances. Reconciliation verifies that each source has its expected unique postings and each posting group nets to zero. Historical reversals remain visible so current balances are explainable.

