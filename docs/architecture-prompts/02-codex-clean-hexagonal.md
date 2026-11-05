# Codex Prompt — SplitSmart Architecture B: Clean / Hexagonal Architecture

You are acting as a senior software architect.

Your assignment is to independently design a complete architecture for the SplitSmart application using Clean Architecture principles and a Hexagonal Architecture (Ports and Adapters) approach.

Base your work on the existing GitHub repository and its documented requirements.

## 1. Repository Discovery

Start by examining the complete repository.

Read and understand:
- \`.specify/memory/constitution.md\`
- The SplitSmart feature specification.
- Existing implementation plans.
- Existing research documents.
- Existing data models and contracts.
- Additional architectural guidance.

Identify the current Java Swing MVP requirements separately from the long-term web and mobile product vision.

Do not assume missing architectural decisions have already been made.

## 2. Architectural Objective

Design a solution based on **Clean Architecture + Hexagonal Architecture + Domain-Centered Design**.

The primary objective is to create a modular system in which business rules are independent of frameworks, interfaces, databases, and external infrastructure.

Emphasize domain independence, explicit boundaries, dependency inversion, independently testable business logic, replaceable infrastructure, extensibility, financial correctness, and long-term maintainability.

Follow project technology requirements:
- Java 21.
- Maven.
- Java Swing for the desktop MVP.
- JUnit 5 for automated tests.

## 3. Required Architectural Structure

### Domain Core

Define the business domain and its invariants.

Identify:
- Entities.
- Value Objects.
- Aggregates and Aggregate Roots.
- Domain Services.
- Domain Events.
- Business Policies.
- Domain Exceptions.

Evaluate whether these concepts should be modeled as value objects:
- Money.
- Percentage.
- ExpenseSplit.
- BalanceAmount.
- UserIdentifier.
- GroupIdentifier.

Establish explicit rules for expense creation, approval, splitting, and settlement.

### Application Layer

Define application use cases, including:
- RegisterUser.
- AuthenticateUser.
- CreateGroup.
- InviteGroupMember.
- ApproveGroupMembership.
- CreateExpense.
- SubmitExpenseForApproval.
- ApproveExpense.
- RejectExpense.
- CalculateExpenseSplit.
- RetrieveBalances.
- RecordPayment.
- GenerateReport.
- RetrieveNotifications.

For each use case, identify:
- Inputs and outputs.
- Business rules.
- Dependencies.
- Authorization requirements.
- Transaction boundaries.
- Failure conditions.

### Ports

Define inbound and outbound ports.

Inbound ports should expose application use cases.

Outbound ports should abstract external dependencies, including:
- User persistence.
- Group persistence.
- Expense persistence.
- Payment persistence.
- Notification delivery.
- Receipt image storage.
- Authentication support.
- Reporting data access.

Explain the purpose and contract of each port.

### Adapters

Evaluate adapters for:
- Java Swing presentation.
- Database persistence.
- Notification delivery.
- File or image storage.
- Authentication.
- Reporting.

Ensure adapters depend on application/domain boundaries rather than forcing the domain to depend on infrastructure.

## 4. Domain Modeling

Create a detailed domain model containing:
- User.
- Group.
- GroupMembership.
- Expense.
- ExpenseParticipant.
- ApprovalRecord.
- Balance.
- Payment.
- Notification.
- Report.

Determine appropriate aggregate boundaries and explain consistency requirements.

Pay particular attention to:
- Whether Expense and ApprovalRecord belong to the same aggregate.
- How balance changes are recorded.
- How payment settlement affects balances.
- How historical financial events are preserved.
- How group-level authorization is enforced.

Avoid unnecessary complexity. Use domain-driven design patterns only where they provide clear benefits.

## 5. Financial Integrity

Financial correctness is a critical architectural requirement.

The design MUST support:
- Equal expense splitting.
- Percentage expense splitting.
- Precise decimal monetary calculations.
- Two-decimal rounding.
- Final-participant rounding adjustment.
- Positive expense validation.
- Percentage totals of exactly 100%.
- Approval before balance updates.
- Accurate payment settlement.
- Historical transaction traceability.

Evaluate whether a ledger-oriented approach or immutable financial transaction records would improve reliability.

Explain how to prevent:
- Duplicate balance adjustments.
- Double payment processing.
- Concurrent updates.
- Partial transaction failures.
- Inconsistent expense and balance records.

Consider idempotency, transaction management, and concurrency control.

## 6. Database and Infrastructure

Research and recommend an appropriate database.

Explain:
- Relational data model.
- Persistence adapters.
- Transaction boundaries.
- Database migrations.
- Indexing strategy.
- Referential integrity.
- Connection management.
- Backup and recovery.

The database choice must support the desktop MVP without unnecessarily restricting future deployment options.

Do not select technology without documenting the reasoning and trade-offs.

## 7. Desktop and Future Platform Strategy

The current implementation target is Java Swing.

Design the architecture so that Java Swing is an adapter, not the owner of business logic.

Explain how future interfaces could be introduced:
- Web frontend.
- Android application.
- iOS application.
- REST API or another appropriate application boundary.

Identify which components belong in domain, application, and infrastructure modules.

Avoid implementing future interfaces now.

## 8. Architecture Deliverables

Create an independent architecture package under:

\`architecture/codex-hexagonal/\`

Include:
1. \`architecture-overview.md\`
2. \`domain-model.md\`
3. \`application-use-cases.md\`
4. \`ports-and-adapters.md\`
5. \`data-model.md\`
6. \`security-and-integrity.md\`
7. \`technology-decisions.md\`
8. \`implementation-roadmap.md\`

Include diagrams:
- System context.
- Clean Architecture dependency diagram.
- Hexagonal architecture diagram.
- Domain model.
- Aggregate boundaries.
- Expense approval sequence.
- Expense settlement sequence.
- Deployment architecture.

Use Mermaid or PlantUML.

## 9. Architectural Evaluation

Evaluate the proposed architecture against:
- Maintainability.
- Testability.
- Complexity.
- Extensibility.
- Development effort.
- Financial correctness.
- Security.
- Performance.
- Desktop MVP suitability.
- Future web/mobile expansion.

Identify where Clean/Hexagonal Architecture adds value and where it introduces unnecessary complexity.

## 10. Constraints

- Do not implement application functionality.
- Do not modify existing source code.
- Do not modify the project constitution or original specification.
- Do not overwrite the Spec Kit architecture artifacts.
- Keep your architecture independent of Architecture A.
- Do not copy an existing architecture simply to create a second version.
- Document assumptions and unresolved questions.
- Do not start implementation.

## 11. Final Output

Produce a complete architecture report containing:
1. Architectural overview.
2. Component responsibilities.
3. Dependency rules.
4. Domain model.
5. Use-case definitions.
6. Ports and adapters.
7. Database strategy.
8. Security and financial integrity strategy.
9. Architecture diagrams.
10. Technology decisions.
11. Implementation roadmap.
12. Risks and trade-offs.

The architecture must be technically realistic, internally consistent, and sufficiently detailed for another developer to implement.

Your result will be independently reviewed against the original project requirements and compared with another proposed architecture.
