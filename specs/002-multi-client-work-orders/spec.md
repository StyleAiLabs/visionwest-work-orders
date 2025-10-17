# Feature Specification: Multi-Client Work Order Management

**Feature Branch**: `002-multi-client-work-orders`
**Created**: 2025-10-17
**Status**: Draft
**Input**: Multi-Client Work Order Management - extend platform to support multiple independent organizations with isolated users, data, and workflows

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Data Isolation (Priority: P1)

As a client user (client or client_admin role), I need to access only work orders and data belonging to my organization so that sensitive information remains secure and I can focus on my organization's operations without seeing irrelevant data from other clients.

**Why this priority**: Data isolation is the foundational requirement for multi-tenancy. Without this, the system cannot support multiple clients securely. This is the MVP that enables onboarding the first additional client beyond Visionwest.

**Independent Test**: Can be fully tested by creating two test client organizations, assigning users to each, creating work orders for each client, and verifying that users from Client A cannot access work orders or data from Client B through the UI or API. This delivers immediate value by preventing data leakage.

**Acceptance Scenarios**:

1. **Given** I am logged in as a client_admin for Organization A, **When** I view the work order list, **Then** I see only work orders belonging to Organization A
2. **Given** I am logged in as a client user for Organization B, **When** I attempt to access a work order URL for Organization A, **Then** I receive an access denied error and cannot view the work order
3. **Given** I am a client_admin for Organization A, **When** I create a new work order, **Then** the work order is automatically associated with Organization A
4. **Given** I am a client user for Organization A, **When** I receive notifications, **Then** I only receive notifications for work orders belonging to Organization A

---

### User Story 2 - Global Admin Client Management (Priority: P1)

As a global admin (admin role), I need to manage multiple client organizations, switch between their contexts, and view their data so that I can provide support, troubleshoot issues, and oversee the entire multi-tenant platform.

**Why this priority**: Global administration is essential for the operational success of a multi-tenant platform. Support staff need the ability to assist clients without requiring separate accounts. This is part of the P1 MVP because it enables platform management.

**Independent Test**: Can be fully tested by logging in as a global admin, creating new client organizations through an admin interface, switching between different client contexts, and verifying that work orders and data are correctly scoped to each selected client. This delivers value by enabling centralized platform management.

**Acceptance Scenarios**:

1. **Given** I am a global admin, **When** I access the admin panel, **Then** I can view a list of all client organizations
2. **Given** I am a global admin viewing the client list, **When** I select a specific client, **Then** the system switches context to that client and displays their work orders and data
3. **Given** I am a global admin, **When** I create a new client organization with required details (name, contact information), **Then** the client is created and ready to have users assigned
4. **Given** I am a global admin viewing Client A's data, **When** I switch to Client B, **Then** all dashboards, work orders, and filters update to show only Client B's data

---

### User Story 3 - Seamless Legacy Data Migration (Priority: P1)

As the platform owner, I need existing Visionwest users and work orders to be automatically migrated to the new multi-client structure without disruption so that current operations continue smoothly while enabling future client onboarding.

**Why this priority**: Migration must be seamless to avoid disrupting the existing Visionwest business. This is P1 because it's a prerequisite for deploying the multi-client feature to production. Without it, the feature cannot be safely released.

**Independent Test**: Can be fully tested by running the migration script on a staging database copy, verifying that all existing users are assigned to the Visionwest client organization, all existing work orders are linked to Visionwest, and all existing functionality (logins, work order access, notifications) continues to work identically to before the migration.

**Acceptance Scenarios**:

1. **Given** the migration script runs on existing production data, **When** the migration completes, **Then** a "Visionwest" client organization exists as the first client in the system
2. **Given** existing Visionwest users in the database, **When** the migration completes, **Then** all users have their client_id set to the Visionwest organization
3. **Given** existing work orders in the database, **When** the migration completes, **Then** all work orders have their client_id set to the Visionwest organization
4. **Given** an existing Visionwest user logs in after migration, **When** they access the work order list, **Then** they see the same work orders they saw before migration with no data loss
5. **Given** the migration is complete, **When** new users are created for Visionwest, **Then** they are automatically assigned to the Visionwest client organization

---

### User Story 4 - Staff Cross-Client Work Order Access (Priority: P2)

As a staff member, I need to update work order notes, photos, and status for any client's work orders so that I can support maintenance operations across all organizations served by the platform.

**Why this priority**: Staff members need cross-client access to perform their job, but this is P2 because the MVP can function with staff assigned to specific clients initially. The cross-client access pattern can be added after the basic multi-client structure is working.

**Independent Test**: Can be fully tested by creating staff users, assigning them work orders from multiple clients, and verifying they can view and update work orders across client boundaries while client users remain restricted to their own organization.

**Acceptance Scenarios**:

1. **Given** I am a staff user, **When** I view the work order list, **Then** I see work orders from all client organizations
2. **Given** I am a staff user viewing a work order for Client A, **When** I add a note or update status, **Then** the changes are saved and notifications are sent to relevant Client A users
3. **Given** I am a staff user, **When** I upload photos to a Client B work order, **Then** the photos are associated with the correct work order and client

---

### Edge Cases

- What happens when a user is not assigned to any client organization? The system must block access and display a clear error message requesting the user contact an administrator.
- How does the system handle work orders created before migration (legacy data)? All legacy work orders must be automatically assigned to the Visionwest client during migration.
- What happens if a global admin deletes a client organization that has active users and work orders? The system should prevent deletion and require reassignment or archival of users/work orders first, or use a soft-delete with SET NULL foreign key behavior.
- How does the system handle concurrent global admin operations (e.g., two admins switching between clients simultaneously)? Each admin session maintains its own client context independently.
- What happens when a staff user receives a notification for a work order from a different client? The notification should include the client name to provide context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST isolate all work order data by client organization, ensuring users can only access work orders belonging to their assigned client
- **FR-002**: System MUST store client organization information including name, unique code, status, and primary contact details
- **FR-003**: System MUST associate every user account with exactly one client organization after migration is complete
- **FR-004**: System MUST associate every work order with exactly one client organization
- **FR-005**: System MUST automatically scope all work order API endpoints (list, detail, create, update) to the authenticated user's client organization
- **FR-006**: System MUST automatically scope all work order notes, photos, and notifications to the client organization of the associated work order
- **FR-007**: Global admin users MUST be able to view and manage all client organizations
- **FR-008**: Global admin users MUST be able to switch context between different client organizations to view their data
- **FR-009**: System MUST prevent client users from accessing work orders belonging to other client organizations, even via direct URL access
- **FR-010**: System MUST prevent modification of work orders across client boundaries (client A user cannot modify client B work orders)
- **FR-011**: System MUST automatically assign the authenticated user's client organization to new work orders they create
- **FR-012**: System MUST include client organization identifier in authentication tokens to enable efficient scoping
- **FR-013**: System MUST support creation of new client organizations through an administrative interface
- **FR-014**: System MUST migrate all existing Visionwest users and work orders to a "Visionwest" client organization during initial deployment
- **FR-015**: System MUST maintain referential integrity between users/work orders and their client organizations
- **FR-016**: System MUST log client organization context in audit trails for troubleshooting and compliance
- **FR-017**: Staff users MUST be able to view and update work orders across all client organizations
- **FR-018**: System MUST display client organization context clearly to users to prevent confusion in multi-tenant scenarios

### Key Entities

- **Client Organization**: Represents an independent business entity using the platform. Contains organization name, unique code for identification, active/inactive status, primary contact information (name, email, phone), and timestamps for tracking. Each client has many users and many work orders.

- **User**: Existing entity extended with client organization relationship. Each user belongs to exactly one client organization (after migration). Relationship determines which work orders and data the user can access.

- **Work Order**: Existing entity extended with client organization relationship. Each work order belongs to exactly one client organization, representing which business entity owns or requested the maintenance work.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Client users can only access work orders belonging to their organization - 100% isolation verified through access control testing with zero cross-client data leaks
- **SC-002**: Global admins can successfully switch between client contexts and view appropriate data within 3 seconds per switch
- **SC-003**: Migration of existing Visionwest data completes without data loss - 100% of users and work orders successfully assigned to Visionwest client
- **SC-004**: New client organizations can be onboarded without code changes or deployment - administrative interface allows creation and configuration
- **SC-005**: System performance remains consistent with current levels - work order list loading time increases by less than 10% after adding client scoping
- **SC-006**: Platform successfully supports at least 10 concurrent client organizations with independent user bases and work order sets
- **SC-007**: Zero incidents of cross-client data access violations in production within first 90 days of deployment

### Assumptions

- The existing work order management system has a single hardcoded client (Visionwest) that will become the first client in the multi-tenant system
- Billing and payment processing for multiple clients will be handled outside this feature scope
- White-label theming (custom branding per client) is noted as a future capability but not required for MVP
- Client organizations will not self-sign up; onboarding will be managed by global administrators
- External identity provider integration (SAML, OAuth) is deferred to future iterations
- The current JWT authentication mechanism can be extended to include client organization context
- Database performance will remain acceptable with client-scoped queries using appropriate indexes
- The existing n8n email workflow integration will continue to work and will be associated with the Visionwest client organization
- Staff users are trusted to access work orders across all clients as part of their job function
- Client organization settings (custom configurations, integrations) will use a simple JSON storage approach initially rather than complex relational structure

###Dependencies

- Existing user authentication and authorization system (JWT, role-based access control)
- Existing work order data model and API endpoints
- Existing notification system that will need client-aware filtering
- Database migration capabilities for safely updating schema and backfilling data
- Admin user interface framework for creating client management screens

### Out of Scope

- Billing and invoicing for multiple client organizations
- External identity provider integration (SAML, SSO, OAuth)
- White-label theming and custom branding per client
- Client self-service signup and onboarding
- Multi-factor authentication specific to client organizations
- Client-specific SLA tracking and reporting
- Automated client provisioning workflows
- Data export and migration tools for client offboarding
