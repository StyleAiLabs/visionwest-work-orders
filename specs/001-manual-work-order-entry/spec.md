# Feature Specification: Manual Work Order Entry

**Feature Branch**: `001-manual-work-order-entry`
**Created**: 2025-10-16
**Status**: Draft
**Input**: User description: "develop a feature to enter Work Order details manually inside the system. This feature should only be available to tenancy manager role"

## Clarifications

### Session 2025-10-20

- Q: Which approach should be used for the urgent indicator in the database and UI? → A: Boolean flag (is_urgent: true/false) with automatic priority sorting
- Q: Who should be able to mark a work order as urgent during creation? → A: All roles that can create work orders (client and client_admin)
- Q: How should the urgent flag be displayed and managed in the UI after creation? → A: Toggle switch on detail page + urgent indicator badge on list views with filter/sort options
- Q: Who should be able to toggle the urgent flag after a work order is created? → A: Only staff and admin roles (elevated permissions required to change urgency)
- Q: Should changing the urgent flag create an audit trail entry (system note)? → A: Yes, audit trail required

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Work Order Manually (Priority: P1)

As a tenancy manager, I want to manually create work orders directly in the system so that I can log urgent maintenance requests or work orders that don't come through the automated email workflow.

**Why this priority**: This is the core MVP functionality. Currently, all work orders must come through the n8n email automation workflow. When urgent issues arise or when work orders need to be created from phone calls, in-person reports, or other sources, tenancy managers have no way to enter them directly into the system.

**Independent Test**: Can be fully tested by logging in as a tenancy manager, navigating to the manual work order creation form, filling in all required fields, and submitting. The work order should appear in the work order list with "manual" as the source type.

**Acceptance Scenarios**:

1. **Given** a tenancy manager is logged into the system, **When** they navigate to the work order creation page and fill in all required fields (property name, property address, property phone, description, job number), **Then** the system creates a new work order with status "pending", supplier automatically set to "Williams Property Service", authorized by details auto-filled from user profile, and displays a success confirmation
2. **Given** a tenancy manager has created a manual work order, **When** they view the work order list, **Then** the newly created work order appears in the list with a visual indicator showing it was manually created (not from email automation)
3. **Given** a tenancy manager is filling out the work order form, **When** they attempt to submit without completing required fields, **Then** the system displays clear validation errors indicating which fields are missing
4. **Given** a tenancy manager successfully creates a work order, **When** the work order is saved, **Then** all relevant users (staff, admin, client users) receive notifications about the new work order
5. **Given** a tenancy manager is creating a work order, **When** they access the photo upload section, **Then** they can upload multiple "before" photos to document the initial state of the maintenance issue
6. **Given** a tenancy manager is creating a work order, **When** the form loads, **Then** the "Authorized By" field is automatically populated with the user's full name and contact details (email, phone) from their profile

---

### User Story 2 - Edit Work Order Fields (Priority: P2)

As a tenancy manager, I want to edit additional work order details after initial creation so that I can add missing information as it becomes available (like PO numbers, contact details, or updated descriptions).

**Why this priority**: Often, initial work order creation happens with partial information (e.g., during an urgent phone call). The ability to update details later ensures work orders remain accurate and complete as more information is gathered.

**Independent Test**: Can be tested by creating a manual work order with minimal information, then editing it to add optional fields like PO number, authorized contact, or property phone. Changes should persist and be visible to all users viewing the work order.

**Acceptance Scenarios**:

1. **Given** a tenancy manager has created a manual work order, **When** they navigate to the work order detail page and click "Edit", **Then** they see an edit form pre-filled with current work order data
2. **Given** a tenancy manager is editing a work order, **When** they update optional fields (PO number, property phone, authorized contact) and save, **Then** the changes are saved and visible on the work order detail page
3. **Given** a tenancy manager is editing a work order, **When** they change the supplier name or description, **Then** the system creates an audit trail note indicating what was changed and by whom
4. **Given** a work order was created via email automation (n8n webhook), **When** a tenancy manager views it, **Then** they can still edit certain fields but cannot change the original email metadata

---

### User Story 3 - Mark Work Order as Urgent (Priority: P2)

As a client or tenancy manager, I want to mark a work order as urgent before submitting the form so that critical maintenance issues receive immediate attention and are prioritized in the work queue.

**Why this priority**: Urgent maintenance issues (e.g., water leaks, electrical hazards, security concerns) need immediate visibility and prioritization. Without an urgent flag, all work orders appear equal, making it difficult for staff to identify and respond to critical issues quickly.

**Independent Test**: Can be tested by creating a work order with the urgent flag enabled, then verifying it appears with urgent indicator in list views, can be filtered/sorted by urgency, and shows toggle control on detail page for staff/admin users.

**Acceptance Scenarios**:

1. **Given** a client or client_admin is creating a work order, **When** they view the creation form, **Then** they see a checkbox or toggle to mark the work order as urgent
2. **Given** a user marks a work order as urgent during creation, **When** they submit the form, **Then** the work order is created with is_urgent set to true
3. **Given** an urgent work order exists, **When** users view the work order list, **Then** the urgent work order displays a prominent "Urgent" badge and appears higher in the default sort order
4. **Given** multiple work orders exist with varying urgency, **When** a user applies the urgent filter on the work order list, **Then** only urgent work orders are displayed
5. **Given** a staff or admin user views an urgent work order detail page, **When** they access the urgency toggle, **Then** they can change the urgent status and the change is saved immediately
6. **Given** a client or client_admin views a work order detail page, **When** they look for urgency controls, **Then** they see the urgent badge but cannot toggle it (read-only for non-staff/admin after creation)
7. **Given** a staff or admin user toggles the urgent flag, **When** the change is saved, **Then** the system creates an audit trail note documenting "Marked as urgent by [User Name]" or "Removed urgent flag by [User Name]"
8. **Given** urgent work orders exist, **When** users sort the work order list, **Then** urgent work orders appear before non-urgent work orders with the same status

---

### User Story 4 - Attach Property Details with Autocomplete (Priority: P3)

As a tenancy manager, I want to select properties from existing lists (if available) so that I can ensure consistency in data entry and reduce typing errors.

**Why this priority**: This is a quality-of-life improvement that reduces data entry errors and saves time. It's not critical for MVP but significantly improves user experience once basic manual entry is working. Supplier is always "Williams Property Service" so autocomplete is only needed for properties.

**Independent Test**: Can be tested by implementing autocomplete or dropdown fields for property names that pull from existing work orders. Users should be able to either select from the list or type new values.

**Acceptance Scenarios**:

1. **Given** a tenancy manager is creating a work order, **When** they start typing a property name, **Then** the system suggests previously used property names matching their input
2. **Given** a tenancy manager is creating a work order, **When** they select a property from the suggestion list, **Then** the system auto-fills associated property details (address, phone if previously entered)
3. **Given** a tenancy manager needs to enter a new property not in the system, **When** they type a name not in the suggestions, **Then** they can still create the work order with the new information
4. **Given** all work orders use Williams Property Service, **When** a tenancy manager creates a work order, **Then** the supplier name is automatically set to "Williams Property Service" with contact details (phone: 021 123 4567, email: info@williamspropertyservices.co.nz)

---

### Edge Cases

- What happens when a tenancy manager tries to create a work order with a job number that already exists? (System should prevent duplicates or warn the user)
- How does the system handle partial form completion if the user navigates away before submitting? (Form data should be lost unless explicitly saved as draft, including urgent flag selection)
- What happens when a tenancy manager tries to edit a work order that's already marked as "completed"? (Should allow editing with a warning or require specific permissions)
- How does the system handle very long text in description or notes fields? (Should enforce character limits or allow expansion)
- What happens if a tenancy manager is logged out due to session timeout while filling the form? (Unsaved data is lost; user must re-authenticate)
- What happens if a client user marks every work order as urgent? (Staff/admin can review and adjust urgency flags as needed; audit trail tracks all changes)
- How does the system handle work orders created via n8n webhook with no urgent flag? (Default to is_urgent = false; webhook can be updated later to accept optional urgent parameter)
- What happens when filtering by urgent status and no urgent work orders exist? (Display empty state message: "No urgent work orders found")
- Should urgent work orders generate different notifications? (Not in initial scope; notifications sent regardless of urgency, but future enhancement could add urgent-specific notification channels)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a form accessible only to users with the tenancy manager role for manual work order creation
- **FR-002**: System MUST require the following fields for work order creation: job number, property name, property address, property phone, and description (supplier name is automatically set to "Williams Property Service")
- **FR-003**: System MUST allow optional fields: date, PO number (supplier fields are pre-filled with Williams Property Service defaults and hidden from the form; authorized by contact details are auto-filled from logged-in user's profile)
- **FR-004**: System MUST validate that job numbers are unique before allowing work order creation
- **FR-005**: System MUST mark manually created work orders with a work order type of "manual" to distinguish them from email-automated work orders
- **FR-006**: System MUST assign the creating user as the "created_by" field value when saving manual work orders
- **FR-007**: System MUST set the initial status of manually created work orders to "pending"
- **FR-008**: System MUST send notifications to all active staff, admin, and client users when a manual work order is created
- **FR-009**: System MUST provide clear validation error messages for missing or invalid required fields
- **FR-010**: System MUST allow tenancy managers to edit work orders they created or any work orders in the system
- **FR-011**: System MUST create an audit trail (system note) when work orders are edited, documenting what changed and who made the change
- **FR-012**: System MUST preserve email metadata fields (email_subject, email_sender, email_received_date) from automated work orders and not allow manual editing of these fields
- **FR-013**: System MUST maintain backward compatibility with the n8n webhook integration (no changes to existing webhook endpoints)
- **FR-014**: Tenancy manager role MUST be mapped to the existing `client_admin` role, granting all current client administrators the ability to manually create and edit work orders
- **FR-015**: System MUST provide a photo upload interface during work order creation allowing tenancy managers to upload multiple "before" photos documenting the initial state of the maintenance issue
- **FR-016**: System MUST auto-populate the "Authorized By" field with the logged-in user's full name from their user profile
- **FR-017**: System MUST auto-populate the "Authorized Contact" field with the logged-in user's phone number from their user profile (if available)
- **FR-018**: System MUST auto-populate the "Authorized Email" field with the logged-in user's email address from their user profile
- **FR-019**: System MUST provide an "urgent" flag (boolean field is_urgent) on the work order creation form accessible to client and client_admin roles
- **FR-020**: System MUST allow client and client_admin users to mark work orders as urgent during creation
- **FR-021**: System MUST display urgent work orders with a prominent visual indicator (badge) in work order list views
- **FR-022**: System MUST provide filter and sort options for urgent work orders in list views
- **FR-023**: System MUST automatically prioritize urgent work orders higher in the default sort order (urgent before non-urgent within the same status)
- **FR-024**: System MUST display a toggle control for the urgent flag on work order detail pages, accessible only to staff and admin roles
- **FR-025**: System MUST display the urgent status as read-only (badge only, no toggle) on work order detail pages for client and client_admin roles
- **FR-026**: System MUST create an audit trail note when the urgent flag is changed, recording the action ("Marked as urgent" or "Removed urgent flag") and the user who made the change
- **FR-027**: System MUST default the is_urgent field to false if not explicitly set during work order creation

### Key Entities

- **Work Order (existing, modified)**: Represents a maintenance or repair task. Key attributes include job_no (unique identifier), date, status (pending/in_progress/completed), supplier information (name, phone, email), property information (name, address, phone), description, PO number, authorization details, work_order_type (email/manual), is_urgent (boolean flag for priority), created_by (user ID), and metadata (email details for automated work orders)

- **User (existing)**: Represents system users. Key attributes include id, username, email, role (client/client_admin/staff/admin), full_name, organization. The "tenancy manager" role needs to be mapped to one of these existing roles.

- **Work Order Note (existing)**: Represents audit trail entries and comments on work orders. Used to track edits and changes made to work orders.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tenancy managers can create a complete manual work order in under 3 minutes
- **SC-002**: 95% of manually created work orders pass validation on first submission attempt (indicating clear form design)
- **SC-003**: Manual work orders appear in the work order dashboard within 5 seconds of submission
- **SC-004**: All relevant users receive notifications for manual work orders within 10 seconds of creation
- **SC-005**: Zero disruption to existing n8n webhook workflow (all automated work orders continue to function normally)
- **SC-006**: Tenancy managers can edit work order details and changes are visible immediately to all users viewing that work order
- **SC-007**: Tenancy managers can upload multiple "before" photos during work order creation, with photos appearing in the work order detail view immediately after creation
- **SC-008**: Authorized By contact details (name, phone, email) are automatically populated from the user's profile, reducing form fields by 3 inputs
- **SC-009**: Urgent work orders are visually distinguishable in list views within 1 second of page load
- **SC-010**: Staff and admin users can toggle urgent status on detail pages with changes persisting immediately
- **SC-011**: Urgent work orders appear at the top of default-sorted work order lists (above non-urgent work orders with the same status)
- **SC-012**: All urgency changes create audit trail notes visible in the work order timeline within 2 seconds

### Assumptions

1. **Role Mapping**: "Tenancy manager" maps to the existing `client_admin` role. All users with the client_admin role will have access to manual work order creation and editing features. No database migration required.
2. **Form Location**: Assuming the manual work order creation form will be accessible from the main dashboard or work order list page via a prominent "Create Work Order" button.
3. **Mobile-First**: Following constitution Principle I, this feature must work flawlessly on mobile devices as tenancy managers may need to create work orders while on-site.
4. **Job Number Generation**: Assuming job numbers will be manually entered by tenancy managers (not auto-generated), to maintain consistency with the current email workflow where job numbers come from external sources.
5. **Duplicate Prevention**: Assuming the system should prevent creation of work orders with duplicate job numbers (same validation as webhook endpoint).
6. **Edit Permissions**: Assuming tenancy managers can edit any work order in the system, not just ones they created, to allow for collaborative management.
7. **Audit Trail**: Assuming all edits should create system notes for compliance and transparency purposes.
8. **Default Supplier**: All manually created work orders use "Williams Property Service" as the supplier. Supplier name, phone (021 123 4567), and email (info@williamspropertyservices.co.nz) are automatically filled and hidden from the form UI to simplify data entry.
9. **Property Details Mandatory**: Property name, property address, and property phone are now required fields to ensure complete property information is captured at the time of work order creation.
10. **Before Photos**: System allows upload of multiple "before" photos during work order creation to document the initial state of the issue, improving communication with maintenance staff.
11. **Auto-fill Authorization**: Authorized By, Authorized Contact, and Authorized Email fields are automatically populated from the logged-in user's profile (name, phone, email) to reduce data entry and ensure accurate contact information.
12. **Urgent Flag Default**: The is_urgent field defaults to false. Users must explicitly check/toggle it to mark a work order as urgent.
13. **Urgent Permission Model**: Client and client_admin can set urgency during creation only. Staff and admin can toggle urgency at any time (during creation or after). This prevents urgency flag abuse while allowing operational oversight.
14. **Urgent Sorting**: Urgent work orders sort before non-urgent ones within the same status category. For example, urgent pending work orders appear before non-urgent pending work orders.
15. **Urgent Visual Design**: The urgent badge uses attention-grabbing colors (e.g., red or orange) consistent with the NextGen WOM brand guidelines to ensure immediate visibility.

```
