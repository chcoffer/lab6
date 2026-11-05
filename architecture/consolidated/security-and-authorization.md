# Security and Authorization

## Identity

`User` is a domain account identity; credentials are held by an authentication adapter or provider. The specification requires account creation and login but does not choose password, federation, recovery, MFA, or session policy. Any eventual credential implementation must avoid plaintext secrets, use a vetted password hashing/authentication mechanism, protect sessions, and avoid revealing whether an identity exists in failure messages.

## Group-scoped authorization

Each use case receives a principal established by the authentication boundary. A user-supplied group/entity ID is only a selector, not authorization. Load and verify active membership and role before every read or write, including reports, notifications, expense receipts, and balances. Enforce access in application workflows and scope repository queries; UI visibility is not a security control.

| Role | Proposed authority |
|---|---|
| Member | View authorized group activity; create expenses; record payment claim, subject to policy. |
| Admin | Manage group policy and membership invitations; designate reviewers. |
| Reviewer | Approve or reject pending expenses; confirm settlement only if product policy grants it. |

The exact role combination is open. Approval decisions are restricted to designated reviewers. The proposed policy prohibits self-approval; the specification does not settle whether this exception may be configured.

## Sensitive data and audit

Receipt storage is private; use opaque references and authorize each retrieval. Validate type, size, and content; prevent path traversal. Notifications contain only necessary information and are reauthorized when opened. Database credentials belong only to the trusted application process; future remote clients use an authenticated API over TLS and never receive database credentials.

Audit actor, action, entity, time, correlation ID, decision/reason, and reversal relationship for membership, approval, payment, and financial corrections. Do not log passwords, session tokens, receipt bytes, or unnecessary personal/payment details. Retention, account erasure/anonymization, local device protection, and report export rules require stakeholder policy.

## Security review obligations

Before any eventual release, review object-level access, group isolation, reviewer authorization, invitation binding, credential handling, database least privilege, SQL injection, receipt access, session handling, audit privacy, backup encryption, and authorization on report/export paths. These are design obligations, not a claim of security certification.

