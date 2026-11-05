# Report B — Codex / Clean + Hexagonal Architecture Review

**Review date:** 2026-11-05  
**Repository:** [chcoffer/lab6](https://github.com/chcoffer/lab6)  
**Verdict:** Stronger overall foundation; correct several implementation-critical issues before coding.

## 1. Executive summary

The Codex package is a coherent Clean/Hexagonal design with a framework-independent domain, application use cases, inbound/outbound ports, Swing and JDBC adapters, local receipt storage, notification delivery, and a future HTTP adapter. Its strongest contribution is that it translates financial correctness into explicit mechanisms: immutable ledger postings, derived balances, BigDecimal allocations, deterministic remainder handling, idempotency, aggregate versions, transaction boundaries, audit records, and a transactional outbox.

It also makes a pragmatic deployment distinction: SQLite for a single-install desktop profile, PostgreSQL behind a future hosted service, and no direct database connections from web/mobile clients. This is a better articulated path than a generic promise of future API reuse.

The main weakness is that this architecture is more elaborate than the immediate Swing MVP requires and contains at least one meaningful internal ambiguity: the domain model describes a payment as pending until payment confirmation/workflow policy is resolved, while the application use case and transaction section describe payment state and ledger posting as one atomic operation. It also assumes approval is required for every expense as a safe default, while the specification leaves group-level configurability open. Those decisions must be reconciled.

**Recommendation:** choose Codex as the target architecture, but keep it a lightweight modular monolith and resolve the payment/approval policies before implementation.

## 2. Architecture overview

Sources: [architecture-overview.md](architecture-overview.md), [domain-model.md](domain-model.md), [application-use-cases.md](application-use-cases.md), [ports-and-adapters.md](ports-and-adapters.md).

The dependency rule points inward: Swing/HTTP/SQL/files/provider adapters depend on application ports; application use cases coordinate authorization and transactions; domain entities/value objects/policies depend on neither infrastructure nor UI. The architecture names modules for domain, application, Swing adapter, persistence adapter, notification adapter, file adapter, and bootstrap, while explicitly allowing these to remain packages in a smaller build.

The use-case catalog covers registration/authentication, groups/invitations, expense draft/submission, approval/rejection, split calculation, balances, payments, reports, and notifications. Outbound ports include repositories, ledger, outbox/delivery, receipt storage, authentication, report query, UnitOfWork, Clock, and ID generation.

The package includes system-context, dependency, hexagonal, deployment, domain class, aggregate-boundary, and ER diagrams. They broadly agree with the written boundaries. The deployment diagram clearly distinguishes a local Swing/SQLite profile from a future hosted API/PostgreSQL profile.

## 3. Requirements coverage

| Requirement | Status | Evidence and gap |
|---|---|---|
| Accounts/login | Partial | RegisterUser/AuthenticateUser and AuthenticationPort; algorithm, recovery, MFA/session policy remain open. |
| Group creation/management | Addressed | CreateGroup, GroupRepository, Group aggregate. |
| Invitation-based membership approval | Addressed | InviteGroupMember/ApproveGroupMembership, invitation entity/table, role/status. |
| Expense creation | Addressed | CreateExpense includes payer, date, amount, split, participants, receipt. |
| Equal split | Addressed | ExpenseSplitPolicy and deterministic order/remainder. |
| Percentage split | Addressed | Percentage value object, 100% invariant and precision proposal. |
| Receipt image | Partial | ReceiptStorage port, staged/finalized storage, metadata/hash, authorization; retention and cleanup operations still require implementation. |
| Notifications | Addressed | Notification records, outbox, retry, deduplication; external channels remain future work. |
| Approval/rejection | Addressed | Dedicated use cases, reviewer checks, state version, immutable records, no posting on rejection. |
| Designated reviewers | Addressed | Trusted persisted roles and reviewer authorization; self-approval default explicitly proposed. |
| Balance tracking | Addressed | Immutable ledger is source of truth; balances are derived projections. |
| Payment/settlement | Partial | Use case and ledger design are strong; pending-vs-posted semantics and external payment confirmation are unresolved. |
| Reporting | Addressed | Scoped ReportQuery and date-range filters with as-of snapshot. |
| Data privacy/group isolation | Addressed with open work | Authorization at use-case/query/receipt boundary; retention/anonymization and deployment security remain unresolved. |
| Historical financial records | Addressed | Append-only ledger, approval/payment records, audit, reversals. |
| Web/Android/iOS | Partial | HTTP inbound adapter and shared use cases planned; hosted API, identity, storage, operations, and clients are future work. |
| Java Swing MVP | Addressed | Swing adapter calls the same use cases; background work off EDT is in roadmap. |

“Addressed” denotes design coverage, not implementation evidence.

## 4. Technical strengths

1. **Explicit dependency direction.** Domain is free of Swing, SQL, filesystem, and provider SDK types.
2. **Use-case contracts.** Each write/read flow has actor, authorization, transaction, and failure considerations.
3. **Financial source of truth.** Ledger entries are append-only; balances/reports are projections and can be rebuilt.
4. **Duplicate and concurrency controls.** Idempotency keys, unique posting keys, optimistic versions, locking, and retry constraints are specified.
5. **Reliable side effects.** Transactional outbox and staged receipt lifecycle account for external systems that cannot join a database transaction.
6. **Deployment realism.** Local SQLite is not misrepresented as multi-device synchronization; PostgreSQL is reserved for the hosted service.
7. **Explicit unknowns.** The architecture lists product decisions rather than disguising them as settled requirements.

## 5. Technical weaknesses

- **Payment lifecycle contradiction:** [domain-model.md](domain-model.md) says a payment may remain pending until authorized workflow/confirmation policy is resolved; [application-use-cases.md](application-use-cases.md) and [data-model.md](data-model.md) describe RecordPayment committing payment state and ledger postings atomically. Define whether “recorded payment” means user-attested settlement or externally confirmed transfer. Only confirmed/accepted settlement should reduce the debt, and the state machine must make that unambiguous.
- **Approval policy assumption:** the safe default is approval for all expenses, but spec.md Q1 and assumptions allow group-configurable processing. The design correctly flags this, but a final policy is required.
- **Abstraction cost:** multiple ports, DTOs, adapters, and possible Maven modules are more than a local Swing app strictly needs. The overview appropriately permits packages instead of modules; enforce only boundaries that provide actual value.
- **Currency/precision still proposed:** DECIMAL(19,2), percentage DECIMAL(7,4), HALF_UP, one currency per group are proposals, not all approved business decisions. Ensure database and Java validation match exactly.
- **Ledger posting representation needs a canonical example:** schema describes signed account/counterparty entries and net-zero transaction groups, but the exact debit/credit sign convention and payer's own share example should be included as a normative worked example.
- **Receipt/DB atomicity is necessarily eventual:** staged upload and cleanup are the right pattern, but failure reconciliation must be implemented and monitored.
- **Hosted operations are future work:** TLS, secrets, monitoring, backup/restore, rate limits, incident procedures, and service operations are listed but not delivered by architecture alone.

No circular dependency is evident in the written dependency diagrams. A risk would arise if adapters or SQL types leak inward; the design explicitly prohibits that.

## 6. Financial integrity assessment

| Control | Assessment |
|---|---|
| BigDecimal/exact decimal storage | Explicit in domain and data model. |
| Equal split | Deterministic participant order, per-share rounding, final participant absorbs remainder. |
| Percentage split | 0–100 range and total 100% invariant; accepted precision remains a decision. |
| Two-decimal rounding | Explicit HALF_UP proposal, to be confirmed. |
| Positive amounts | Explicit domain and DB constraints. |
| Approval before balance impact | Explicit; rejection creates no posting; duplicate approval prevented. |
| Payment settlement | Ledger-based and transactionally designed; lifecycle ambiguity must be resolved. |
| Historical records | Append-only ledger, reversal links, audit actor/time/reason. |
| Concurrency | Aggregate versions, transaction locks/retries, settlement revalidation. |
| Duplicate prevention | Idempotency keys and unique posting keys. |
| Partial failure/rollback | UnitOfWork atomically commits aggregate state, ledger, audit, idempotency, and outbox. |
| Notification failure | Outbox retry and event deduplication; delivery separated from business commit. |

**Conclusion:** Codex provides the strongest documented financial design. It still needs a precise payment state machine and worked posting examples, and implementation/tests must prove the controls. The architecture does not itself guarantee financial correctness.

## 7. Security assessment

The application receives a trusted principal from the adapter, checks authorization on every use case, scopes report/receipt/notification retrieval, and relies on persisted membership/reviewer roles rather than client-supplied group IDs. The design calls for password hashing, rate limits, generic auth failures, TLS and secure sessions in hosted mode, least privilege, private receipt storage, and safe audit metadata.

Open items include password policy/recovery/MFA, credential provider choice, creator self-approval, retention/anonymization, receipt retention, notification content, and hosted operational controls. These are properly identified, but must be decided before production.

## 8. Maintainability and testability

Domain policies and application use cases can be tested with fakes and deterministic Clock/ID ports; repository contract and integration tests can target the chosen database. The explicit UnitOfWork and typed failures improve testability. The design's principal maintainability risk is excessive abstraction for a small team. Start with a single Maven module and clear packages; split modules only when dependency enforcement justifies the overhead.

## 9. Java Swing MVP suitability

**Good, with discipline.** Swing is a primary adapter, not a home for business logic. The roadmap covers login, groups, invitations, expenses, approvals, balances, payments, notifications, and reports. Background use-case execution off the Swing Event Dispatch Thread is correctly called out. SQLite is suitable only for a local per-install profile; if the MVP must let several desktop clients share live group data, a server-side service/database is needed instead.

## 10. Future expansion readiness

Codex is better prepared for web/mobile because HTTP is explicitly another inbound adapter to the same application boundary. It also separates hosted PostgreSQL, private object storage, notification workers, and identity from desktop adapters. These capabilities are architectural extension points, not already deployed functionality. The future platform still requires API versioning, remote authentication/authorization, hosted operations, migration, monitoring, backup/recovery, and web/Android/iOS clients.

## 11. Architectural risks

- **High:** payment pending/posted/confirmed semantics conflict across domain and use-case descriptions.
- **High:** approval policy and self-approval must be decided; current safe default is not the only policy allowed by spec.
- **High:** concurrency/idempotency/ledger guarantees require real database integration and race-condition tests.
- **Medium:** over-abstraction/module proliferation could slow the Swing MVP.
- **Medium:** currency and percentage precision/rounding proposals need product sign-off.
- **Medium:** hosted identity, API security, backups, receipt lifecycle, and operational recovery remain future implementation obligations.
- **Low:** diagram notation and module/package choice should be normalized during implementation planning.

## 12. Weighted scoring

Scores use 1–10; higher is better. For implementation complexity, a higher score means lower/ more manageable complexity.

| Category | Weight | Score | Weighted points | Rationale |
|---|---:|---:|---:|---|
| Requirements coverage | 15% | 9 | 13.5 | All major flows mapped to use cases; some policies/platform functions remain future work. |
| Architectural correctness | 15% | 9 | 13.5 | Clear inward dependencies and coherent ports/adapters; payment lifecycle ambiguity remains. |
| Maintainability | 10% | 8 | 8.0 | Good boundaries; abstraction discipline needed. |
| Testability | 10% | 9 | 9.0 | Pure domain policies, fakes, Clock/ID ports, repository integration tests. |
| Financial integrity | 15% | 9 | 13.5 | Ledger, idempotency, transactions, audit, concurrency; payment lifecycle still open. |
| Security/authorization | 10% | 9 | 9.0 | Trusted principal, use-case authorization, scoped data access; production details remain. |
| Extensibility/scalability | 10% | 9 | 9.0 | Explicit future HTTP/hosted adapter path; not yet implemented. |
| Implementation complexity | 5% | 7 | 3.5 | More ceremony than layered MVC, mitigated by modular-monolith guidance. |
| Technology suitability | 5% | 8 | 4.0 | Java 21/Swing/JUnit compatible; DB profile decisions are sensible but require confirmation. |
| Documentation quality | 5% | 9 | 4.5 | Detailed, explicit assumptions, ports, transaction and security controls. |
| **Total** | **100%** |  | **88.5 / 100** | |

## 13. Specific recommended improvements

1. Define a payment state machine: recorded/claimed, confirmed/accepted, rejected/cancelled, reversed. State exactly which transition posts ledger entries and whether external transfer confirmation is in scope.
2. Add a worked ledger posting example for a three-person expense, including payer's own share, net-zero invariant, payment, and reversal.
3. Decide approval policy and creator self-approval rule; align domain policy, use cases, database constraints, and diagrams.
4. Confirm currency scope, percentage precision, rounding mode, and database decimal scale; encode one canonical policy in value objects and tests.
5. Keep one Maven module initially; enforce package-level inward dependencies and add modules only if useful.
6. Add integration tests for duplicate approval/payment, concurrent settlement, stale versions, rollback, and outbox retry.
7. Define account recovery, password policy, session lifetime, retention/anonymization, receipt retention, and production security operations.
8. Ensure receipt staged/finalized cleanup is recoverable and monitored; coordinate file/database backup.
9. Provide an API contract/versioning decision before web/mobile implementation; never expose DB access to clients.
10. Maintain traceability from each FR/MVP item to use case, test, and release evidence.

## 14. Overall verdict

**Preferred architecture.** Codex is the more complete and safer foundation because it specifies the mechanics that protect money and access rather than relying on service names or general transaction statements. Adopt it as a lightweight modular monolith, not as a mandate to create many Maven modules or microservices. Resolve payment lifecycle and approval policy before implementing ledger posting.
