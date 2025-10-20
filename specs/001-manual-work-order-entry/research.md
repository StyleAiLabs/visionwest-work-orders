# Research: Manual Work Order Entry

**Feature**: Manual Work Order Entry
**Date**: 2025-10-16
**Phase**: 0 - Research

## Overview

This document consolidates research findings for implementing manual work order creation and editing functionality. The research focuses on React form best practices for mobile-first design, role-based access control patterns, and integration with existing VisionWest systems.

## Research Topics

### 1. Mobile-First Form Design for React + Tailwind CSS

**Decision**: Use controlled components with React Hook Form for form state management and validation, styled with Tailwind CSS utility classes for mobile-first responsive design.

**Rationale**:
- React Hook Form provides excellent performance with minimal re-renders
- Built-in validation support aligns with FR-009 (clear validation error messages)
- Tailwind CSS mobile-first approach (`sm:`, `md:`, `lg:` breakpoints) matches constitution requirements
- Touch-friendly inputs easily achievable with Tailwind spacing utilities (minimum 44x44px touch targets via `h-11` or `p-3` classes)

**Alternatives Considered**:
- **Formik**: More heavyweight, slower performance on mobile devices
- **Uncontrolled forms with refs**: Less predictable validation, harder to implement autocomplete (P3)
- **Material-UI or Chakra UI**: Too heavy for mobile 3G connections, harder to customize touch target sizes

**Implementation Notes**:
- Use `<input>` elements with `type="text"`, `type="tel"`, `type="email"` for appropriate mobile keyboards
- Apply `className="h-11 px-3"` minimum for touch targets (11 * 0.25rem = 44px height)
- Use `focus:ring-2` and `focus:border-blue-500` for accessibility
- Implement field-level validation with immediate feedback

### 2. Role-Based Access Control (RBAC) for `client_admin` Users

**Decision**: Reuse existing Express middleware (`isClientAdmin` or create similar) to protect new manual work order endpoints; check role on frontend to show/hide "Create Work Order" button.

**Rationale**:
- Existing `auth.middleware.js` already has role-checking patterns (backend/middleware/auth.middleware.js:120)
- Frontend already has AuthContext for role access (documented in constitution project structure)
- Defense-in-depth: both frontend UI hiding and backend enforcement
- Aligns with Principle V (Security & Data Protection)

**Alternatives Considered**:
- **Permission-based system**: Overengineering for current needs (only one role needed)
- **Frontend-only restriction**: Insecure, violates security principle
- **Create new role "tenancy_manager"**: Requires database migration, violates simplicity (spec chose client_admin mapping)

**Implementation Notes**:
- Backend: Add `isClientAdmin` middleware check (or reuse existing `isAnyValidRole` with specific role check)
- Frontend: Conditionally render "Create Work Order" button: `{user.role === 'client_admin' && <CreateButton />}`
- API returns 403 Forbidden if non-client_admin user attempts manual creation

### 3. Work Order Data Model Extension

**Decision**: Add `work_order_type` as a discriminator field to existing `workOrder` Sequelize model. No migration needed if database already allows this field; if field doesn't exist, create lightweight migration.

**Rationale**:
- Minimal impact to existing data model
- Allows filtering/reporting on manual vs. automated work orders
- Webhook controller already sets `work_order_type: 'email'` (backend/controllers/webhook.controller.js:133)
- Aligns with FR-005 requirement to distinguish manual work orders

**Alternatives Considered**:
- **Separate "ManualWorkOrder" model**: Overengineering, duplicates fields, complicates queries
- **Use metadata field**: Less queryable, harder to filter in reports
- **No discriminator**: Cannot distinguish source, violates FR-005

**Implementation Notes**:
- Check if `work_order_type` column exists in database
- If not, create migration: `ALTER TABLE work_orders ADD COLUMN work_order_type VARCHAR(50) DEFAULT 'email'`
- Manual work orders set `work_order_type: 'manual'`
- Add database index on `work_order_type` for efficient filtering

### 4. Notification Reuse Strategy

**Decision**: Reuse existing `notifyUsersAboutWorkOrder` function from webhook.controller.js for manual work order creation; adapt notification messages to indicate "manually created" vs. "email created."

**Rationale**:
- DRY principle - avoid duplicating notification logic
- Ensures consistent notification delivery (FR-008)
- Existing function already handles staff/admin/client user notification
- Can be imported or refactored into shared utility

**Alternatives Considered**:
- **Duplicate notification logic**: Violates DRY, maintenance burden
- **No notifications for manual work orders**: Violates FR-008, inconsistent UX
- **New notification service**: Overengineering for current needs

**Implementation Notes**:
- Extract `notifyUsersAboutWorkOrder` and `notifyUsersAboutWorkOrderUpdate` to `utils/notificationHelper.js`
- Import in both webhook.controller.js and workOrder.controller.js
- Modify notification message to include work order source: "A new work order has been manually created" vs. "automatically created from an email"

### 5. Duplicate Job Number Validation

**Decision**: Implement client-side validation with debounced API check for duplicate job numbers; server-side enforcement via database unique constraint or pre-save query check.

**Rationale**:
- Client-side check provides immediate user feedback (aligns with SC-002: 95% validation pass rate)
- Server-side enforcement prevents race conditions and ensures data integrity
- Debouncing reduces API calls while typing
- Webhook controller already checks for duplicates (backend/controllers/webhook.controller.js:49)

**Alternatives Considered**:
- **Client-side only**: Insecure, race conditions possible
- **Server-side only**: Poor UX, user only learns of duplicate after submission
- **Database unique constraint on job_no**: Ideal if not already present

**Implementation Notes**:
- Add unique constraint to `job_no` column if not present: `ALTER TABLE work_orders ADD CONSTRAINT unique_job_no UNIQUE (job_no)`
- Frontend: debounce job number input (500ms delay), call GET `/api/work-orders/check-duplicate?job_no=XXX`
- Backend: return {exists: true/false} based on database query
- Display inline error if duplicate detected before form submission

### 6. Audit Trail for Edits (FR-011)

**Decision**: Create `WorkOrderNote` entries with system-generated content documenting field changes when work orders are edited via PUT endpoint.

**Rationale**:
- Existing `WorkOrderNote` model already used for audit trail (backend/controllers/webhook.controller.js:82-86)
- Provides transparency and compliance tracking
- Allows filtering "system notes" vs "user notes" if needed
- Aligns with FR-011 requirement

**Alternatives Considered**:
- **Separate audit log table**: Overengineering, adds complexity
- **No audit trail**: Violates FR-011, poor compliance
- **Event sourcing**: Massive overengineering for this scope

**Implementation Notes**:
- On edit, compare old vs. new values
- Generate note: "Work order updated by {user.full_name}. Changed: {field_list}"
- Example: "Work order updated by Jane Manager. Changed: description, supplier_phone, po_number"
- Store note with `created_by` = editing user's ID

### 7. Frontend Routing and Navigation

**Decision**: Add two new routes in React Router: `/work-orders/create` (P1) and `/work-orders/:id/edit` (P2). Add prominent "Create Work Order" floating action button (FAB) on work order list page for `client_admin` users.

**Rationale**:
- Follows existing routing pattern in React Router setup
- FAB pattern is mobile-friendly and accessible on all screen sizes
- Role-based conditional rendering keeps UI clean for non-client_admin users
- Aligns with spec assumption that form is accessible from work order list

**Alternatives Considered**:
- **Modal/dialog for creation**: Harder to make mobile-friendly, limited screen space
- **Separate "Admin" section**: Creates unnecessary navigation complexity
- **Top navigation button**: Less mobile-friendly than FAB

**Implementation Notes**:
- Route: `<Route path="/work-orders/create" element={<CreateWorkOrder />} />`
- Route: `<Route path="/work-orders/:id/edit" element={<EditWorkOrder />} />`
- FAB positioned `fixed bottom-6 right-6` with z-index above content
- FAB uses Tailwind: `className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg"`
- FAB shows only for `client_admin`: `{user.role === 'client_admin' && <FAB />}`

### 8. Autocomplete/Suggestions Implementation (P3)

**Decision**: Implement autocomplete using debounced API calls to `/api/work-orders/suggestions?type=property&q=search` that returns distinct property names and supplier names from existing work orders. Use Tailwind-styled dropdown with keyboard navigation.

**Rationale**:
- Simple implementation without external autocomplete library
- Leverages existing work order data for suggestions
- Debouncing reduces server load
- Keyboard navigation improves accessibility

**Alternatives Considered**:
- **External library (react-select, downshift)**: Adds bundle size, less customizable for mobile
- **Client-side filtering**: Requires loading all properties/suppliers upfront (poor performance)
- **Separate Property/Supplier tables**: Overengineering, not in current scope

**Implementation Notes**:
- Backend: Query distinct property_name, property_address, property_phone grouped by property_name
- Backend: Query distinct supplier_name, supplier_phone, supplier_email grouped by supplier_name
- Frontend: Debounce input (300ms), show dropdown with max 10 suggestions
- On selection, auto-fill related fields (address, phone, email)
- Allow free text entry if no match found

### 9. Email Notification for New Work Orders

**Decision**: Use Nodemailer library to send email notifications to mark@williamspropertyservices.co.nz when manual work orders are created. Email sending is asynchronous and non-blocking.

**Rationale**:
- Nodemailer is the de facto standard for Node.js email sending
- Supports multiple transport methods (SMTP, SendGrid, AWS SES, etc.)
- Asynchronous sending ensures work order creation isn't blocked by email delivery failures
- Simple configuration via environment variables

**Alternatives Considered**:
- **SendGrid SDK**: More complex setup, requires dedicated service account
- **AWS SES SDK**: Good if already using AWS, but adds dependency complexity
- **Postmark**: Paid service, unnecessary for simple notification emails
- **Direct SMTP**: Nodemailer handles this with better error handling

**Implementation Notes**:
- Install nodemailer: `npm install nodemailer`
- Configure SMTP transport via environment variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD)
- Create email template with work order details (job_no, property_name, supplier_name, description)
- Send email after work order saved to database
- Log email sending errors but don't throw exceptions
- Email recipient (mark@williamspropertyservices.co.nz) configurable via environment variable (EMAIL_NOTIFICATION_RECIPIENT)

## Summary of Technical Decisions

| **Topic** | **Decision** |
|-----------|-------------|
| Form Library | React Hook Form + Tailwind CSS |
| RBAC Enforcement | Express middleware + frontend conditional rendering |
| Data Model | Add `work_order_type` discriminator field |
| Notifications | Reuse existing notification helper functions |
| Email Notifications | Nodemailer library with asynchronous sending |
| Duplicate Check | Client debounced API + server unique constraint |
| Audit Trail | System-generated `WorkOrderNote` entries |
| Routing | New routes: `/work-orders/create` and `/work-orders/:id/edit` |
| Navigation | Floating Action Button (FAB) on work order list |
| Autocomplete (P3) | Debounced API returning distinct values from existing work orders |

## Next Steps

Proceed to Phase 1:
- Generate `data-model.md` detailing the work order schema
- Generate API contracts in `contracts/` directory
- Generate `quickstart.md` for developer onboarding

---

## Addendum: Work Order Cancellation Research (2025-10-20)

### 6. Confirmation Dialog Implementation

**Decision**: Use controlled modal component with React state, render as portal to prevent z-index issues

**Rationale**:
- React portals allow rendering outside normal DOM hierarchy, preventing modal overlay conflicts
- Controlled components (state-driven visibility) align with React best practices
- Mobile-friendly touch targets (44px minimum) require careful button sizing
- Tailwind CSS provides responsive breakpoints for mobile/desktop adaptation

**Alternatives Considered**:
- Browser `window.confirm()` - Rejected: Not styleable, poor mobile UX, inconsistent across browsers
- Third-party library (SweetAlert2, react-modal) - Rejected: Adds dependency, overkill for simple confirmation
- Inline confirmation (expand UI) - Rejected: Doesn't block user interaction, less clear intent

### 7. Status Dropdown vs Dedicated Cancel Button

**Decision**: Dedicated cancel button separate from status dropdown

**Rationale**:
- Status dropdown is for staff/admin to manage workflow states (pending → in-progress → completed)
- Cancellation is a distinct action with different permissions (client can cancel but not change to in-progress)
- Separate button makes destructive action more explicit and harder to trigger accidentally
- Aligns with existing UI pattern where urgent toggle is separate from status controls

### 8. Audit Trail Message Format

**Decision**: "Work order cancelled by [User Full Name]" with automatic timestamp from WorkOrderNote.created_at

**Rationale**:
- Consistent with existing audit trail pattern: "Marked as urgent by [User Name]" (FR-026)
- Uses user.full_name from JWT token for accountability
- Timestamp automatically added by Sequelize model (no manual date formatting needed)
- Simple, human-readable format for compliance and transparency

### 9. Role Permission Implementation for Cancellation

**Decision**: Update auth.middleware.js handleWorkOrderStatusUpdate to reject staff role for cancellation

**Rationale**:
- Existing middleware already handles client-only cancellation
- Need to add staff rejection: staff can update to pending/in-progress/completed but NOT cancelled
- Preserves existing role hierarchy while adding granular cancellation control
- Error message: "Staff users cannot cancel work orders. Contact an administrator."

### 10. Preventing Reactivation of Cancelled Work Orders

**Decision**: Frontend validation + backend rejection on status change attempts from 'cancelled'

**Rationale**:
- Frontend: Disable/hide status dropdown when status === 'cancelled', show "Cancelled (permanent)" badge
- Backend: In updateWorkOrderStatus, check if current status is 'cancelled' and reject any changes
- Allows viewing cancelled work orders for historical reference (dashboard counts, filtered lists)
- Prevents accidental or intentional reactivation per spec requirement (FR-032)

**Performance Validation**:
- Cancellation: 1 UPDATE + 1 INSERT (audit note) = 2 queries per cancellation
- Expected volume: < 10 cancellations per day (estimated 5% of work orders)
- Confirmation dialog: Portal rendering ~50ms overhead (acceptable for SC-013)
- Status update + audit trail: ~200ms (meets SC-014 and SC-015 requirements)

**No new dependencies required**. Feature uses existing infrastructure (React portals, Sequelize, existing auth middleware).

