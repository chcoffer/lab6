# Technology Decisions

## Constraints from project governance

Java 21, Maven, Java Swing for the desktop implementation, JUnit 5, object-oriented domain separation, and `BigDecimal` for money are mandatory under `.specify/memory/constitution.md`. These are treated as project constraints. The full feature specification additionally requires web, Android, and iOS product access; they are future adapters and not part of the Swing MVP implementation.

## Decision records

### ADR-01: Clean architecture with ports and adapters

**Decision:** Use a domain core, application use cases, and infrastructure/presentation adapters with inward dependencies.

**Reason:** It allows Swing to stay thin, isolates money/approval rules for JUnit testing, and lets a future HTTP adapter reuse use cases. **Alternatives:** simple layered MVC (less ceremony, adequate for MVP); microservices (rejected as needless operational complexity). **Trade-off:** more interfaces and mapping. Keep module count small and ports tied to actual use cases.

### ADR-02: Modular monolith, not distributed services

**Decision:** Deploy one desktop process for MVP; later a single server-side modular application can serve web/mobile.

**Reason:** No independent scaling or team boundaries are established. Separate modules preserve code boundaries without distributed transactions. **Risk:** future scale may require extraction, but there is no evidence for that now.

### ADR-03: SQLite MVP and PostgreSQL hosted profile

**Decision:** SQLite for local desktop persistence; PostgreSQL for future centralized, concurrent service persistence.

SQLite documentation positions it for local application storage and advises client/server database use where many network clients or concurrent writers are involved ([SQLite guidance](https://www.sqlite.org/whentouse.html)). PostgreSQL documents MVCC, isolation, row locking, and concurrency controls relevant to multi-client transactions ([PostgreSQL concurrency control](https://www.postgresql.org/docs/current/mvcc.html)). **Alternative:** PostgreSQL-only MVP would require provisioning a server and network dependency; SQLite-only future client/server use is a poor fit for shared remote data. **Trade-off:** two persistence adapters/migration paths; control with portable SQL, explicit schema migrations, and contract-level repository tests. Final choice depends on whether desktop MVP is standalone or centrally shared; current specification does not settle that deployment detail.

### ADR-04: Exact monetary values and immutable ledger

**Decision:** Java `BigDecimal`, exact decimal SQL columns, immutable ledger postings; balances are projections.

**Reason:** Directly supports constitution and FR-014 traceability. **Alternative:** mutable pairwise balance table as authority; rejected because it loses explanation and is vulnerable to duplicate updates. Projection may be added for query speed with rebuild support.

### ADR-05: Transactional outbox for notifications

**Decision:** Persist notification requests with the business transaction; deliver asynchronously.

**Reason:** A provider failure must not roll back an approved expense, and an expense commit must not silently omit notification intent. **Trade-off:** retries can deliver more than once, so consumers deduplicate. MVP may expose durable in-app notification records without email/push.

### ADR-06: Receipt objects outside relational rows

**Decision:** Store metadata and opaque key in SQL; bytes in private local storage for MVP, private object storage for hosted profile.

**Reason:** Keeps relational backups/queries manageable and supports future storage replacement. **Trade-off:** coordinated backup and cleanup are needed.

### ADR-07: Migration and dependency choices

**Recommendation:** Use a versioned migration tool compatible with Maven/JDBC (for example, Flyway or Liquibase) after verifying supported SQLite/PostgreSQL features and licensing. Use standard JDBC-compatible repository implementations; select connection pool only for hosted service where needed. Exact library versions are implementation-time decisions and should be pinned to Java 21 compatibility.

## Unresolved questions

1. Is the Swing MVP a standalone local app or a client to a centrally shared service? This determines whether SQLite is actually acceptable for MVP data sharing.
2. Is expense approval mandatory for every group/expense, configurable, or optional? FR-008 and the assumptions are not fully aligned; safe design default is always pending approval.
3. Can the creator approve their own expense? Proposed default: no.
4. What are currency scope, decimal scale, percentage precision, and rounding policy? Proposed MVP: one currency per group, two currency decimals, percentage scale four, `HALF_UP`, final-participant remainder.
5. Should payments that exceed outstanding debt be rejected, held as credit, or allocated across multiple creditors? Proposed MVP: reject above selected outstanding obligation.
6. What authentication/recovery model and data retention/deletion rules are required?
7. Are email/push notifications required at launch, or is durable in-app notification sufficient?
8. Which reports and export formats are required for initial release?
9. What backup retention and recovery time/data-loss objectives apply?

Resolve relevant decisions with product owners before implementing affected flows; document subsequent choices as ADR amendments rather than silently changing domain behavior.
