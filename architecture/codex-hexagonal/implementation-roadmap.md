# Implementation Roadmap

This roadmap is an architectural sequence, not permission to start implementation. It distinguishes the Swing MVP from later web/mobile delivery while preserving the complete product requirement set.

## Phase 0: Confirm product decisions

Resolve MVP deployment mode, approval policy and self-approval, currency/percentage/rounding precision, overpayment behavior, authentication/recovery, notification channels, report/export scope, and retention/recovery objectives. Map FR/MVP requirements to acceptance checks. Do not encode unresolved policy in Swing controls.

## Phase 1: Establish boundaries

Create Maven structure for domain, application, adapters, and bootstrap. Enforce Java 21 and JUnit 5. Define stable IDs, command/result DTO conventions, typed errors, `Clock`, `IdGenerator`, principal context, inbound use-case interfaces, and outbound port contracts. Add architecture dependency checks if they remain lightweight.

## Phase 2: Domain and persistence foundation

Implement and independently verify Money, Percentage, split calculation, participant ordering, aggregate state transitions, approval policy, ledger posting rules, and settlement policy. Create versioned schema/migrations for users, groups, membership/invitations, expenses, allocations, approvals, payments, ledger, audit, notification, and outbox. Select SQLite or PostgreSQL profile per deployment decision. Include uniqueness, foreign key, decimal, and version constraints.

## Phase 3: Core use cases

Implement registration/authentication adapter contract; group creation/invitation/membership approval; expense draft/submission; reviewer approval/rejection; balance queries; payment posting; report generation; notification retrieval. Keep every write idempotent, scoped, transactional, and auditable. Use fakes for application tests and repository integration tests against the selected database.

## Phase 4: Swing MVP

Build thin Swing screens for login, group dashboard, member invitations, expense entry/receipt selection, approval queue, balances, payment recording, notifications, and basic reports. Call use cases from background workers, not the Swing event dispatch thread. Keep input feedback clear while treating domain/application validation as authoritative. Confirm MVP-001 through MVP-007 acceptance coverage.

## Phase 5: Integrity and release readiness

Exercise known split datasets, fractional-cent cases, duplicate commands, concurrent approvals/payments, transaction rollback, report reconciliation, authorization isolation, receipt handling, schema upgrade, backup restore, and failure recovery. Conduct human review required by the constitution. Document local data backup/restore and migration operation.

## Phase 6: Hosted multi-client platform

Only when prioritized, deploy the same application/domain behind an authenticated versioned HTTP API, switch to PostgreSQL and server-side connection management, move receipts to private object storage, and add notification delivery workers/providers. Add web, Android, and iOS adapters against that API. Define operational monitoring, secrets, encryption, privacy, backup, rate limits, and incident procedures. Do not let mobile/web clients connect directly to the database.

## Critical dependencies and exit criteria

- Phase 2 depends on decisions about currency, approval, payment overage, and deployment mode.
- Swing MVP depends on stable use-case contracts and successful transactional persistence for approval/payment.
- Hosted launch depends on identity/security, API authorization, PostgreSQL concurrency behavior, outbox delivery operations, and recovery objectives.
- Any phase affecting money or authorization requires evidence and human review under the constitution; architecture documentation is not a substitute for tests or review.
