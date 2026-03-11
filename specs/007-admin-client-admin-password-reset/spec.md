# Feature Specification: Admin and Client Admin Password Reset

**Feature Branch**: `007-admin-client-admin-password-reset`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "implement password reset option which is only available for \"admin\" and \"client_admin\" user roles. once password is changed it should trigger and email to the user notifying that. when client \"client_admin\" user change the password, send Bcc notification to \"admin\""

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reset Password for Managed User (Priority: P1)

As an `admin` or `client_admin`, I can reset another managed user's password from user management so they can regain access securely.

**Why this priority**: Without reset capability, user recovery requires manual database changes and blocks business operations.

**Independent Test**: Can be tested by triggering reset for an existing active user and confirming temporary login credentials are regenerated and usable.

**Acceptance Scenarios**:

1. **Given** an authenticated `admin`, **When** they reset any active user password, **Then** the system generates a new temporary password, stores it hashed, and marks `password_changed = false`.
2. **Given** an authenticated `client_admin`, **When** they reset a user within their own client organization, **Then** the reset succeeds with the same temporary-password behavior.
3. **Given** an authenticated `client_admin`, **When** they attempt to reset a user from another client organization, **Then** the system denies access.

---

### User Story 2 - Reset Notification Email (Priority: P2)

As a reset target user, I receive an email notification with my temporary password and next steps immediately after an admin-initiated reset.

**Why this priority**: Users must be informed promptly and have actionable information to complete login recovery.

**Independent Test**: Can be tested by performing reset and verifying outbound email delivery payload to the target user address.

**Acceptance Scenarios**:

1. **Given** a successful reset, **When** notification is sent, **Then** the target user receives a password-reset email containing temporary password and login URL.
2. **Given** email provider failure, **When** reset completes, **Then** password reset API still succeeds and logs email failure.

---

### User Story 3 - Admin Oversight on Client Admin Resets (Priority: P3)

As a system `admin`, I receive BCC notifications when a `client_admin` performs a user password reset.

**Why this priority**: Provides audit visibility for sensitive credential actions initiated by client-side administrators.

**Independent Test**: Can be tested by executing reset as `client_admin` and verifying BCC recipient list includes active admin users.

**Acceptance Scenarios**:

1. **Given** a `client_admin` reset action, **When** email is generated, **Then** active `admin` users are included as BCC recipients.
2. **Given** an `admin` reset action, **When** email is generated, **Then** no extra BCC oversight requirement is applied.

### Edge Cases

- Reset target user is inactive: reject with clear error.
- Reset actor tries to reset their own password using admin reset flow: reject and direct to self-service change-password.
- No admin users available for BCC on client_admin action: continue sending email to target user without failing reset.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a password reset action in user management UI visible only to `admin` and `client_admin` users.
- **FR-002**: System MUST provide a protected API endpoint that allows only `admin` and `client_admin` to reset another active user's password.
- **FR-003**: System MUST enforce tenant isolation for `client_admin` resets so they can reset only users in their own `client_id`.
- **FR-004**: System MUST support admin context switching for `admin` resets using existing `X-Client-Context` behavior.
- **FR-005**: System MUST generate a secure temporary password, hash it with bcrypt, update the user password, and set `password_changed` to `false`.
- **FR-006**: System MUST send a reset notification email to the target user after successful password update.
- **FR-007**: When actor role is `client_admin`, system MUST send BCC notification email to active `admin` user email addresses.
- **FR-008**: System MUST keep reset successful even if email delivery fails, while logging the failure.
- **FR-009**: System MUST prevent self-reset through admin reset endpoint.

### Key Entities *(include if feature involves data)*

- **User**: Existing entity with `id`, `email`, `role`, `client_id`, `password`, `password_changed`, `is_active`.
- **PasswordResetAction**: Logical operation on User credentials with actor (`admin`/`client_admin`), target user, generated temporary password, and notification side effects.
- **ResetNotificationEmail**: Outbound email to target user, optionally BCC to admin recipients when actor is `client_admin`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful reset requests update password hash and set `password_changed = false` for target users.
- **SC-002**: 100% of successful reset requests attempt at least one notification email send to the target user.
- **SC-003**: 100% of reset requests from unauthorized roles (`client`, `staff`) are rejected with 403.
- **SC-004**: For client_admin-initiated resets, BCC includes at least one active admin email when available.
