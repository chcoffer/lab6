# Conceptual Implementation Roadmap

This is a sequence for a hypothetical future implementation, not authorization to build or deploy SplitSmart.

## Foundations and MVP

1. Resolve deployment topology, approval policy, payment confirmation, currency/rounding, authentication, notifications, reports, and retention decisions in [open decisions](open-decisions.md).
2. Establish the single Maven module and package boundaries: domain, application, Swing MVC, PostgreSQL/file/notification adapters, and bootstrap. Keep all rules independent of Swing.
3. Specify PostgreSQL schema and migrations; validate decimal mapping, foreign keys, unique idempotency/source keys, transaction scope, and backup/recovery design.
4. Define/test domain rules conceptually before UI: split allocation, approval state, ledger postings, payment lifecycle, authorization policy. An eventual implementation must use JUnit 5 per constitution.
5. Implement application use cases with Unit of Work, repositories, version checks, idempotency, audit, and outbox behavior.
6. Add Swing screens for login, group/membership, expense and receipt entry, approval queue, balance view, payment recording/confirmation per policy, notifications, and basic reports. Controllers invoke use cases; long-running work stays off Swing's event dispatch thread.
7. Validate requirements with acceptance evidence, financial reconciliation, authorization checks, concurrency/duplicate scenarios, migration/restore exercises, and human review.

## Future platform extension

When prioritized, add an authenticated HTTP inbound adapter and web/Android/iOS clients that call the same application use cases. Keep PostgreSQL behind the trusted service boundary; add operational monitoring, secure credential/session management, delivery integrations, and scalable private receipt storage. These are extension points, not MVP commitments.

## Exit evidence

The eventual MVP should trace FR-001 through FR-014 and MVP-001 through MVP-007 to acceptance evidence. Financial flows require proof that only approved expenses and confirmed settlements affect derived balances; all adjustments remain traceable to immutable source facts. No roadmap phase should be reported as complete based solely on this architecture document.

