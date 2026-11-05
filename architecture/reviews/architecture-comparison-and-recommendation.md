# Report C — SplitSmart Comparative Architecture Analysis and Recommendation

**Review date:** 2026-11-05  
**Repository:** [chcoffer/lab6](https://github.com/chcoffer/lab6)  
**Decision:** **Option 4 — Adopt Architecture B (Codex) with selected simplicity and MVP sequencing from Architecture A (Spec Kit).**

## A. Side-by-side comparison

| Category | Spec Kit (A) | Codex (B) | Better approach | Explanation |
|---|---|---|---|---|
| Requirements mapping | Feature-aligned services/entities | Explicit use-case catalog and authorization/transaction notes | B | More complete mapping from user actions to rules and failure modes. |
| Architecture boundaries | Familiar layers in one Maven module | Domain/application/ports/adapters with inward dependencies | B | B states dependency direction and adapter contracts explicitly. |
| Swing MVP simplicity | Very approachable | More initial abstractions | A | A is easier to start; B should remain a single module initially. |
| Testability | JUnit service/domain tests | Pure policies, fakes, Clock/ID ports, repository contract tests | B | B makes test seams and dependencies explicit. |
| Financial correctness | BigDecimal and rounding; ledger details thin | Immutable ledger, derived balances, idempotency, locking, UnitOfWork | B | B addresses duplicate and partial updates more directly. |
| Authorization | Roles and service checks | Trusted principal and per-use-case scoped authorization | B | B makes client-supplied identity non-authoritative. |
| Notifications | NotificationService | Durable outbox, retries, deduplication | B | B addresses provider failure and at-least-once delivery. |
| Receipt handling | Optional path/reference | Storage port, staging, metadata/hash, authorization | B | B describes external storage failure boundaries. |
| Persistence/deployment | PostgreSQL production, H2 local/test; SQLite prototype mention | SQLite local install, PostgreSQL hosted service | B | B distinguishes local data from shared remote data. |
| Future web/mobile | Reusable service boundary, API conceptual | HTTP inbound adapter and hosted profile explicitly drawn | B | B has a clearer evolution path without claiming future clients already exist. |
| Complexity | Lower | Higher | A | A is simpler; B's complexity must be constrained. |
| Documentation | Strong Spec Kit artifacts and diagrams | More explicit technical contracts and risks | B | B documents transactions/security/ports more deeply; A remains useful for feature planning. |

## B. Weighted scores

Same weights and scoring rules are used in both standalone reports. Higher is better; for implementation complexity, a higher score means lower/more manageable complexity.

| Evaluation category | Weight | A score | A weighted | B score | B weighted |
|---|---:|---:|---:|---:|---:|
| Requirements coverage | 15% | 8 | 12.0 | 9 | 13.5 |
| Architectural correctness | 15% | 7 | 10.5 | 9 | 13.5 |
| Maintainability | 10% | 7 | 7.0 | 8 | 8.0 |
| Testability | 10% | 7 | 7.0 | 9 | 9.0 |
| Financial integrity | 15% | 6 | 9.0 | 9 | 13.5 |
| Security and authorization | 10% | 6 | 6.0 | 9 | 9.0 |
| Extensibility and scalability | 10% | 6 | 6.0 | 9 | 9.0 |
| Implementation complexity | 5% | 8 | 4.0 | 7 | 3.5 |
| Technology suitability | 5% | 8 | 4.0 | 8 | 4.0 |
| Documentation quality | 5% | 8 | 4.0 | 9 | 4.5 |
| **Total** | **100%** |  | **69.5 / 100** |  | **88.5 / 100** |

The 19-point advantage for B is driven primarily by financial integrity, authorization, explicit transaction design, and future platform boundaries—not by the Clean/Hexagonal labels.

## C. Requirements traceability matrix

Authoritative references: [UserRequirement.md](../UserRequirement.md), [constitution](../.specify/memory/constitution.md), and [feature specification](../specs/001-split-expense-tracking/spec.md). Status reflects documented design coverage, not implemented/tested functionality.

| Requirement | Spec Kit A | Codex B | Comparative finding |
|---|---|---|---|
| User accounts/authentication | Partial | Partial | Both name account/auth flows; B defines AuthenticationPort and trusted principal, but credential policy remains open. |
| Group creation/management | Addressed | Addressed | Both provide group service/use case and model. |
| Invitation-based membership | Addressed | Addressed | Both model invitation/approval; B gives clearer command boundary. |
| Expense creation | Partial | Addressed | A omits payer in its ERD/model; B captures payer explicitly. |
| Equal split | Addressed | Addressed | B has more deterministic algorithm detail. |
| Percentage split | Addressed | Addressed | Both validate 100%; B specifies Percentage value object and precision proposal. |
| Receipt images | Partial | Partial | B defines storage boundary and lifecycle; retention/cleanup implementation remains. |
| Notifications | Partial | Addressed | B's outbox/retry/deduplication is materially stronger. |
| Expense approval/rejection | Addressed | Addressed | Both model workflow; B defines versioning and posting effects. |
| Designated reviewers | Addressed | Addressed | B's trusted persisted role checks are clearer. |
| Balance tracking | Partial | Addressed | B defines ledger as authority and balances as projections. |
| Payment settlement | Partial | Partial | B has stronger controls but must resolve pending vs posted/confirmed. |
| Reporting | Addressed | Addressed | Both include date-range reports; B explicitly scopes queries and as-of snapshot. |
| Data privacy/group isolation | Partial | Addressed with open work | B defines authorization at each use-case/query/receipt boundary. |
| Historical financial records | Partial | Addressed | B has append-only ledger, reversals, and audit metadata. |
| Web/Android/iOS | Partial | Partial | Both defer clients; B's HTTP/hosted-service path is more concrete. |
| Java Swing MVP | Addressed | Addressed | A is simpler; B retains Swing as a thin inbound adapter. |

## D. Architectural trade-offs

### Where A is stronger
- Faster onboarding and less abstraction for a small Swing team.
- A direct, familiar layered package structure and a useful Spec Kit feature-planning package.
- More natural fit if the product were strictly a single-user/local desktop prototype.

### Where B is stronger
- Explicit dependency direction and ports owned by the application.
- Financial ledger, transaction, idempotency, concurrency, audit, and notification reliability controls.
- More defensible security model based on trusted principal context and per-use-case authorization.
- Clearer local-versus-hosted database and future API deployment separation.

### Which is simpler to implement?
**A.** Its single-module service/repository structure has less ceremony. But its simplicity is partly achieved by leaving important transactional and ledger questions unanswered. B can retain most of its correctness benefits without multiple Maven modules: use packages and a small number of ports.

### Which is easier to maintain?
**B, if kept lean.** Its boundaries reduce UI/database coupling and make changes to storage, notification providers, or transport less invasive. If every interface becomes a separate abstraction with no meaningful seam, A's simpler structure would be easier. Adopt B's principles, not maximal layering.

### Which provides stronger financial integrity?
**B.** It specifies append-only postings, derived balances, idempotency, optimistic versions/locking, UnitOfWork, rollback, and audit. B still needs a payment lifecycle resolution and worked ledger examples. A has correct BigDecimal and rounding intent but not enough machinery to prove safe concurrent/retried operations.

### Which is more appropriate for the Swing MVP?
**A is marginally simpler; B is still appropriate and safer.** The recommended design is B's domain/application core with a single Swing adapter and one local persistence adapter. Do not build web/mobile clients or hosted infrastructure in the MVP.

### Which is the better web/mobile foundation?
**B.** Its future HTTP adapter, server-side application, PostgreSQL, object storage, and notification worker boundaries are explicit. These are future capabilities requiring deployment and implementation, not existing product functionality.

## E. Risks and priority

### Architecture A — Spec Kit
- **Critical:** payer missing from Expense model/ERD despite FR-003.
- **High:** no authoritative immutable ledger/idempotent posting strategy; duplicate approvals/payments can cause discrepancies if implemented as mutable updates.
- **High:** cross-repository transaction ownership, concurrency, and rollback are not specified.
- **High:** approval bypass/configuration semantics are unresolved.
- **Medium:** duplicated approval ownership across ExpenseService and ApprovalService.
- **Medium:** PostgreSQL/H2/SQLite roles and desktop deployment are ambiguous.
- **Medium:** receipt storage, notification delivery reliability, and security lifecycle are thin.

### Architecture B — Codex
- **High:** payment pending/posted/confirmed semantics conflict between domain model and RecordPayment transaction behavior.
- **High:** approval configurability and self-approval policy need final decision.
- **High:** ledger, idempotency, and concurrency behavior require integration/race tests against the selected DB.
- **Medium:** extra ports/modules can overcomplicate the MVP if not constrained.
- **Medium:** currency/percentage precision, rounding, credential lifecycle, retention, and hosted operations remain decisions.
- **Low:** add a normative worked ledger example and normalize package/module diagrams.

## F. Recommendation

<ins>Adopt Architecture B with selected elements from Architecture A.</ins>

This is option **4: Adopt Architecture B with specific elements from Architecture A.**

Retain from Codex:
1. Domain/application separation and inward dependency rule.
2. Use-case-driven application boundary and trusted principal context.
3. Ports for persistence, receipt storage, authentication, notifications, and UnitOfWork where they provide actual substitution/test value.
4. Immutable ledger, derived balances, idempotency, transaction boundaries, concurrency checks, audit, and outbox.
5. Explicit SQLite-local / PostgreSQL-hosted deployment distinction and future HTTP adapter.

Retain from Spec Kit:
1. The single-module Maven structure and clear Swing MVC package organization for the first release.
2. Its straightforward feature-oriented service organization where it maps cleanly to Codex use cases.
3. Its implementation sequence, quickstart, and traceability/checklist discipline.
4. Its Swing-first focus and avoidance of implementing web/mobile prematurely.

Do **not** carry forward A's missing payer field, vague balance recalculation authority, or uncoordinated repository transactions. Do **not** adopt unnecessary module proliferation from B. Do not combine two competing financial models; use Codex's ledger as the sole source of truth.

## G. Improvement roadmap

### Phase 1 — Architectural corrections
- Decide whether approval is mandatory for every expense or configurable by group; define creator self-approval.
- Define payment semantics: user-recorded claim vs confirmed transfer; identify the exact transition that posts to ledger.
- Decide MVP deployment: standalone per-install SQLite or centrally shared service. These are different product operating modes.
- Keep one Maven module with packages: domain, application, adapter.swing, adapter.jdbc, adapter.files, adapter.notifications, bootstrap.
- Document dependency direction and forbid Swing/SQL/provider types in domain/application contracts.

**Dependencies:** product decisions on approval, payment, and deployment.

### Phase 2 — Domain model and database finalization
- Add explicit payer, currency, participant order, immutable allocation snapshot, approval history, payment lifecycle, ledger entries, idempotency, audit, notification/outbox, and invitation state.
- Approve currency scope, decimal scale, percentage precision, and rounding mode.
- Define ledger sign convention with worked expense/payment/reversal examples; enforce transaction postings net to zero.
- Select SQLite for local-only desktop or PostgreSQL for centrally shared data; add versioned migrations, constraints, and indexes.

**Exit criteria:** schema and domain invariants reviewed; every FR has model/acceptance evidence.

### Phase 3 — Core business services
Implement and test pure domain policies first: Money, Percentage, split calculation, approval eligibility/state machine, ledger posting, settlement allocation, balance projection. Then implement use cases for accounts, groups/invitations, expenses, approval, payment, reports, notifications. All writes use trusted principal, idempotency, transaction scope, and audit.

**Dependencies:** Phase 2 domain/schema decisions.

### Phase 4 — GUI and application integration
Build thin Swing screens for login, groups/membership, expense entry/receipt, reviewer queue, balances, payment recording, notifications, and basic reports. Invoke use cases from background workers; do not block the Swing Event Dispatch Thread. GUI validation is advisory; domain/application validation remains authoritative.

**Dependencies:** stable use-case contracts and tested persistence.

### Phase 5 — Testing and validation
- JUnit 5 unit tests for equal/percentage splits, positive amounts, 100% validation, final-cent remainder, approval state transitions, payment allocation, and ledger balancing.
- Database integration tests for unique posting/idempotency keys, rollback, foreign keys, migrations, and report reconciliation.
- Concurrency tests for two reviewers approving simultaneously and competing payments against the same obligation.
- Security tests for cross-group access, forged actor IDs, receipt/report authorization, and reviewer restrictions.
- Failure tests for notification provider outage, duplicate delivery, receipt upload/DB failure, backup/restore, and migration recovery.
- Human review and traceability from each requirement to test evidence.

**Exit criteria:** no known ledger imbalance; retries do not duplicate postings; unauthorized access tests fail closed; all required MVP acceptance scenarios pass.

### Phase 6 — Future platform readiness
When prioritized, deploy a server-side application behind a versioned HTTPS API, move shared data to PostgreSQL, add server-side identity/session/security operations, private object storage, and outbox workers. Then add web, Android, and iOS clients that call the API; never connect those clients directly to the database. Define monitoring, secrets, encrypted backups, retention, incident response, and recovery objectives before production.

**Dependencies:** proven domain/application contracts, finalized authorization model, hosted operational design, and product priority.

## H. Final decision

**Winner: Codex (88.5/100) over Spec Kit (69.5/100).**

Codex is the better practical foundation because it addresses the failure modes most likely to damage user trust: duplicated financial postings, partial approval/payment updates, unauthorized access, and irreconcilable historical balances. Spec Kit contributes the simpler implementation shape that should be preserved for the first Swing release.

The decision is not to build a complex enterprise platform. It is to use Codex's correctness boundaries in a small, single-module Java application, implement only the Swing MVP, and defer hosted infrastructure until the product is ready for shared web/mobile use.
