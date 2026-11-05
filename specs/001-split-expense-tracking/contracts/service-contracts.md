# Service Contracts: SplitSmart

This document outlines the core contracts that the application services must satisfy. These contracts define responsibility boundaries and are used across the Swing UI, business logic, and persistence layers.

## 1. UserAccountService

```java
public interface UserAccountService {
    User registerUser(RegisterUserRequest request);
    Optional<User> login(String email, String password);
    User getUserById(UUID userId);
    List<Group> getGroupsForUser(UUID userId);
}
```

### Responsibilities
- Create and validate user accounts
- Authenticate users
- Return the user’s accessible group membership and profile data

## 2. GroupService

```java
public interface GroupService {
    Group createGroup(CreateGroupRequest request, UUID createdByUserId);
    GroupMembership inviteMember(UUID groupId, UUID invitedUserId, UUID invitedByUserId);
    GroupMembership approveMembership(UUID membershipId, UUID approverUserId);
    List<User> getMembers(UUID groupId);
    boolean userHasAccess(UUID userId, UUID groupId);
}
```

### Responsibilities
- Manage group lifecycle and memberships
- Enforce invitation-based membership approvals
- Guard group-level authorization and data isolation

## 3. ExpenseService

```java
public interface ExpenseService {
    Expense createExpense(CreateExpenseRequest request, UUID createdByUserId);
    Expense approveExpense(UUID expenseId, UUID reviewerUserId);
    Expense rejectExpense(UUID expenseId, UUID reviewerUserId, String reason);
    List<Expense> getExpensesForGroup(UUID groupId, LocalDate fromDate, LocalDate toDate);
    Map<UUID, BigDecimal> calculateShares(Expense expense);
}
```

### Responsibilities
- Validate expense inputs and participant membership
- Evaluate equal and percentage-based split rules
- Persist expense records and participant allocations
- Enforce approval gating before values affect ledger balances

## 4. ApprovalService

```java
public interface ApprovalService {
    ApprovalRecord submitForApproval(UUID expenseId, UUID reviewerUserId);
    ApprovalRecord approve(UUID expenseId, UUID reviewerUserId, String note);
    ApprovalRecord reject(UUID expenseId, UUID reviewerUserId, String reason);
    List<ApprovalRecord> getApprovalHistory(UUID expenseId);
}
```

### Responsibilities
- Ensure only designated reviewers may approve or reject expenses
- Track all approval actions in an auditable record
- Prevent approval workflow bypasses

## 5. BalanceService

```java
public interface BalanceService {
    List<Balance> getBalancesForGroup(UUID groupId, UUID userId);
    BigDecimal getNetBalance(UUID userId, UUID otherUserId, UUID groupId);
    void recalculateBalances(UUID groupId);
}
```

### Responsibilities
- Compute and expose net balances within a group
- Reconcile balances after expense approval and payment settlement
- Support reporting and ledger review

## 6. PaymentService

```java
public interface PaymentService {
    Payment recordPayment(CreatePaymentRequest request, UUID actorUserId);
    List<Payment> getPaymentsForGroup(UUID groupId);
    void applySettlement(UUID paymentId);
}
```

### Responsibilities
- Record user-to-user settlement activity
- Update balances consistently after payment creation
- Preserve the history of financial transactions

## 7. NotificationService

```java
public interface NotificationService {
    void notifyGroupMembers(UUID groupId, UUID expenseId, NotificationType type);
    List<Notification> getNotificationsForUser(UUID userId);
    void markNotificationRead(UUID notificationId, UUID userId);
}
```

### Responsibilities
- Dispatch notifications when expenses are created or reviewed
- Keep unread notification state
- Support future distributed notification channels without changing domain logic

## 8. ReportingService

```java
public interface ReportingService {
    Report generateReport(UUID userId, UUID groupId, LocalDate startDate, LocalDate endDate);
    List<Expense> getExpenseHistory(UUID groupId, LocalDate startDate, LocalDate endDate);
    List<Payment> getPaymentHistory(UUID groupId, LocalDate startDate, LocalDate endDate);
}
```

### Responsibilities
- Produce summaries and filtered histories for users and groups
- Support custom date-range reporting
- Keep report generation separate from UI and persistence implementation details

## Data Access Contracts

```java
public interface ExpenseRepository {
    Expense save(Expense expense);
    Optional<Expense> findById(UUID expenseId);
    List<Expense> findByGroupId(UUID groupId);
}

public interface PaymentRepository {
    Payment save(Payment payment);
    List<Payment> findByGroupId(UUID groupId);
}

public interface GroupMembershipRepository {
    Optional<GroupMembership> findMembership(UUID groupId, UUID userId);
    List<GroupMembership> findByGroupId(UUID groupId);
}
```

## Validation Contracts

The service contracts must reject invalid inputs before the domain or repository layers persist data. The following validation rules are mandatory:

- expense amount must be greater than zero
- percentage totals must equal 100% before a percentage split is accepted
- a group member must be included for every participant allocation
- a user may not approve or reject an expense without reviewer authorization
- payment amounts must be positive and correspond to valid balances or settlement intent

## Design Notes

All contracts depend on domain objects and request DTOs, not on Swing UI types. This keeps business rules reusable and testable while allowing the UI to change without invalidating the underlying domain model.
