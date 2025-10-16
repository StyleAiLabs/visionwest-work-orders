# Feature Specification: Manual Work Order Entry

**Feature Branch**: `001-manual-work-order-entry`
**Created**: 2025-10-16
**Status**: Draft
**Input**: User description: "develop a feature to enter Work Order details manually inside the system. This feature should only be available to tenancy manager role"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Work Order Manually (Priority: P1)

As a tenancy manager, I want to manually create work orders directly in the system so that I can log urgent maintenance requests or work orders that don't come through the automated email workflow.

**Why this priority**: This is the core MVP functionality. Currently, all work orders must come through the n8n email automation workflow. When urgent issues arise or when work orders need to be created from phone calls, in-person reports, or other sources, tenancy managers have no way to enter them directly into the system.

**Independent Test**: Can be fully tested by logging in as a tenancy manager, navigating to the manual work order creation form, filling in all required fields, and submitting. The work order should appear in the work order list with "manual" as the source type.

**Acceptance Scenarios**:

1. **Given** a tenancy manager is logged into the system, **When** they navigate to the work order creation page and fill in all required fields (property name, supplier name, description, job number), **Then** the system creates a new work order with status "pending" and displays a success confirmation
2. **Given** a tenancy manager has created a manual work order, **When** they view the work order list, **Then** the newly created work order appears in the list with a visual indicator showing it was manually created (not from email automation)
3. **Given** a tenancy manager is filling out the work order form, **When** they attempt to submit without completing required fields, **Then** the system displays clear validation errors indicating which fields are missing
4. **Given** a tenancy manager successfully creates a work order, **When** the work order is saved, **Then** all relevant users (staff, admin, client users) receive notifications about the new work order

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

### User Story 3 - Attach Property and Supplier Details (Priority: P3)

As a tenancy manager, I want to select properties and suppliers from existing lists (if available) so that I can ensure consistency in data entry and reduce typing errors.

**Why this priority**: This is a quality-of-life improvement that reduces data entry errors and saves time. It's not critical for MVP but significantly improves user experience once basic manual entry is working.

**Independent Test**: Can be tested by implementing autocomplete or dropdown fields for property names and supplier names that pull from existing work orders. Users should be able to either select from the list or type new values.

**Acceptance Scenarios**:

1. **Given** a tenancy manager is creating a work order, **When** they start typing a property name, **Then** the system suggests previously used property names matching their input
2. **Given** a tenancy manager is creating a work order, **When** they select a property from the suggestion list, **Then** the system auto-fills associated property details (address, phone if previously entered)
3. **Given** a tenancy manager is entering a supplier name, **When** they select from previously used suppliers, **Then** supplier contact details (phone, email) are auto-filled if available
4. **Given** a tenancy manager needs to enter a new property or supplier not in the system, **When** they type a name not in the suggestions, **Then** they can still create the work order with the new information

---

### Edge Cases

- What happens when a tenancy manager tries to create a work order with a job number that already exists? (System should prevent duplicates or warn the user)
- How does the system handle partial form completion if the user navigates away before submitting? (Form data should be lost unless explicitly saved as draft)
- What happens when a tenancy manager tries to edit a work order that's already marked as "completed"? (Should allow editing with a warning or require specific permissions)
- How does the system handle very long text in description or notes fields? (Should enforce character limits or allow expansion)
- What happens if a tenancy manager is logged out due to session timeout while filling the form? (Unsaved data is lost; user must re-authenticate)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a form accessible only to users with the tenancy manager role for manual work order creation
- **FR-002**: System MUST require the following fields for work order creation: job number, property name, supplier name, and description
- **FR-003**: System MUST allow optional fields: date, supplier phone, supplier email, property address, property phone, PO number, authorized by, authorized contact, and authorized email
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

### Key Entities

- **Work Order (existing)**: Represents a maintenance or repair task. Key attributes include job_no (unique identifier), date, status (pending/in_progress/completed), supplier information (name, phone, email), property information (name, address, phone), description, PO number, authorization details, work_order_type (email/manual), created_by (user ID), and metadata (email details for automated work orders)

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

### Assumptions

1. **Role Mapping**: "Tenancy manager" maps to the existing `client_admin` role. All users with the client_admin role will have access to manual work order creation and editing features. No database migration required.
2. **Form Location**: Assuming the manual work order creation form will be accessible from the main dashboard or work order list page via a prominent "Create Work Order" button.
3. **Mobile-First**: Following constitution Principle I, this feature must work flawlessly on mobile devices as tenancy managers may need to create work orders while on-site.
4. **Job Number Generation**: Assuming job numbers will be manually entered by tenancy managers (not auto-generated), to maintain consistency with the current email workflow where job numbers come from external sources.
5. **Duplicate Prevention**: Assuming the system should prevent creation of work orders with duplicate job numbers (same validation as webhook endpoint).
6. **Edit Permissions**: Assuming tenancy managers can edit any work order in the system, not just ones they created, to allow for collaborative management.
7. **Audit Trail**: Assuming all edits should create system notes for compliance and transparency purposes.
