# Feature Specification: Multi-Client Work Order Management

## Objective
Extend the Visionwest work order platform into a multi-client solution where multiple independent organisations can be onboarded, each with isolated users, data, and workflows.

## Problem & Goals
- Visionwest currently hardcodes a single client; scaling requires data isolation, client-specific settings, and reporting.
- Goals: onboard new clients without code changes, restrict data visibility by client, maintain Visionwest as the first client, ensure migrations do not disrupt existing users or work orders.

## Scope
- **In:** database changes (new `clients` entity, foreign keys on users/work orders), auth updates (client-aware tokens), API filtering, admin tooling for managing clients, frontend awareness of client context, data migration/backfill.
- **Out:** billing, external identity provider integration, white-label theming (placeholder capabilities noted), client self-signup.

## Personas & User Stories
- **Admin** global admin
  - As a global admin, I need to switch between clients and see their work orders
- **Client Admin:** (client_admin) requests work orders, oversees work orders.
  - As a client admin, I want to see all work orders tied to my organisation so I can manage my portfolio securely.
- **Client User:** (client) manage work order, supports operations.
  - As client staff, I need to see work orders attacheed to me while guarding data boundaries.
  - I must receive notifications only for work orders belonging to my client.
  - As a client user I should be prevented from accessing URLs tied to another client.
- **Staff:** (staff) collaborates on work orders, update progress
  - As a staff user, I must able to update work order notes photos and status.

## Data Model Changes
- New `clients` table (`id`, `name`, `code`, `status`, `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `created_at`, `updated_at`).
- `users` table gains `client_id` (nullable during migration, required afterwards) with referential integrity (`ON DELETE SET NULL` recommended).
- `work_orders` table `client_id` repurposed or required with foreign key constraint.
- Optional `client_settings` JSON column or related table for branding/integration settings.
- **Migration plan:**
  1. Create `clients` table.
  2. Insert initial Visionwest client.
  3. Backfill `users.client_id` and `work_orders.client_id` referencing Visionwest.
  4. Enforce non-null constraint after verification.
  5. Add composite indexes, e.g., `(client_id, status)` and `(client_id, job_no)`.

## Backend/API Requirements
- Update Sequelize models (`Client`, `User`, `WorkOrder`) and associations (`Client.hasMany(User/WorkOrder)`, `User.belongsTo(Client)`).
- JWT payload/context carries `client_id`; middleware populates `req.clientId`.
- All client-facing endpoints filter by `client_id` automatically:
  - Work order listing, detail, creation, update.
  - Notes, photos, notifications, exports.
- Admin routes for `clients` CRUD with validation.
- Safeguards prevent cross-client modifications (ensure `work_order.client_id === req.clientId` before updates).
- Notification logic includes client scoping.
- Seeders/tests create clients and assign users/work orders.

## Frontend Requirements
- Auth context stores client info (name, id) from `/auth/me`.
- API service relies on backend scoping; requests/states remain client-aware.
- Admin UI (or placeholder behind feature flag) for client management.
- Dashboards and filters respect client scope (no global totals unless Visionwest admin role).
- Optional: display current client name in header to reduce confusion during multi-tenant support.

## User Experience & Security
- Login flow unchanged; users routed to their client’s data.
- Global admin portal requires an explicit, guarded client switcher.
- Logs include `client_id` for auditing.
- Exports and reports are limited to the active client context.

## Acceptance Criteria
- Users with `client_id = Visionwest` cannot access other clients’ work orders via API or direct URL.
- Creating a work order ties it to the creator’s `client_id`.
- Notifications and emails reference only same-client recipients.
- Global admin can list all clients and drill into their data via a secure switch.
- Backfill migration completes without data loss; existing Visionwest data remains intact.

## Testing & Validation
- Unit tests cover middleware enforcing client scope.
- Integration tests validate work order CRUD, notifications, and exports under client filtering.
- Migration test plan runs on a staging snapshot; verify per-client counts.
- Manual QA simulates two clients with separate logins to confirm UI/API isolation.

## Risks & Mitigations
- **Legacy scripts bypass filters:** audit services, enforce scoping in shared utilities.
- **Migration downtime:** schedule maintenance or use transactional migrations if available.
- **Admin misconfiguration (user without client):** block access, log clearly.

## Rollout Plan
1. Build migrations and models.
2. Update backend filters and tests.
3. Update auth/token handling and frontend context.
4. Run backfill in staging and complete QA.
5. Deploy (optionally behind feature flag); run production migration during low-traffic window.
6. Onboard pilot client after validation.
