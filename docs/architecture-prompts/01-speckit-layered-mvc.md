# Spec Kit Prompt — SplitSmart Architecture A: Layered MVC

You are the lead software architect responsible for designing the SplitSmart application.

Your task is to produce a complete, implementation-ready software architecture based on the existing project specifications and constitution in this repository.

## 1. First: Inspect the Project

Before making architectural decisions:

1. Inspect the repository structure.
2. Read \`.specify/memory/constitution.md\`.
3. Read the existing SplitSmart feature specification (\`spec.md\`).
4. Review existing research, data models, contracts, plans, and requirements.
5. Identify the current implementation scope and distinguish the Java Swing MVP from the broader web/mobile product vision.

Do not replace, weaken, or reinterpret existing requirements.

## 2. Architectural Objective

Design Architecture A using a **Layered Architecture with MVC (Model-View-Controller)**.

Prioritize simplicity, clarity, separation of presentation/business logic/persistence, maintainability, testability, reliable financial calculations, and straightforward development by a small team.

Use Java 21, Maven, Java Swing, and JUnit 5 in accordance with the project constitution.

## 3. Required Architectural Layers

### Presentation Layer
- Java Swing interface: views, forms, dialogs, tables, and navigation.
- Controllers responsible for handling user actions.
- Input validation and user feedback.

### Business / Service Layer
Define services for:
- User accounts.
- Group management.
- Expense management.
- Expense approval.
- Balance calculation.
- Payments and settlements.
- Notifications.
- Reporting.

### Domain / Model Layer
Define the core entities and relationships:
- User
- Group
- GroupMembership
- Expense
- ExpenseParticipant
- ApprovalRecord
- Balance
- Payment
- Notification
- Report

Define business rules independently of the GUI.

### Data Access Layer
Evaluate an appropriate persistence strategy and document:
- Repository or DAO responsibilities.
- Database schema.
- Transaction handling.
- Data validation and integrity constraints.
- Database connection management.

Research appropriate database options before selecting one. Explain the selection and trade-offs.

## 4. Critical Business Rules

The architecture MUST address:

1. Equal and percentage-based expense splitting.
2. Two-decimal monetary precision.
3. Assignment of remaining rounding cents to the final participant.
4. Positive expense amounts.
5. Percentage totals equal to 100%.
6. Approval before expenses affect balances.
7. Authorization of designated reviewers.
8. Historical expense and payment records.
9. Accurate balance adjustments after payments.
10. Group-based authorization and data isolation.

Financial operations must be transactional and auditable. Do not use floating-point arithmetic for monetary calculations.

## 5. Architecture Deliverables

Use the Spec Kit workflow, particularly \`/speckit-plan\`, to create a detailed architectural plan.

Produce the following artifacts in the existing Spec Kit feature directory and conventions:

- \`plan.md\`: Overall architecture and technology decisions.
- \`research.md\`: Technology evaluation and architectural decision records.
- \`data-model.md\`: Entity definitions, relationships, and database design.
- \`contracts/\`: Important service and data access contracts, where appropriate.
- \`quickstart.md\`: Development environment and architectural setup instructions.
- Architecture diagrams using PlantUML or Mermaid.

Include:
- System context diagram.
- Component architecture diagram.
- Layer interaction diagram.
- Entity relationship diagram.
- Expense approval workflow.
- Expense splitting and balance calculation workflow.

## 6. Cross-Platform Considerations

The current Java Swing implementation is the desktop-first MVP. The customer requirement also includes a broader web-based product and Android/iOS access.

Explain:
- Which components are reusable across future interfaces.
- How business rules remain independent of Java Swing.
- What would need to change to introduce web or mobile frontends.
- Whether an API boundary should be anticipated.
- Which capabilities are MVP-only versus future expansion.

Do not unnecessarily implement or design the entire future platform as part of the desktop MVP.

## 7. Quality and Security

Address:
- Authentication and authorization.
- Password security.
- Sensitive financial data.
- Database transaction safety.
- Input validation.
- Error handling and logging.
- Audit history.
- Concurrent expense and payment updates.
- Backup and recovery.
- Automated unit and integration testing.

## 8. Architectural Decisions

For each major architectural decision, document:
- The decision and reason.
- Alternatives considered.
- Advantages and disadvantages.
- Risks and future implications.

Identify unresolved questions instead of inventing requirements.

## 9. Scope Restrictions

- Do not implement application functionality.
- Do not modify existing source code.
- Do not weaken the project constitution.
- Do not delete or overwrite existing specifications.
- Do not assume the entire web/mobile platform is part of the Java Swing MVP.
- Do not begin implementation tasks.

This task is exclusively architectural planning.

## 10. Final Output

Provide a concise architecture summary identifying:
1. Proposed architecture.
2. Major components and responsibilities.
3. Proposed technology stack.
4. Database strategy.
5. Main architectural diagrams.
6. Major risks and trade-offs.
7. Outstanding architectural decisions.
8. How the design satisfies existing requirements.

The result must be sufficiently detailed that another developer can implement the system without inventing its fundamental architecture.
