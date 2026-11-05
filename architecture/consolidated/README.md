# SplitSmart Consolidated Architecture

## Authoritative design

This directory is the selected architecture reference for SplitSmart. It adopts the domain-centered Clean/Hexagonal design from `architecture/codex-hexagonal/`, with practical guidance from the Spec Kit planning artifacts. Where those sources conflict, the decisions documented here govern. The original proposals, specifications, and reviews remain unchanged as historical source material; this consolidated documentation supersedes the proposals as the selected design.

This is architecture documentation only. The application is not being developed or deployed. No functionality is claimed as implemented or tested.

## In scope

The domain and application design cover the shared expense product requirements. The first named implementation subset is the Java Swing desktop MVP (`MVP-001` through `MVP-007`); the primary web experience and Android/iOS access remain product requirements for future delivery adapters (`INV-09`, `FR-012`). No future UI is included in the MVP architecture work.

The canonical design is a single Java 21 Maven module organized into domain, application, adapter, and bootstrap packages. Swing uses a familiar MVC presentation organization. Application use cases and domain rules remain independent of Swing and persistence. PostgreSQL is the sole canonical database for authoritative shared financial data. No SQLite or H2 profile is retained, avoiding divergent database behavior and a local copy that cannot synchronize users.

## Document guide

| Document | Purpose |
|---|---|
| [Architecture overview](architecture-overview.md) | Layers, dependency direction, structure, and context/deployment diagrams |
| [Domain model](domain-model.md) | Concepts, value objects, aggregates, invariants, and state transitions |
| [Application use cases](application-use-cases.md) | Workflows, authorization, outcomes, ports, and transaction scope |
| [Ports and adapters](ports-and-adapters.md) | Boundary contracts and Swing, SQL, file, notification, and future API adapters |
| [Data model](data-model.md) | PostgreSQL relational schema, constraints, and persistence mapping |
| [Financial integrity](financial-integrity.md) | Ledger, splits, payment lifecycle, idempotency, transactions, and concurrency |
| [Security and authorization](security-and-authorization.md) | Authentication assumptions, group access, reviewer permissions, and audit |
| [Technology decisions](technology-decisions.md) | Baseline, selected database, alternatives, and rationale |
| [Implementation roadmap](implementation-roadmap.md) | Conceptual sequence, MVP boundary, and future extensions |
| [Open decisions](open-decisions.md) | Unresolved stakeholder choices and explicit design assumptions |

## Source review and limitations

Reviewed the constitution, `UserRequirement.md`, the complete feature directory under `specs/001-split-expense-tracking/`, and the Codex proposal under `architecture/codex-hexagonal/`. The requested three reports under `architecture/reviews/` were not present in the repository, so no report-specific findings could be incorporated. Known inconsistencies found in available material are reconciled here: payer is explicit, balances are ledger-derived, payment recording is distinct from settlement confirmation, approval is required before financial posting, and PostgreSQL is the only database choice.

## Requirement traceability

| Requirement capability | Domain concept | Use case / boundary | Primary reference |
|---|---|---|---|
| Accounts and login | User, authentication identity | RegisterUser, AuthenticateUser | FR-001, MVP-001 |
| Groups and invitations | Group, Membership, Invitation | CreateGroup, InviteGroupMember, DecideMembership | FR-002, MVP-002 |
| Expenses, payer, receipt | Expense, Participant, ReceiptReference | CreateExpense, SubmitExpense | FR-003, MVP-003 |
| Equal and percentage split | ExpenseSplit, Money, Percentage | CalculateExpenseSplit | FR-004–006A |
| Approval and rejection | ApprovalRecord, ExpenseStatus | ApproveExpense, RejectExpense | FR-008, MVP-005 |
| Notifications | Notification, OutboxEvent | RetrieveNotifications; notification adapter | FR-007 |
| Balances | LedgerEntry, BalanceProjection | RetrieveBalances | FR-009 |
| Payment and settlement | Payment, LedgerEntry | RecordPayment, ConfirmSettlement | FR-010 |
| Reports | ReportCriteria, ReportResult | GenerateReport | FR-011, MVP-006 |
| Privacy and history | Group authorization, AuditEvent, ledger | All scoped use cases | FR-013–014, NFR-005 |
| Web and mobile | Same application use cases | Future HTTP/API adapter | FR-012, MVP-007 |

