# Security and Financial Integrity

## Identity and authorization

Authentication establishes a stable principal; authorization is checked by application use cases for every object and operation. Membership status, role, and reviewer designation are read from trusted persisted state. Group IDs supplied by clients are selectors, not proof of access. Apply group-scoped checks to all commands, report queries, receipt fetches, and notification details (FR-013).

The MVP authentication adapter must store no plaintext passwords, use a vetted password hashing library and current parameters, protect local credential data, and rate-limit repeated attempts. Exact password policy, account recovery, MFA, session lifetime, and external identity provider are unresolved. Future hosted deployment must use TLS, secure session/token handling, secrets management, least-privilege service/database credentials, and security logging that excludes credentials and receipt contents.

Roles should be minimal: group admin, reviewer (if distinct), member. Authorization matrix and whether creator may approve are product decisions; default design prohibits self-approval and reserves approval/rejection to designated reviewers. Invitation acceptance binds to the intended account. Error responses avoid confirming another user's account or group membership.

## Integrity controls

| Risk | Control |
|---|---|
| Duplicate approval creates duplicate balance changes | Atomic state transition with expected version; unique posting key `(expenseId, approved)`; reject repeated transitions idempotently. |
| Double payment processing | Unique idempotency key, payment state machine, unique ledger source key, transactional posting. |
| Concurrent settlement overspends balance | Re-read/lock outstanding allocation in transaction or use serializable/optimistic retry policy; compare expected balance/version at commit. |
| Partial DB update | Single DB transaction for state, ledger, audit, idempotency, and outbox. |
| Notification/provider outage | Transactional outbox; retry independently after commit; deduplicate by event ID. |
| Receipt uploaded but expense fails | Staged upload and cleanup/reconciliation job; DB stores finalized key only after safe workflow. |
| Rounding drift | Exact decimal arithmetic, deterministic participant order, final participant absorbs remainder, invariant that shares sum exactly to total. |
| History silently changed | Append-only ledger and approval/payment records; corrections are reversals plus replacement, with actor/reason/time. |
| Unauthorized report or receipt access | Query-scoped authorization before data return; private storage; opaque keys; audit access where appropriate. |

## Financial policies

Use `BigDecimal` with an explicit scale and rounding mode. Expense total is positive and stored at currency scale. Equal and percentage allocations round each non-final share to two decimal places using the chosen documented mode (`HALF_UP` proposal); final share equals total minus prior rounded shares. Percentage inputs must total exactly 100% at their accepted precision. Preserve percentage values, participant order, calculation version, and result shares for traceability.

Only approval can post expense ledger entries. Rejection has no balance effect. Payment posting references a valid outstanding obligation and produces equal/opposite postings. The ledger is the source of truth; pairwise balances are derived as net signed entries. Every posting group must sum to zero by currency. Reports state their `asOf` point and include only authorized facts.

The constitution requires BigDecimal; database decimal precision and rounding proposal above are implementation decisions to confirm. Do not introduce multi-currency conversion until FX rate source, time, rounding, and liability ownership are specified.

## Audit and privacy

Keep actor, event time, correlation ID, source aggregate, decision, and reversal links for sensitive state changes. Audit data should explain who submitted, approved/rejected, posted, paid, and corrected. Define retention, account deletion/anonymization, notification content, export policy, and receipt retention before production. Avoid logging credentials, access tokens, full payment details, or receipt image bytes.

## Consistency and recovery

The database is authoritative for business facts. A failed approval/payment transaction leaves neither state transition nor ledger posting. Outbox delivery is at least once and deduplicated; user-facing status distinguishes recorded from externally delivered notification. Migrations and backups are versioned and recovery-tested. For local desktop, protect and back up both SQLite data and associated receipt directory; for hosted service, define encrypted backup retention and recovery objectives before launch.

## Threat and integrity review checklist

Before release, verify group isolation, reviewer authorization, IDOR resistance, SQL injection resistance, credential storage, local data protection, receipt path safety, input bounds, transaction rollback, concurrent payment behavior, duplicate command behavior, ledger balancing, migration recovery, and backup restore. These are implementation verification obligations, not claims that this design alone makes the system secure.
