# Feature Specification: Client User Management

**Feature Branch**: `003-client-user-management`
**Created**: 2025-10-19
**Status**: Draft
**Input**: User description: "admin should able to create new users for the client organisation and update their role and contact details. do not over engineer this keep it simple and solid."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Client User (Priority: P1)

As a client admin, I need to create new user accounts for my organization so that team members can access the work order management system.

**Why this priority**: This is the foundational capability - without the ability to create users, no other user management functions are possible. This delivers immediate value by enabling client admins to onboard their team members.

**Independent Test**: Can be fully tested by logging in as a client admin, clicking "Add User", filling in basic user details (name, email, role), and verifying the new user can log in.

**Acceptance Scenarios**:

1. **Given** I am logged in as a client admin, **When** I navigate to the user management section and click "Add User", **Then** I see a form to enter user details (name, email, role, contact information)
2. **Given** I have filled in all required user details, **When** I submit the form, **Then** the new user is created and appears in the user list
3. **Given** a new user has been created, **When** that user receives their welcome email, **Then** the email follows NextGen WOM brand guidelines (Deep Navy header, NextGen Green CTA button, Rich Black text on Pure White background)
4. **Given** a new user has been created, **When** that user attempts to log in with their temporary credentials, **Then** they can successfully access the system with their assigned role permissions
5. **Given** a new user logs in for the first time, **When** they enter their temporary password, **Then** they are immediately prompted to change their password before accessing the system
6. **Given** I am creating a new user, **When** I enter an email address that already exists in my organization, **Then** I see an error message indicating the user already exists

---

### User Story 2 - Update User Role (Priority: P2)

As a client admin, I need to update a user's role so that I can adjust their permissions as their responsibilities change within the organization.

**Why this priority**: Role management is critical for security and access control, but only becomes relevant after users exist in the system. This enables admins to maintain appropriate access levels as team structures evolve.

**Independent Test**: Can be fully tested by selecting an existing user, changing their role from one value to another (e.g., "User" to "Manager"), and verifying their permissions reflect the new role.

**Acceptance Scenarios**:

1. **Given** I am viewing the user list, **When** I select a user and click "Edit Role", **Then** I see a list of available roles for my organization
2. **Given** I have selected a new role for a user, **When** I save the change, **Then** the user's role is updated and they immediately have the permissions associated with the new role
3. **Given** a user's role has been changed, **When** that user next logs in, **Then** they see the interface and features appropriate to their new role

---

### User Story 3 - Update User Contact Details (Priority: P3)

As a client admin, I need to update user contact information so that I can keep our team directory current and ensure communication reaches the right people.

**Why this priority**: Contact information updates are important for communication but don't impact system access or security. This can be added after core user creation and role management are working.

**Independent Test**: Can be fully tested by selecting a user, updating their contact details (phone, email, name), and verifying the changes are saved and displayed correctly.

**Acceptance Scenarios**:

1. **Given** I am viewing a user's profile, **When** I click "Edit Contact Details", **Then** I see a form with the user's current name, email, and phone number
2. **Given** I have updated any contact details, **When** I save the changes, **Then** the user's information is updated and the new details are displayed in the user list
3. **Given** I am updating a user's email, **When** I enter an email that is already used by another user in my organization, **Then** I see an error message and the change is not saved

---

### Edge Cases

- What happens when an admin tries to delete their own account or change their own role?
- How does the system handle users with the same name but different email addresses?
- What happens when an admin tries to create a user while offline or with a network interruption?
- How does the system prevent unauthorized users from accessing the user management interface?
- What happens when updating a user who is currently logged in - are their permissions updated immediately?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow client admins to create new user accounts for their organization
- **FR-002**: System MUST require at minimum a name, email address, and role when creating a new user
- **FR-003**: System MUST validate that email addresses are in a valid format before accepting them
- **FR-004**: System MUST prevent duplicate email addresses within the same client organization
- **FR-005**: System MUST allow client admins to update an existing user's role
- **FR-006**: System MUST allow client admins to update an existing user's contact details (name, email, phone)
- **FR-007**: System MUST restrict user management functions to client admin users only
- **FR-008**: System MUST persist all user changes immediately
- **FR-009**: System MUST display all users belonging to the admin's client organization
- **FR-010**: System MUST send a notification to newly created users with their login credentials
- **FR-011**: System MUST prevent admins from managing users outside their own client organization
- **FR-012**: System MUST validate phone numbers are in a valid format when provided
- **FR-013**: System MUST force users to change their temporary password on first login before accessing any features
- **FR-014**: System MUST send welcome emails that follow NextGen WOM brand guidelines (Deep Navy #0e2640 header, NextGen Green #8bc63b CTA button, Rich Black #010308 text on Pure White #ffffff background)
- **FR-015**: System MUST track whether a user has changed their initial temporary password
- **FR-016**: System MUST prevent users with unchanged temporary passwords from accessing the application until password is changed

### Key Entities

- **User**: Represents an individual who can access the system, with attributes including full name, email address (unique within organization), phone number (optional), assigned role, password (hashed), password_changed flag (boolean to track if temporary password has been changed), and association to a client organization
- **Client Organization**: Represents a company or entity using the system, containing multiple users with one or more designated as admins
- **Role**: Represents a set of permissions and access levels within the system, assigned to users to control what they can view and do

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Client admins can create a new user account in under 1 minute from form open to user creation confirmation
- **SC-002**: Client admins can update a user's role or contact details in under 30 seconds
- **SC-003**: 100% of user management operations are restricted to client admin users only
- **SC-004**: All user changes persist correctly with zero data loss incidents
- **SC-005**: New users receive their credentials within 5 minutes of account creation
- **SC-006**: User management interface handles up to 500 users per client organization without performance degradation
- **SC-007**: 100% of new users are forced to change their temporary password on first login before accessing any features
- **SC-008**: 100% of welcome emails follow NextGen WOM brand guidelines with correct color scheme

## Assumptions

- Users will receive initial temporary passwords via email and MUST change them on first login before accessing the system (enforced by password_changed flag)
- Welcome emails will be sent via Brevo Email Service (with nodemailer as fallback) and will follow NextGen WOM brand guidelines as defined in `.specify/memory/brand-kit-guidelines.md` (Deep Navy header, NextGen Green CTA, Rich Black text on Pure White background)
- Email delivery failures will NOT block user creation (email sending is asynchronous and non-blocking as per constitution)
- Client organizations will have predefined roles available (e.g., Admin, Manager, User) based on existing system configuration
- Only client admin users can access user management functions; standard security middleware will enforce this
- Phone numbers are optional but validated when provided
- User updates take effect immediately without requiring the user to log out and back in
- Email is the primary identifier and login credential for users
- Password change flow will be implemented as a separate page/modal that users are redirected to on first login

## Dependencies

- Existing authentication and authorization system to enforce admin-only access
- Brevo Email Service for sending credentials to newly created users (must support HTML emails with brand styling, with nodemailer as fallback)
- NextGen WOM brand guidelines (`.specify/memory/brand-kit-guidelines.md`) for email template design
- Existing client organization data model and associations
- Existing role and permission system that defines what each role can do
- Database migration to add `password_changed` boolean field to Users table (defaults to false)

## Scope Boundaries

### In Scope
- Creating new users for the admin's own client organization
- Generating secure temporary passwords for new users
- Sending branded welcome emails with login credentials
- Forcing password change on first login
- Tracking password change status (password_changed flag)
- Updating roles for existing users within the admin's organization
- Updating contact details for existing users within the admin's organization
- Viewing the list of users in the admin's organization
- Basic validation of email and phone formats
- Brand-compliant email templates following NextGen WOM guidelines

### Out of Scope
- Deleting or deactivating users (not mentioned in requirements)
- Bulk user import or creation (keeping it simple)
- Password reset functionality for existing users (assumes existing system handles this)
- Password strength requirements beyond basic validation (may be added in future)
- Detailed audit logs of user changes (not mentioned in requirements)
- User profile pictures or additional profile fields
- Cross-organization user transfers or sharing
- Custom role creation or permission assignment (assumes predefined roles)
- Password expiration or rotation policies (not mentioned in requirements)
