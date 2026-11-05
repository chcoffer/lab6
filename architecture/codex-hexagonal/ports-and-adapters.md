# Ports and Adapters

Ports are application-owned interfaces expressed in domain/application types. Adapters implement those interfaces and translate to Swing, SQL, filesystem, or provider protocols. Avoid generic CRUD ports that expose storage mechanics to use cases.

## Inbound ports

Inbound ports are the use cases in `application-use-cases.md`: account, group, membership, expense, approval, split calculation, balance, payment, reporting, and notification queries. Each is callable by the Swing adapter in the MVP and can later be mapped to an HTTP API. The API adapter must authenticate independently and construct the same trusted principal context; it must not bypass use-case authorization.

## Outbound ports

| Port | Contract |
|---|---|
| `UserRepository` | Load/save account profile and status by stable ID; enforce unique normalized identity at persistence boundary; no credential secrets. |
| `GroupRepository` | Load group policy and membership state; persist membership/group transitions with version checks. |
| `ExpenseRepository` | Save/load expense snapshots, participants, and approvals; support atomic state transition and duplicate-safe approval lookup. |
| `PaymentRepository` | Save/load payment lifecycle and idempotency record; query settlement references. |
| `LedgerRepository` | Append immutable balanced entries; enforce unique source posting keys; query entries and pairwise balances. |
| `NotificationOutbox` | Insert notification request in the same transaction as business change; claim/retry by worker. |
| `NotificationDelivery` | Deliver an already-authorized notification to a destination; idempotent by event and recipient. |
| `ReceiptStorage` | Stage, finalize, fetch, and delete an opaque receipt object; return key/hash/media metadata, never public URL by default. |
| `AuthenticationPort` | Register, authenticate, revoke/verify session; return principal identity and authentication metadata. Credentials remain outside domain persistence. |
| `ReportQuery` | Produce scoped, date-filtered report DTOs from source records and ledger at an `asOf` point. |
| `UnitOfWork` | Begin/commit/rollback one application transaction spanning repositories sharing a database connection. |
| `Clock` / `IdGenerator` | Deterministic time and stable ID creation for testability and idempotency. |

## Adapters

| Adapter | MVP/future role | Boundary behavior |
|---|---|---|
| Swing presentation | MVP inbound | Calls use cases; maps forms and typed outcomes to UI; background work off EDT; no financial calculations in widgets. |
| JDBC persistence | MVP outbound | Implements repositories and unit of work; maps decimals without float conversion; parameterized SQL; migrations and FK constraints. |
| SQLite database | MVP local storage | One local database per installation/user profile; transaction and migration support; do not place DB on a shared network drive. |
| PostgreSQL persistence | Hosted future outbound | Shared server-side database for multiple concurrent clients; same repository contracts, separate adapter/configuration. |
| Local receipt store | MVP outbound | Private application directory, generated opaque file names, size/type checks, hashes, no path traversal. |
| Object storage | Hosted future outbound | Private bucket/container, scoped short-lived access after application authorization. |
| In-app notification | MVP outbound | Durable inbox records; can show new expenses to every group member. |
| Email/push provider | Future outbound | Asynchronous outbox consumer with retries, provider failure isolation, opt/consent policy to be defined. |
| Authentication | MVP adapter | Local account/password verifier if required; future identity provider adapter can replace it. Password hashing algorithm and recovery flows must be selected before implementation. |
| Reporting query | MVP outbound | SQL-backed scoped projections; exports are generated from authorized DTOs. |
| HTTP API | Future inbound | Versioned transport adapter; same application ports; authentication, authorization, request limits, and audit context at boundary. |

## Failure and delivery semantics

Database and domain writes are transactional. External image storage and notification delivery cannot join the SQL transaction. Use staged receipt writes and a transactional outbox, plus cleanup/retry operations. Delivery is at least once; adapters and consumers deduplicate on event ID. The notification inbox is durable; email/push delivery is supplementary and future scope.
