# Technology Decisions

## Fixed project baseline

| Technology | Decision | Basis |
|---|---|---|
| Java | Java 21 | Constitution constraint |
| Build | Maven, one module | Constitution plus Spec Kit guidance; avoids needless module/build complexity |
| Presentation | Java Swing organized with MVC | Constitution and MVP requirements |
| Tests (eventual implementation) | JUnit 5 | Constitution requirement; this documentation task adds/runs no tests |
| Money | `BigDecimal` and exact SQL numeric values | Constitution and financial requirements |
| Architecture | Domain-centered Clean/Hexagonal boundaries | Selected Codex architecture, simplified to one module |

## Canonical database: PostgreSQL

PostgreSQL is the single canonical database for all authoritative shared data. The customer requirements include individual accounts, group activity, and future web/mobile access; these require one shared source of truth with concurrent access. The Spec Kit research also recommended PostgreSQL as canonical. This consolidation resolves contradictory SQLite MVP and H2 test suggestions by retaining neither as an alternate data store.

This is a technology recommendation, not a statement that PostgreSQL has been deployed, hardened, backed up, or proven production-ready. A future deployment decision must define hosting, TLS/network boundaries, credentials, migrations, connection limits, backup/restore, monitoring, recovery objectives, and operational ownership. Development and integration environments should use PostgreSQL-compatible schema and behavior; avoid H2 substitutions that can conceal differences. No separate database is prescribed for tests; an isolated PostgreSQL test instance is the reference configuration.

## Alternatives

| Alternative | Decision | Reason |
|---|---|---|
| SQLite | Not selected | Appropriate for local application files, but a separate file per desktop user cannot provide shared group balances. Shared network-file access is not the intended multi-user architecture. |
| H2 | Not selected | Useful embedded Java database, but an additional dialect/profile creates behavioral drift without a requirement for it. |
| PostgreSQL | Selected canonical | Shared relational source, transactions, constraints, and concurrency mechanisms fit the financial and multi-user context. Operational setup is a real cost and remains to be designed. |
| Microservices | Rejected | No independent scaling or ownership needs justify distributed operations/transactions. |
| Multiple Maven modules | Rejected initially | One module with package-level boundaries is simpler and supports the MVP; split only if concrete build/team needs arise. |

## Other choices

Use JDBC-oriented persistence behind repositories and Unit of Work; select a migration library only when implementation is authorized. Keep receipt image bytes in private object/file storage with relational metadata. Use a transactional outbox for reliable notification intent; email/push providers remain future adapters. Avoid selecting library versions, cloud providers, or operational topology in this documentation where requirements do not decide them.

