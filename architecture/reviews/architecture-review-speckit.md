# Report A — Spec Kit / Layered MVC Architecture Review

**Review date:** 2026-11-05  
**Repository:** [chcoffer/lab6](https://github.com/chcoffer/lab6)  
**Reviewed baseline:** default branch `main` at review time  
**Verdict:** Good MVP-oriented starting point; revise before implementation.

## 1. Executive summary

The Spec Kit design is a conventional single-module, layered Java Swing application with views/controllers, application services, a domain model, repositories/DAOs, and relational persistence. It fits the immediate desktop MVP and explicitly keeps financial rules out of Swing. The plan, research, data model, service contracts, and quickstart form a useful implementation package.

Its main weakness is not the layered pattern; it is the gap between describing financial correctness and specifying enforceable financial mechanics. The design says BigDecimal, approval gating, rounding, and auditability, but it does not define an authoritative immutable ledger, idempotency, concurrency control, rollback scope, or a complete posting model. Its ERD omits the payer even though the feature specification requires one. The database story is also inconsistent: PostgreSQL is the production choice, H2 is local/test, while SQLite is discussed as a possible local-only prototype; the deployment profile for the actual desktop MVP is unresolved.

**Recommendation:** retain the layered MVC structure for the Swing MVP, but require a focused revision of financial persistence, payer modeling, transaction boundaries, authorization, and deployment decisions before coding money-moving workflows.

## 2. Architecture overview

Primary source: [plan.md](../specs/001-split-expense-tracking/plan.md).

The proposed single Maven module has:
- Swing views/dialogs/tables and controllers in `presentation`;
- eight named services in `service` (accounts, groups, expenses, approvals, balances, payments, notifications, reports);
- domain entities, policies, and value objects in `domain`;
- repository interfaces, DAOs, and JDBC implementations in `persistence`;
- validation, audit, configuration, and application bootstrap packages.

The plan includes context, component, sequence, ER, approval-workflow, and split/balance diagrams embedded in the plan. The dependency narrative says services depend on repository abstractions, but the component diagram draws service-to-domain and service-to-repository edges without showing interface ownership or a transaction coordinator. This is acceptable as a high-level layered view, but it is not a precise dependency/transaction specification.

Supporting artifacts: [research.md](../specs/001-split-expense-tracking/research.md), [data-model.md](../specs/001-split-expense-tracking/data-model.md), [service-contracts.md](../specs/001-split-expense-tracking/contracts/service-contracts.md), [quickstart.md](../specs/001-split-expense-tracking/quickstart.md), [requirements checklist](../specs/001-split-expense-tracking/checklists/requirements.md).

## 3. Requirements coverage

The authoritative scope is [UserRequirement.md](../UserRequirement.md), the [constitution](../.specify/memory/constitution.md), and [spec.md](../specs/001-split-expense-tracking/spec.md).

| Requirement | Status | Evidence and gap |
|---|---|---|
| Accounts/login | Partial | UserAccountService and User/passwordHash exist; password hashing is mentioned, but authentication/session lifecycle and credential protection are not designed in depth. |
| Group creation/management | Addressed | GroupService and Group model. |
| Invitation-based membership approval | Addressed | GroupMembership, invite/approve methods, roles/statuses. |
| Expense creation | Partial | Expense fields and ExpenseService exist; payer is absent from the A ERD and Expense entity table. |
| Equal split | Addressed | EQUAL split type and split calculation workflow. |
| Percentage split | Addressed | PERCENTAGE type and 100% validation. |
| Receipt image | Partial | Optional receiptImagePath exists; storage security, lifecycle, type/size limits, and backup coordination are not specified. |
| Notifications | Partial | NotificationService and group notifications exist; reliable delivery, deduplication, retries, and failure semantics are not specified. |
| Approval/rejection | Addressed | ApprovalRecord, reviewer roles, approval service and workflow. |
| Designated reviewers | Addressed | Service contract requires reviewer authorization. |
| Balance tracking | Partial | BalanceService and Balance model exist, but authoritative source and posting semantics are ambiguous. |
| Payment/settlement | Partial | PaymentService and applySettlement exist; idempotency, overpayment policy, concurrency, and atomic ledger posting are not specified. |
| Reporting | Addressed | ReportingService, date-range methods, Report entity. |
| Data privacy/group isolation | Partial | Access checks are named, but every query/receipt/report authorization boundary and threat controls are not fully detailed. |
| Historical financial records | Partial | Approval/payment timestamps and audit intent exist; immutable correction/reversal model is not defined. |
| Web/Android/iOS | Partial | Reusable service boundary is proposed, but no API contract, hosted identity/session model, or deployment design is provided. |
| Java Swing MVP | Addressed | The plan is explicitly Swing-first and maps MVP screens/services. |

“Addressed” means the architecture provides a recognizable component or rule; it does not mean the feature has been implemented or verified.

## 4. Technical strengths

1. **Good fit to the mandated stack.** Java 21, Maven, Swing, JUnit 5, BigDecimal, and optional PlantUML align with the constitution.
2. **Understandable implementation shape.** A single Maven module and familiar packages are approachable for a small team.
3. **Thin GUI intent.** The plan explicitly keeps authoritative expense, approval, and balance rules out of Swing.
4. **Feature-aligned services.** Service boundaries map reasonably well to the product capabilities and are straightforward to exercise with JUnit.
5. **Useful diagrams and quickstart.** The plan gives developers a shared vocabulary and initial flow.

## 5. Technical weaknesses

- **Payer omission:** FR-003 explicitly requires a payer. The A data model's Expense table and ERD do not contain payer/from-user semantics. This blocks correct attribution of who fronted the expense.
- **Service overlap:** ExpenseService exposes approve/reject while ApprovalService also owns approval submission/decision. Choose one command owner to avoid duplicated workflows and divergent authorization.
- **Balance authority unclear:** Balance is described as derived/recalculated, but contracts expose `recalculateBalances` and the ERD/model do not establish an immutable ledger as the source of truth.
- **Transaction ownership unclear:** the plan says repositories enforce transaction boundaries, but cross-repository atomicity requires a service/application transaction coordinator or Unit of Work. A repository-per-call approach can partially commit an approval.
- **Notification reliability absent:** no durable outbox, delivery retry, or duplicate suppression is specified.
- **Diagram mismatch:** the approval diagram allows expenses to bypass approval when approval is not required. FR-008 says the system must support approval before balance effects, while the specification's Q1/assumptions leave configurability unresolved. The architecture should explicitly select a policy rather than leave the diagram as an implicit alternative.
- **Database decision not closed:** PostgreSQL is called canonical/production; H2 is used locally/test; SQLite is acknowledged as local-only. The actual Swing deployment profile is not decided, and H2 is not a substitute for PostgreSQL integration testing.
- **Future-platform claim is optimistic:** reusing services is useful, but no explicit inbound API boundary, principal/session contract, or remote deployment topology is specified.

No concrete circular dependency is demonstrated in the package. The larger concern is under-specified ownership and contracts, not proven cycles.

## 6. Financial integrity assessment

| Control | Assessment |
|---|---|
| BigDecimal | Explicitly required in constitution, plan, and data model. |
| Equal split | Specified conceptually; deterministic algorithm details are limited. |
| Percentage split | 100% validation specified. |
| Two-decimal rounding | Specified. |
| Final participant absorbs remainder | Specified; sorted order mentioned in data model. |
| Positive amounts | Specified. |
| Approval before balance impact | Specified, but optional/configurable path remains in workflow diagram. |
| Settlement | Payment service exists; exact obligation allocation is not defined. |
| Historical records | Approval/payment history and audit intent exist; append-only ledger/reversal strategy absent. |
| Concurrency | No explicit optimistic/pessimistic locking, version check, or conflict policy. |
| Duplicate prevention | No idempotency key or unique posting key specified. |
| Partial failure/rollback | Transactional intent stated, but no cross-repository Unit of Work or atomic ledger posting contract. |

**Conclusion:** The design can become financially sound, but its current documentation does not yet demonstrate that concurrent or retried approvals/payments cannot double-adjust balances or leave payment and balance state inconsistent. A mutable Balance table or recalculation routine must not become the only financial record.

## 7. Security assessment

Positive: unique accounts, salted password hash, roles (member/admin/reviewer), membership approval, and service-level access checks are present.

Gaps: no explicit trusted-principal propagation, session lifecycle, credential hashing algorithm/parameters, rate limiting, least-privilege DB access, receipt authorization/storage safety, query-by-query group scoping, or privacy/retention policy. Do not rely on hiding Swing controls as authorization. Enforce authorization in every service operation and data retrieval.

## 8. Maintainability and testability

The single-module layered design is easy to understand and likely the fastest path for a small team. Services and domain packages can be unit-tested separately from Swing. The current service contracts, however, accept caller-supplied actor UUIDs; the implementation must ensure those IDs come from a trusted authenticated session, not arbitrary form input. Duplicate approval methods and vague transaction ownership should be corrected before tests lock in inconsistent behavior.

## 9. Java Swing MVP suitability

**Strong.** A single process, Swing MVC, services, JDBC repositories, and JUnit 5 are a pragmatic MVP shape. Keep Swing event handlers thin and move blocking database work off the Event Dispatch Thread. The design needs a concrete local-versus-central deployment decision; requiring each desktop install to connect to PostgreSQL creates setup and security work, while a local database means each install has separate data and does not provide multi-user shared groups without a server.

## 10. Future expansion readiness

The domain/service separation helps reuse business rules. However, the architecture currently describes a future API as a possibility rather than defining an API adapter, trusted identity boundary, server-side deployment, notification workers, or shared persistence. Web/mobile support therefore requires material platform work, although it need not require rewriting the core business rules if the service/domain boundaries are maintained.

## 11. Architectural risks

- **Critical:** payer is missing from the A data model/ERD despite being a required expense attribute.
- **High:** no immutable ledger/idempotent posting model; balance reconciliation may be vulnerable to duplicate or partial updates.
- **High:** transaction boundaries and concurrency policy are not implementable from the current contracts alone.
- **High:** approval bypass/configuration semantics are unresolved and the workflow diagram permits immediate balance application.
- **Medium:** ExpenseService and ApprovalService overlap.
- **Medium:** PostgreSQL/H2/SQLite deployment roles remain ambiguous.
- **Medium:** receipt storage, notification delivery, and privacy operations are underspecified.
- **Low:** the plan embeds diagrams rather than maintaining separately versioned diagram sources; this is a maintainability concern, not a functional defect.

## 12. Weighted scoring

Scores use 1–10; higher is better. For implementation complexity, a higher score means lower/ more manageable complexity.

| Category | Weight | Score | Weighted points | Rationale |
|---|---:|---:|---:|---|
| Requirements coverage | 15% | 8 | 12.0 | Broad service/entity coverage; payer and platform details incomplete. |
| Architectural correctness | 15% | 7 | 10.5 | Sensible layers; ownership/transaction contracts are fuzzy. |
| Maintainability | 10% | 7 | 7.0 | Simple package structure; service overlap and ledger ambiguity detract. |
| Testability | 10% | 7 | 7.0 | Domain/services separable; no explicit ports/UoW or comprehensive test seams. |
| Financial integrity | 15% | 6 | 9.0 | BigDecimal and rounding present, but ledger/idempotency/concurrency/reversal controls absent. |
| Security/authorization | 10% | 6 | 6.0 | Roles and checks named; end-to-end security boundary incomplete. |
| Extensibility/scalability | 10% | 6 | 6.0 | Reusable services; future API and hosted profile largely conceptual. |
| Implementation complexity | 5% | 8 | 4.0 | Lowest ceremony and easiest immediate Swing implementation. |
| Technology suitability | 5% | 8 | 4.0 | Fits Java 21/Maven/Swing/JUnit; DB profile unresolved. |
| Documentation quality | 5% | 8 | 4.0 | Broad package and useful diagrams; some contradictions and missing precision. |
| **Total** | **100%** |  | **69.5 / 100** | |

## 13. Specific recommended improvements

1. Add `payerId` to Expense, the ERD, service request, and expense creation validation; require payer to be an active group member.
2. Define immutable ledger entries as the source of truth. Derive pairwise balances and reports from ledger postings; treat snapshots as rebuildable projections.
3. Define a UnitOfWork/transaction boundary that atomically commits approval state, approval record, ledger entries, idempotency key, audit record, and notification outbox.
4. Add idempotency keys and unique source posting keys for approval and payment commands; use aggregate versions/locking for concurrent decisions and settlement.
5. Specify payment allocation, overpayment handling, same-currency validation, reversal/correction behavior, and payment status semantics.
6. Resolve approval policy and self-approval explicitly. If approval is required for every expense, remove the immediate-post branch.
7. Consolidate approval command ownership in ApprovalService; ExpenseService may submit but should not duplicate decision logic.
8. Close the MVP database decision and test against the actual selected engine; do not treat H2 tests as proof of PostgreSQL behavior.
9. Add trusted principal/session handling, password hashing/rate limiting, scoped receipt/report access, and privacy/retention rules.
10. Add outbox delivery, retry/deduplication, receipt staging/cleanup, and failure-recovery tests.

## 14. Overall verdict

**Accept as a practical Swing MVP structure only after targeted revision.** The layered MVC approach is not the problem; it is an appropriate level of structure for this application. The design is not yet sufficiently precise for financial implementation. Resolve the payer omission and make ledger posting, idempotency, transaction scope, concurrency, and authorization explicit before implementing approvals or payments.
