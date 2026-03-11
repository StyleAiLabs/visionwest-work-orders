# Data Model: Admin and Client Admin Password Reset

## Entity: User (existing)
- `id` (integer, PK)
- `email` (string)
- `full_name` (string)
- `role` (`client` | `client_admin` | `staff` | `admin`)
- `client_id` (integer, FK to clients)
- `password` (string, bcrypt hash)
- `password_changed` (boolean)
- `is_active` (boolean)

## Operation: Password Reset Action (logical)
- Actor: authenticated user with role `admin` or `client_admin`
- Target: active user account selected from user management
- Side effects:
- Generate secure temporary password
- Hash and persist new password
- Set `password_changed = false`
- Send reset notification email to target user
- If actor is `client_admin`, include active admin emails in BCC

## Validation Rules
- Actor role must be `admin` or `client_admin`
- Target user must exist and be active
- Actor cannot reset own password through admin-reset endpoint
- `client_admin` can only reset users where `target.client_id = actor.client_id`
- `admin` can reset using existing context-switch behavior or global scope

## State Transition
- Before reset: `password_changed` may be true/false
- After reset success: `password_changed = false`
- On next successful login and self-change: `password_changed = true` (existing behavior)
