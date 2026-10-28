# Feature Specification: SplitSmart Expense Tracking

**Feature Branch**: `001-split-expense-tracking`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Customer asked you to develop a software ‘SplitSmart’ for sharing expenses between individuals or groups of people, such as friends, roommates, family members or coworkers. It should come with the following functions/features. User accounts: Each person using the SplitSmart should have their own user account, which they can use to log in and access their own expense and balance information. Group management: The software should allow users to create and manage groups of people, such as roommates, trip or party participants to more easily track shared expenses and balances within those groups. Expense creation: The software should allow users to create new expenses; the new expenses should contain information such as amount, date, description, shared manner (equally split or split by %) and an optional receipt image; it should also allow users to specify which other users were involved in the expense, so that the appropriate balance adjustments can be made. Notification system: The software should have a way to notify users when other group members create a new expense. Approval workflow: The software should have a system for reviewing and approving expenses before they are added to the system and used to adjust balances. This could involve multiple levels of approval or a single review process, depending on the needs of the group. Balance tracking: The software should track the balance owed by each user to every other user, taking into account all expenses that have been entered. Payment tracking: The software should allow users to record when payments have been made to settle balances owed, so that the balances are accurately reflected in the system. Reporting: The software should provide users with reports and summaries of their expenses, balances, and payments, possibly including the ability to generate custom reports with specified date ranges and other parameters. OS supported: primary web-based and also comes with app that can be run on Android and IOS."

## Clarifications

### Session 2026-10-28

- Q: Who is the payer on each expense, and how are the other participants treated in the balance calculation? → A: Option B - The expense is tied to a group, and every group member is treated as a participant unless explicitly excluded.
- Q: How should group membership be controlled: can users join groups freely, or must they be invited and approved by an existing member? → A: Option A - Invitation-based membership with approval by an existing member or group admin.
- Q: How should the system handle invalid expense data, such as a negative amount, a 0 value, or a percentage split that does not total 100%? → A: Option A - Reject invalid amounts and incomplete percentage totals with a validation error.
- Q: Who is allowed to approve or reject an expense before it updates balances? → A: Option B - Only designated group admins or reviewers can approve expenses.
- Q: How should the system round money when a split creates fractional cents, such as equal or percentage splits that do not divide evenly? → A: Option A - Round each share to two decimals and adjust the final participant to absorb the remaining cents.
- Q: What is the intended notification behavior when a new expense is created: should every group member receive a notification immediately, or only those who are included in the expense? → A: Option A - Notify every member of the group immediately.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account and join a group (Priority: P1)
A user creates a personal account, logs in, and joins or creates a group for shared expenses. The user can see only their own financial data and can participate in shared group activity within the group context.

**Why this priority**: Account creation and group membership are the entry points for every other feature. Without them, users cannot create or view expenses, balances, or reports.

**Independent Test**: A user can complete account creation, group creation, and group membership selection in a single flow and then access group-level financial data.

**Acceptance Scenarios**:

1. **Given** a new user has no account, **When** they create an account and log in, **Then** the system creates a unique account and grants access to their personal dashboard.
2. **Given** an authenticated user, **When** they create or join a group, **Then** the group becomes available to that user and is associated with their account.
3. **Given** a group member, **When** they view the group dashboard, **Then** they can see only the group-related information they are authorized to access.

---

### User Story 2 - Create and review shared expenses (Priority: P1)
A group member records an expense with amount, date, description, split method, involved participants, and an optional receipt image. If the group requires review, the expense is held until approval before it changes balances.

**Why this priority**: Expense creation is the core value of the product. The system must be able to record shared costs and apply them correctly to each participant’s balance.

**Independent Test**: A user can add an expense to a group and verify that the system either stores it pending approval or immediately updates balances as configured by the group rules.

**Acceptance Scenarios**:

1. **Given** a group with members, **When** a user creates a new expense with an amount and participants, **Then** the system stores the expense and calculates each member’s share according to the selected split method.
2. **Given** a group with approval enabled, **When** an expense is submitted for review, **Then** the expense remains pending until approved and does not affect balances before approval.
3. **Given** an expense with an optional receipt image, **When** the user saves it, **Then** the image is associated with the expense and available for review.

---

### User Story 3 - Track balances and settlements (Priority: P1)
A user can view balances owed to or by other users in a group, record payments that settle those balances, and see updated totals after each settlement.

**Why this priority**: Accurate balance tracking and settlement records are central to trust and debt management in a shared-expense product.

**Independent Test**: A user can verify that a new expense changes the balances and that a recorded payment updates the same balances correctly.

**Acceptance Scenarios**:

1. **Given** a group with multiple expenses, **When** the user opens the balances view, **Then** the system shows each member’s current balance relative to every other member.
2. **Given** a recorded payment, **When** the payment is saved, **Then** the system adds it to the payment history and reduces the appropriate outstanding balances.
3. **Given** a user with unsettled balances, **When** they review the ledger, **Then** the system shows all open amounts, settled amounts, and current net positions.

---

### User Story 4 - Receive notifications and generate reports (Priority: P2)
Users receive notifications when other members create new expenses and can review summaries, reports, and date-range views for their expenses, balances, and payments.

**Why this priority**: These features improve usability and transparency, especially in active groups where timely updates matter.

**Independent Test**: A user can receive a notification about a new expense and then generate a report covering a defined date range to confirm the figures match the recorded activity.

**Acceptance Scenarios**:

1. **Given** a user is part of a group, **When** another member creates an expense, **Then** the user receives a notification about the new expense.
2. **Given** a user requests a report for a date range, **When** the report is generated, **Then** it summarizes the relevant expenses, balances, and payments for that period.
3. **Given** a user exports or views a report, **When** they inspect the totals, **Then** the totals match the underlying approved expenses and payments.

---

### User Story 5 - Access SplitSmart on web and mobile devices (Priority: P3)
Users access the system through the primary web experience and the Android and iOS app experience in line with the product’s platform expectation.

**Why this priority**: Platform reach matters to the customer, but the product’s core value remains the shared-expense workflow rather than the device-specific interface.

**Independent Test**: A user can sign in and perform core actions from the web or mobile app without losing the underlying data model or workflow integrity.

**Acceptance Scenarios**:

1. **Given** a user on the primary web interface, **When** they open the app, **Then** they can access their account, groups, and current balances.
2. **Given** a user on the mobile app, **When** they create or review an expense, **Then** the same core workflow and data are available as on the web experience.

---

### Edge Cases

- What happens when a user tries to create an expense with a member who is not in the selected group?
- How does the system handle percentages that do not sum to 100% or contain invalid values?
- What happens when a payment is recorded for an amount that exceeds or does not match the outstanding balance?
- How should the system behave when a receipt image is missing or unable to load?
- What happens when a group has no approval workflow configured but the expense still needs review for compliance reasons?

## Requirements *(mandatory)*

### Requirements Inventory

The original customer request establishes the following feature inventory that must be preserved in the product scope:

- **INV-01**: User accounts and login access
- **INV-02**: Group management for shared households, trips, parties, and workgroups
- **INV-03**: Expense creation with amount, date, description, split type, participants, and optional receipt image
- **INV-04**: Notification system for newly created expenses
- **INV-05**: Approval workflow before expenses affect balances
- **INV-06**: Balance tracking between users and groups
- **INV-07**: Payment tracking and settlement history
- **INV-08**: Reporting and summary views by date range and other filters
- **INV-09**: Primary web experience plus Android and iOS app access

### Functional Requirements

- **FR-001**: The system MUST allow each user to create and maintain a personal account for login and account-specific access.
- **FR-002**: The system MUST allow users to create, update, and manage groups of people for shared expense tracking, including invitation-based membership approval before a user is added to a group.
- **FR-003**: The system MUST allow a user to create an expense containing amount, date, description, payer, split method, participating group members, and optional receipt image.
- **FR-004**: The system MUST support at least two split methods: equal split and percentage split.
- **FR-005**: The system MUST validate the expense before saving: amounts must be positive, and percentage-based splits must total 100% before the system calculates each participant’s share.
- **FR-006**: The system MUST calculate each participant’s share from the selected split method and the involved users recorded on the expense, using the group’s member list as the default participant set unless a user explicitly excludes or includes a valid group member.
- **FR-006A**: The system MUST apply a two-decimal rounding rule for split calculations and assign any remaining cents to the final participant in the calculation order so that the total remains exactly equal to the expense amount.
- **FR-007**: The system MUST notify every member of the group when another member creates a new expense requiring attention.
- **FR-008**: The system MUST support an approval workflow before an expense can affect balances or settlement calculations, and only designated group admins or reviewers may approve or reject an expense submission.
- **FR-009**: The system MUST track each user’s current balance relative to every other user in a group, including net amounts owed and owed to them.
- **FR-010**: The system MUST allow users to record payments that settle outstanding balances and update balances accurately after settlement.
- **FR-011**: The system MUST generate reports and summaries of expenses, balances, and payments, including date-range and filter-based views where applicable.
- **FR-012**: The system MUST expose the primary product experience through a web interface and also support Android and iOS app usage.
- **FR-013**: The system MUST ensure that a user’s financial data and group activity are only visible to authorized users within their accounts and group memberships.
- **FR-014**: The system MUST preserve a historical record of the expense, approval, payment, and balance states needed to explain current balances.

### Non-Functional Requirements

- **NFR-001**: The system MUST provide accurate and auditable financial calculations for amounts, shares, balances, and payments.
- **NFR-002**: The system MUST protect personal account data and group financial information from unauthorized access.
- **NFR-003**: The system MUST make balance and payment information understandable to users without specialist accounting expertise.
- **NFR-004**: The system MUST support everyday usage in real time for typical household, travel, and team expense scenarios without major data loss or visible inconsistency.
- **NFR-005**: The system MUST allow reviewers to trace an expense from submission through approval, balance impact, and payment settlement.
- **NFR-006**: The system MUST support a consistent user experience across the primary web product and the device-specific mobile app experience.

### Java Swing MVP Subset

This subsection identifies the desktop-first launch subset for a Java Swing implementation. It is a subset of the full SplitSmart scope and is not a replacement for the broader product requirements.

- **MVP-001**: A Swing-based desktop application MUST provide a login flow for users and access to their account information.
- **MVP-002**: The desktop application MUST allow users to create or join groups and view group members and group-level activity.
- **MVP-003**: The desktop application MUST allow users to add expenses with amount, date, description, split method, participants, and optional receipt image.
- **MVP-004**: The desktop application MUST show balances owed and received at the group level and provide a simple payment recording flow.
- **MVP-005**: The desktop application MUST support the approval review flow before an expense affects group balances.
- **MVP-006**: The desktop application MUST present basic reports and summary views for expenses, balances, and payments.
- **MVP-007**: The Java Swing implementation MUST keep business logic separate from the UI layer so that rules such as split calculation, payment updates, and approval checks are independently testable.

### Key Entities

- **User**: Represents an individual account holder with login access, group memberships, and personal balance visibility.
- **Group**: Represents a shared context such as roommates, trip participants, family members, or coworkers.
- **Expense**: Represents a shared cost with amount, date, description, split method, participants, approver status, and optional receipt image.
- **ApprovalRecord**: Represents the review state of an expense before it can affect balances.
- **Balance**: Represents the net amount owed by one user to another within the group context.
- **Payment**: Represents a user-recorded settlement that reduces or clears an outstanding balance.
- **Report**: Represents a summary of financial activity across a selected date range or filter set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create an account, join a group, and add an expense in under 5 minutes during standard use.
- **SC-002**: At least 95% of newly created expenses reconcile to the correct participant balances when tested against a known dataset.
- **SC-003**: Approved expenses affect balances correctly and payment records reduce the outstanding balances without introducing reconciliation errors.
- **SC-004**: Users can generate a report covering a date range and confirm that the summary matches the recorded transactions and balances.
- **SC-005**: Users can complete the primary expense-management workflow without needing specialist manual intervention or external spreadsheets.
- **SC-006**: The product supports the web-first experience and mobile access without changing the underlying shared-expense rules or balance logic.

## Assumptions

- Users are identified by a standard account-based login model and can belong to multiple groups.
- The product is intended to manage shared expenses among trusted participants rather than public, anonymous, or marketplace transactions.
- Groups may require either immediate processing or approval before balances change, depending on the group’s configuration.
- Financial calculations are expected to use precise decimal arithmetic to avoid rounding mistakes in shared expenses and balances.
- Mobile app support is assumed to provide the same core workflow and data as the web experience, even if the interface differs by device.

## Open Questions

- **Q1**: Should every group have a mandatory approval step, or should approval be configurable per group or per expense type?
- **Q2**: What is the expected authentication model for the user accounts: local account logins, email/password, or external identity providers?
- **Q3**: Are custom report filters and exports required in the initial release, or is a basic summary/report view sufficient for version 1?

---

## Acceptance Criteria Summary

- The product must support user accounts, groups, expense creation, approval workflow, balance tracking, payment tracking, notifications, reporting, and cross-platform access as described in the original customer request.
- The Java Swing implementation must be treated as a distinct MVP subset that supports the same core expense flow while keeping GUI logic separate from business-logic rules.
- Each requirement is traceable to a user-facing behavior and can be validated by functional or acceptance testing without implementation detail leakage.
