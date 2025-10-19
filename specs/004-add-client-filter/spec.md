# Feature Specification: Admin Client Filter for Jobs Dashboard

**Feature Branch**: `004-add-client-filter`
**Created**: 2025-10-19
**Status**: Draft
**Input**: User description: "after admin user login, in the jobs filter dashboard should have him option to filter all the jobs by client along with filter by austorised person (already there). do not over engineer just add client filter and update the filters accordingly"

## Clarifications

### Session 2025-10-19

- Q: When an admin applies or changes the client filter, how should the pagination behave? → A: Reset to page 1 and recalculate total pages based on the filtered result count
- Q: When an admin selects a client filter that results in zero work orders, what should be displayed? → A: Show empty list with message "No work orders found for [Client Name]"
- Q: What should be the default client filter selection when an admin first loads the jobs page? → A: All Clients (show work orders from all clients)
- Q: When an admin switches clients and the currently selected authorized person doesn't exist in the new client's work orders, what should happen to the authorized person filter? → A: Automatically clear the authorized person filter and show all work orders for the new client
- Q: How should the clients be sorted in the client filter dropdown? → A: Alphabetically by client name (A-Z)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Views All Clients' Jobs (Priority: P1)

An admin user logs in and needs to view work orders across different clients to monitor overall system activity, investigate issues, or generate reports.

**Why this priority**: Core functionality that enables admins to perform their primary job - managing work orders across all clients in the system.

**Independent Test**: Can be fully tested by logging in as admin, selecting different clients from the filter dropdown, and verifying that only work orders belonging to the selected client are displayed.

**Acceptance Scenarios**:

1. **Given** an admin user is logged into the dashboard, **When** they view the jobs page, **Then** they see a client filter dropdown alongside the existing authorized person filter
2. **Given** an admin has selected a specific client from the dropdown, **When** the jobs list loads, **Then** only work orders belonging to that client are displayed
3. **Given** an admin is viewing jobs for Client A, **When** they switch to Client B using the dropdown, **Then** the jobs list refreshes to show only Client B's work orders and pagination resets to page 1 with recalculated total pages

---

### User Story 2 - Admin Combines Client and Authorized Person Filters (Priority: P2)

An admin user needs to narrow down work orders by both client and authorized person to quickly find specific jobs or investigate issues related to a particular person within a specific client organization.

**Why this priority**: Enhances filtering capabilities by allowing combination of filters, improving admin efficiency when searching for specific work orders.

**Independent Test**: Can be tested by selecting a client, then selecting an authorized person, and verifying that only work orders matching both criteria are displayed.

**Acceptance Scenarios**:

1. **Given** an admin has selected Client A from the client filter, **When** they select an authorized person from the authorized person filter, **Then** only work orders for Client A that are authorized by that person are displayed
2. **Given** an admin has both filters active, **When** they clear the client filter, **Then** work orders from all clients for the selected authorized person are shown
3. **Given** an admin has both filters active, **When** they clear the authorized person filter, **Then** all work orders for the selected client are shown

---

### User Story 3 - Admin Views Default Client Context (Priority: P3)

An admin user logs in and sees an appropriate default view without having to immediately select a client, providing a sensible starting point for their work.

**Why this priority**: Improves user experience by providing a logical default view, though admins can immediately change it as needed.

**Independent Test**: Can be tested by logging in as admin and verifying the default client selection behavior matches expectations.

**Acceptance Scenarios**:

1. **Given** an admin user logs into the dashboard for the first time, **When** the jobs page loads, **Then** the client filter shows "All Clients" as the default selection and displays work orders from all clients
2. **Given** an admin has previously selected a specific client, **When** they return to the jobs page in the same session, **Then** their previously selected client remains active

---

### Edge Cases

- When an admin selects a client that has no work orders, system displays an empty list with message "No work orders found for [Client Name]"
- When an admin switches clients and the previously selected authorized person doesn't exist in the new client's work orders, the authorized person filter is automatically cleared and all work orders for the new client are shown
- How does the system handle when a client is deleted or deactivated while an admin is viewing their work orders?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a client filter dropdown on the jobs dashboard when accessed by admin users
- **FR-002**: System MUST populate the client filter dropdown with all active clients in the system, displaying the client name sorted alphabetically (A-Z)
- **FR-003**: Admin users MUST be able to select a client from the dropdown to filter work orders by that client
- **FR-004**: System MUST refresh the work orders list when a client is selected, showing only work orders belonging to the selected client
- **FR-005**: System MUST update the authorized person filter options when a client is selected, showing only authorized persons from that client's work orders
- **FR-006**: Admin users MUST be able to combine client filter and authorized person filter to narrow down work orders
- **FR-007**: System MUST apply client-scoped filtering to the dashboard summary counts (Pending, In Progress, Completed, Cancelled) when a client is selected
- **FR-008**: System MUST automatically clear the authorized person filter when admin switches to a different client if the previously selected authorized person doesn't exist in the new client's work orders, showing all work orders for the new client
- **FR-009**: System MUST NOT display the client filter to non-admin users (client, client_admin, staff roles)
- **FR-010**: System MUST maintain the selected client context across pagination when viewing work orders, and MUST reset to page 1 and recalculate total pages whenever the client filter changes
- **FR-011**: System MUST include an "All Clients" option in the client filter allowing admins to view work orders across all clients, and MUST set this as the default selection when the jobs page first loads
- **FR-012**: System MUST fetch the list of clients from the backend when the jobs page loads for admin users
- **FR-013**: System MUST display an empty state message "No work orders found for [Client Name]" when the selected client filter yields zero results

### Key Entities

- **Client**: Represents an organization in the system with attributes like name, code, and status. Work orders are associated with clients via client_id foreign key.
- **Work Order**: Represents a job with fields including job_no, status, property details, authorized_email, and client_id. The client_id determines which client owns the work order.
- **User**: Represents system users with roles (client, client_admin, staff, admin). Admin users have permission to view work orders across all clients.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin users can successfully filter work orders by client within 3 clicks (view jobs page, open dropdown, select client)
- **SC-002**: The jobs list updates within 2 seconds of selecting a client filter
- **SC-003**: Admin users can successfully combine client and authorized person filters to narrow down work orders, with results displayed accurately
- **SC-004**: Non-admin users do not see the client filter, maintaining role-based access control
- **SC-005**: The client filter persists during the session when navigating between pages or using pagination
