# Application Use Cases

Each use case is an application service operation exposed as an inbound port. It receives trusted principal context from authentication, validates authorization against persisted group state, invokes domain behavior, and coordinates the Unit of Work where writes are involved. Command DTOs do not accept an authoritative actor ID from user-editable fields.

| Use case | Input → result | Authorization and business rules | Atomic work / important failures |
|---|---|---|---|
| RegisterUser | Account details → account view | Unique normalized identity; authentication adapter handles secrets | Account and credential creation; duplicate identity |
| AuthenticateUser | Credentials → authenticated principal/session | Generic credential failure; rate limit | Authentication adapter operation |
| CreateGroup | Name, currency, policy → group view | Authenticated user becomes admin | Group and initial membership; invalid currency/name |
| InviteGroupMember | Group, invitee → invitation | Active admin/member per policy | Invitation, audit, notification outbox; unauthorized/duplicate |
| DecideMembership | Invitation, accept/decline → membership status | Designated group admin approves; invitation bound to account | Membership transition and audit/outbox; stale invite/conflict |
| CreateExpense | Group, payer, date, amount, details, split, participants, receipt → draft/pending view | Active member, payer and participants belong to group; validate positive total and split | Expense snapshot, allocations, receipt metadata, audit/outbox; invalid split/receipt/membership race |
| SubmitExpense | Expense/version → pending view | Creator or authorized editor; immutable complete snapshot | State transition + audit/outbox; invalid state/version |
| CalculateExpenseSplit | Amount, method, ordered participants → allocations | Pure domain calculation | No persistence; invalid total/percent/participant list |
| ApproveExpense | Expense/version → approved view | Designated reviewer; no self-approval under proposed policy | Expense state, approval record, balanced ledger entries, audit, outbox in one transaction; duplicate/stale/unauthorized |
| RejectExpense | Expense/version/reason → rejected view | Designated reviewer; no ledger posting | State, immutable decision, audit/outbox; duplicate/stale/unauthorized |
| RetrieveBalances | Group, filter → pairwise/net balances | Active group member only | Read-only ledger query; unauthorized/group missing |
| RecordPayment | Group, payer, payee, amount, date, idempotency key → Recorded payment | Active members, positive amount, matching currency; validate claimed settlement intent | Payment record, idempotency key, audit; duplicate/conflict/invalid amount |
| ConfirmSettlement | Payment/version → Confirmed payment | Authorized confirmer; verify still valid outstanding amount | Payment transition, balanced ledger entries, audit/outbox atomically; stale payment, over-settlement, duplicate |
| CancelPayment | Payment/version/reason → Cancelled payment | Authorized actor while unconfirmed | State and audit atomically; already confirmed requires reversal workflow |
| GenerateReport | Group/date/filter → report result | Active member and scoped query | Read-only consistent snapshot with as-of time; invalid range/unauthorized |
| RetrieveNotifications | Cursor/page → own inbox | Principal may read only own notifications; current group access applies to details | Read-only; invalid cursor |

## Shared write contract

Every mutating command carries a unique idempotency key and expected aggregate version where concurrent changes matter. A retry with the same key and same payload returns the prior result; key reuse with a different payload is a conflict. Authorization is checked within the operation and not inferred from prior UI state. Transaction and locking details are defined in [financial integrity](financial-integrity.md).

Notification delivery and receipt storage are external to a database commit. The use case writes outbox intent with business records. A worker delivers later and deduplicates by event/recipient. Receipt upload uses a staged object reference and compensating cleanup for orphaned files.

