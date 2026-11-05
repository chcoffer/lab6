# Application Use Cases

Use cases are inbound ports implemented by application handlers. They accept immutable command/query records and return result DTOs or typed failures. The authenticated principal is supplied by the adapter's trusted session context, never accepted as an authoritative user ID in request data. Every use case declares authorization and transaction scope.

## Use-case catalog

| Use case | Input → output | Rules, authorization, dependencies | Transaction / failure cases |
|---|---|---|---|
| `RegisterUser` | email/profile/password credential request → `UserView` | Validate unique normalized identity; password handling delegated to auth port; no password in domain DTO | User/auth transaction; duplicate identity, weak/invalid credential, provider failure |
| `AuthenticateUser` | credential request → session/token result | Auth adapter verifies credential; rate limits and generic failure response; never return secret | Auth provider boundary; invalid credentials, locked account, unavailable provider |
| `CreateGroup` | name/currency/policy → `GroupView` | Authenticated user becomes initial admin; valid currency/name | Group and owner membership atomic; invalid input, duplicate/request conflict |
| `InviteGroupMember` | group, invitee identity → invitation view | Active admin/member per group policy; invitation idempotency; disclose minimal data | Invitation and outbox atomic; forbidden, duplicate, group not found |
| `ApproveGroupMembership` | invitation/membership ID, decision → membership view | Designated admin; acceptance binds invited identity; prevent duplicate transitions | Membership state + audit + outbox atomic; stale invitation, unauthorized, already decided |
| `CreateExpense` | group, payer, date, amount, split, participants, receipt → draft view | Active group member; positive Money; participants/payer are members; compute immutable shares; upload receipt via staged object reference | Save expense, receipt metadata, notification outbox atomically where feasible; receipt upload failure, invalid split, stale membership |
| `SubmitExpenseForApproval` | expense ID/version → pending view | Creator or authorized editor; validate complete snapshot; policy requires reviewer | Versioned state transition transaction; stale version, invalid state, no eligible reviewer |
| `ApproveExpense` | expense ID/version, decision note → approved view | Designated reviewer, self-approval disallowed by default; approval once only | Expense transition + approval record + ledger posting + outbox atomic; duplicate, unauthorized, conflict |
| `RejectExpense` | expense ID/version, reason → rejected view | Designated reviewer; reason required by default | State + approval record + notification outbox atomic; already decided, unauthorized, conflict |
| `CalculateExpenseSplit` | total, method, ordered participants → allocations | Pure domain policy; no persistence; exact currency and rounding | No transaction; invalid amount/percent/participants |
| `RetrieveBalances` | group/filter → pairwise and net balance view | Active member; expose only authorized group; derived from ledger/projection | Read-only consistent snapshot; forbidden, group missing |
| `RecordPayment` | group, payer, payee, amount, outstanding reference, idempotency key → payment view | Active members; positive amount, same currency; no overpayment by default; actor may record only permitted sides | Payment state + ledger posting + outbox atomic; duplicate key, stale balance, unauthorized, overpayment |
| `GenerateReport` | group/date range/filters → report DTO/export stream | Active member; scope filter; totals reconcile to ledger and source facts | Read-only snapshot; range too broad, invalid filter, forbidden |
| `RetrieveNotifications` | recipient, cursor/page → notification list | Principal can retrieve only own inbox; group access rechecked on detail | Read-only; invalid cursor, unavailable delivery status |

## Cross-cutting command contract

Every write command has a command ID/idempotency key, authenticated actor, correlation ID, and expected aggregate version where applicable. The application checks authorization before data is returned or mutated, validates domain state, opens a transaction, writes aggregate changes and ledger/outbox entries, then commits. External delivery does not run inside a database transaction; a worker retries outbox records. Retries with the same key return the original outcome; same key with different payload fails as conflict.

## Transaction boundaries

- Approval: state transition, immutable approval record, deterministic ledger entries, and outbox messages commit together.
- Payment posting: payment accepted/posted state, settlement ledger entries, idempotency record, and outbox commit together.
- Expense submission: expense pending state plus notification outbox commit together. Receipt bytes are staged before the DB transaction and finalized/garbage-collected with a recoverable workflow; the database stores metadata/hash only.
- Membership approval: membership transition, audit record, and invitation notification outbox commit together.
- Reports: read-only transaction/snapshot, with a stated `asOf` timestamp; projections must reconcile to ledger source entries.

## Query vs command shape

Keep report/read DTOs separate from domain aggregates to avoid loading full histories for screens. Read models can be SQL projections over the immutable ledger and expense/payment records. For the MVP, synchronous projection queries are sufficient. Introduce a materialized balance projection only if measured query cost requires it; update it in the same transaction or rebuild deterministically from ledger entries.
