# Research: Admin and Client Admin Password Reset

## Decision 1: Use admin-initiated temporary password reset (not self-service link flow)
- Decision: Reset endpoint will generate a strong temporary password and set `password_changed=false`.
- Rationale: Existing login flow already enforces first-login password update when `password_changed` is false.
- Alternatives considered:
- Email reset-link token flow.
- One-time OTP-based reset.

## Decision 2: Scope reset action under `/api/users/:userId/reset-password`
- Decision: Add reset endpoint to user management routes, protected by existing `verifyToken`, `isClientAdminOrAdmin`, and `addClientScope` middleware.
- Rationale: The action is user-administration behavior, not authentication self-service; keeps RBAC and tenant scoping centralized.
- Alternatives considered:
- Put endpoint in `/api/auth/*`.
- Reuse `/api/auth/change-password` with optional actor target.

## Decision 3: Keep email delivery non-blocking and failure-tolerant
- Decision: Reuse `emailService` pattern (Brevo first, nodemailer fallback), with internal try/catch that logs but does not fail API.
- Rationale: Aligns with constitution Integration Resilience and existing user credential email behavior.
- Alternatives considered:
- Synchronous hard-fail email delivery.
- Queue-based email worker (future enhancement).

## Decision 4: Client-admin resets trigger BCC to active admins
- Decision: For actor role `client_admin`, gather active `admin` users and add as BCC recipients in notification email.
- Rationale: Meets oversight requirement while preserving user notification primary recipient.
- Alternatives considered:
- Use static admin email from env only.
- Send separate audit email instead of BCC.

## Decision 5: Frontend reset action placement
- Decision: Add `Reset Password` action in existing `UserList` action area with confirmation modal.
- Rationale: Keeps admin workflows in one place and minimizes navigation/UX complexity.
- Alternatives considered:
- Dedicated reset page.
- Add reset into the unimplemented edit flow.
