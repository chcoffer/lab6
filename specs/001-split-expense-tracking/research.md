# Research: SplitSmart Architecture Decisions

## Objective

This document records the technical research and decisions that inform the SplitSmart architecture. The goal is to align the solution to the customer’s requirements while staying within the project’s Java 21 / Maven / Swing / JUnit 5 constraints.

## Research Summary

The primary product requirement is a shared-expense application with real money handling, access control by group membership, approval workflows, and historical ledger tracking. The architecture must therefore favor a transactional relational database and a clearly separated service layer over UI-centric logic.

## Technology Evaluation

### Option A: SQLite (embedded relational database)

**Assessment**:
- Very simple to set up for local desktop usage
- Good for single-user or lightweight local deployments
- Lightweight, portable, easy to distribute with desktop app

**Strengths**:
- Minimal runtime overhead
- Easy file-based persistence for a local MVP
- Fast local development and testing

**Weaknesses**:
- Weaker concurrency characteristics at scale than a server database
- Less ideal for future multi-user SaaS or collaborative web/mobile workloads
- Fewer enterprise-grade operational features for audit, backup, and replication

**Decision**: Not the primary choice for the long-lived product architecture, although it may be acceptable for a very small local-only prototype.

### Option B: H2 Database (embedded Java database)

**Assessment**:
- Good fit for Java-based desktop testing and local integration scenarios
- Can run in embedded or server mode
- Useful for fast tests and local developer environments

**Strengths**:
- Native Java integration
- Easy to test and reset between runs
- Good for developer productivity and CI

**Weaknesses**:
- Less robust operationally for a multi-user shared product than PostgreSQL
- Can complicate deployment decisions if the production architecture later grows beyond the desktop MVP

**Decision**: Suitable as a local test and development database, but not the default production database for a collaborative financial platform.

### Option C: PostgreSQL (recommended production database)

**Assessment**:
- Best fit for a transactional multi-user financial system
- Strong support for transactions, locking, constraints, and reporting queries
- Excellent candidate for future API-backed web/mobile architecture

**Strengths**:
- Mature relational model with strong integrity guarantees
- High concurrency support with ACID semantics
- Good operational tooling for backup, maintenance, and scaling
- Well understood in Java ecosystems with JDBC, JPA, and repository patterns

**Weaknesses**:
- Requires installation and operational support beyond a single local file
- More complex to manage than embedded databases for a pure desktop MVP

**Decision**: Recommended as the canonical database for the shared-expense system. The Swing MVP can still run against PostgreSQL; the service layer remains unchanged regardless of the UI front end.

### Option D: MySQL / MariaDB

**Assessment**:
- Strong SQL support and broad ecosystem use
- Viable alternative to PostgreSQL

**Strengths**:
- Mature RDBMS ecosystem
- Good support for concurrency and reporting

**Weaknesses**:
- Less preferred for precise transaction and enterprise-grade auditing requirements in this product context compared with PostgreSQL
- Operational differences from PostgreSQL are manageable but not necessary for this design

**Decision**: Not selected because PostgreSQL offers a more natural fit for auditable financial records and future multi-user environments.

## Architectural Decision Records

### ADR-01: Use a layered architecture with a Swing presentation layer and reusable business services

**Status**: Accepted

**Decision**:
Keep the Swing view/controller layer separate from the domain and service logic, with repositories behind the service layer.

**Reason**:
The customer requirements are financial and authorization-heavy; this makes separation of concerns essential. Business rules must remain testable, auditable, and reusable regardless of the interface.

**Alternatives**:
- Put validation and ledger logic directly into Swing forms and model classes
- Use a single monolithic controller/service abstraction

**Consequences**:
- More initial classes and interfaces
- Easier regression testing and future reuse
- Clearer separation between UI and account balances

### ADR-02: Standardize financial calculations around BigDecimal and explicit rounding rules

**Status**: Accepted

**Decision**:
All monetary operations use `BigDecimal` and follow the business rule: round each share to two decimal places and assign any remaining cents to the last participant.

**Reason**:
The constitution explicitly forbids floating-point money math and requires deterministic financial behavior.

**Alternatives**:
- `double` or `float` arithmetic
- Rounding only at the end of all calculations

**Consequences**:
- More explicit price logic and tests
- Slightly more verbose code paths
- Stronger correctness and auditability

### ADR-03: Enforce approval workflow before balance mutation

**Status**: Accepted

**Decision**:
Expenses remain pending until an authorized reviewer approves them. Only then do shared balances and intervention records update.

**Reason**:
This is a key customer requirement and a critical trust control. Delaying balance mutation until approval prevents unauthorized or accidental ledger changes.

**Alternatives**:
- Immediate application of expenses without review
- Review only in the UI without transactional enforcement

**Consequences**:
- Need for approval status, reviewer authorization checks, and notification flow
- Additional unit and integration tests for the review states

### ADR-04: Keep the Swing MVP separate from future web/mobile front ends

**Status**: Accepted

**Decision**:
Design the system with reusable service and domain contracts so a web or mobile UI can consume the same business logic later.

**Reason**:
The customer requirement explicitly includes web and mobile requirements, but the project constitution states the current implementation is a desktop-first Java Swing MVP.

**Alternatives**:
- Engineer the full multi-platform stack immediately
- Ignore future interfaces and hard-code Swing assumptions into the domain

**Consequences**:
- Requires a thoughtful API boundary later
- Keeps current scope manageable
- Preserves long-term portability without overbuilding the current MVP

## Risks and Open Questions

1. Whether approval requirements are group-level configuration or user-role-level configuration remains a product decision that should be validated in implementation.
2. Notification delivery style (persisted log, in-app unread messages, email, or push) is a later product choice, not a domain requirement without further clarification.
3. Report generation may need performance tuning if group histories become large; this is manageable with repository-level filtering and aggregation.
4. A future REST API boundary will need authentication and authorization contracts between the service layer and the web/mobile clients.

## Final Recommendation

Adopt a layered architecture with Java Swing views/controllers, domain/business services, and repository-based persistence. Use PostgreSQL for shared multi-user data, H2 for local testability, and BigDecimal-based monetary logic throughout the domain. This keeps the current desktop MVP aligned with the constitution while preserving a clean path to a future web or mobile experience.
