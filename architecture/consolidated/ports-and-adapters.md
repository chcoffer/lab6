# Ports and Adapters

Ports are application-owned interfaces using domain types and application DTOs. Adapters translate boundary protocols and storage representations. Define only ports needed by the use cases; avoid generic CRUD frameworks or interfaces that leak SQL concepts into the domain.

## Inbound adapters

| Adapter | Scope | Responsibilities |
|---|---|---|
| Swing MVC | MVP presentation | Views render; Controllers map events to use cases; view models format results. No authoritative money, approval, or authorization rules in Swing. |
| Future HTTP API | Future extension | Authenticates request, creates trusted principal context, maps versioned transport DTOs to the same use cases. Not part of MVP. |
| Future web/mobile clients | Future extension | Consume secured API; never connect directly to PostgreSQL. |

## Outbound ports

| Port | Contract |
|---|---|
| UserAccountPort | Load/save non-secret profile and account status by stable ID. |
| GroupRepository | Load group policy and membership state; persist version-checked changes. |
| ExpenseRepository | Persist immutable expense snapshot, participants, and approval state. |
| PaymentRepository | Persist payment lifecycle, expected version, and idempotency identity. |
| LedgerRepository | Append balanced immutable posting sets with unique source keys; query balances/history. |
| NotificationOutbox | Persist delivery intents atomically with business transaction; claim/retry after commit. |
| ReceiptStorage | Stage/finalize/fetch/delete opaque receipt objects; return key, hash, type, and size. |
| AuthenticationPort | Register/authenticate/revoke/verify credentials or session; return principal, not password data. |
| ReportQuery | Return authorized date/filter query results with a consistent as-of marker. |
| UnitOfWork | Scope repositories to one connection/transaction; commit or rollback. It owns transaction mechanics, not business decisions. |
| Clock / IdGenerator | Provide deterministic time and stable IDs for repeatability and idempotency. |

## Outbound adapters

The PostgreSQL/JDBC adapter maps decimal values without float conversion, applies migrations, foreign keys, unique keys, locking/version checks, and query scoping. The receipt adapter uses private storage and opaque keys. The notification adapter persists an inbox and outbox; external email/push delivery is a future channel. The authentication adapter keeps credential verification separate from the `User` domain entity.

The composition root wires adapters to use cases. One Maven module is sufficient; interfaces and packages establish boundaries without requiring independently deployed components. Repositories do not begin their own nested transactions: the application service begins a Unit of Work, invokes repository operations on that unit, and commits after all required records are written.

