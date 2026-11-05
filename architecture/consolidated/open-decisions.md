# Open Decisions and Assumptions

The architecture should not silently settle product policy. The following choices need stakeholder confirmation before implementation of the affected behavior.

## Decisions requiring stakeholder input

| Topic | Current design assumption | Why unresolved |
|---|---|---|
| MVP deployment | Swing uses the same trusted application process and canonical PostgreSQL boundary; multi-user remote use requires a service boundary. | Spec identifies Swing MVP and shared accounts, but does not say whether the desktop is standalone, centrally hosted, or single-user. |
| Approval required | Approval is required by default for every expense; no balance posting before approval. | FR-008 mandates an approval workflow, while Q1 asks whether configuration is needed. |
| Self-approval | Expense creator cannot approve their own submission. | Safer separation of duties, but not explicitly settled. |
| Reviewer roles | Admin or explicitly designated reviewer can approve/reject; role combinations are configurable only after policy decision. | Specification names group admins or reviewers but does not define assignment rules. |
| Payment confirmation | Recording creates a `Recorded` claim; a distinct authorized confirmation posts settlement. | Spec says record when payments have been made but does not define evidence or confirmation actor. |
| Overpayment | Reject confirmation above outstanding obligation. | Spec identifies over-balance payments as an edge case but gives no resolution. |
| Currency | One currency per group, no FX. | Currency behavior is not specified; this proposal makes it explicit for coherent balancing. |
| Numeric precision | Two decimals, `HALF_UP`, four decimal percentage precision, final participant absorbs residual. | Two-decimal rounding and final remainder are specified; percentage scale and rounding mode are not. |
| Authentication | Account-based login; adapter owns credentials. | Password/federation, recovery, MFA, and session policy are open in Q2. |
| Notification channel | Durable in-app notification for every group member when expense is created; email/push future. | Notification requirement says notify every member; delivery channel is unspecified. |
| Reporting | Date-range and group filters; summary generated from ledger/source facts. | Custom filters/export formats and launch scope remain open in Q3. |
| Retention and recovery | Preserve financial audit history; define retention and restore objectives before deployment. | No retention, deletion, backup, RPO, or RTO policy is specified. |

## Fixed architectural resolutions

These are design choices made to eliminate contradictions in the source architecture documents, not added customer requirements:

- Expense `payer_id` is explicit in domain, use cases, and persistence.
- The append-only ledger is the sole financial authority; Balance is derived and not independently editable.
- Payment recording does not alter balances; confirmation posts settlement. Cancellation before confirmation has no financial effect; confirmed corrections reverse and replace.
- PostgreSQL is the only canonical database. H2 and SQLite are not retained as alternate development/test or MVP stores.
- One Maven module with package boundaries is the initial structure; no microservices or distributed services.
- The architecture review reports requested by the consolidation task were absent from `architecture/reviews/`; this set therefore reconciles available artifacts but cannot claim to address report-specific findings.

