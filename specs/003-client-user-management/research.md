# Research & Technical Decisions: Client User Management

**Feature**: 003-client-user-management
**Phase**: 0 (Outline & Research)
**Date**: 2025-10-19

## Research Questions & Decisions

### Q1: Password Generation Strategy for New Users

**Context**: When client admins create new users, the system must generate secure initial passwords and deliver them safely.

**Decision**: Use crypto.randomBytes() for secure password generation + bcrypt hashing + email delivery via nodemailer

**Rationale**:
- Node.js built-in `crypto` module provides cryptographically secure random generation
- Standard pattern: Generate random 12-character password with mixed case, numbers, symbols
- Existing bcrypt infrastructure in User model for password hashing (work factor already configured)
- Existing nodemailer service for email delivery (asynchronous, non-blocking per constitution)
- Users can change password on first login (existing auth flow supports this pattern)

**Alternatives Considered**:
1. **User-chosen passwords during creation**: Rejected - increases admin burden, security risk if admins use weak/reused passwords
2. **Magic link authentication (passwordless)**: Rejected - breaks existing authentication flow, requires significant refactoring
3. **OAuth/SSO integration**: Rejected - over-engineering for current requirements, not all clients may have SSO providers

**Implementation Notes**:
- Create `/backend/utils/passwordGenerator.js` with `generateSecurePassword()` function
- Password format: 12 characters, uppercase, lowercase, numbers, 2+ special characters
- Email template will include temporary password + instructions to change on first login
- Password must be hashed before storage (never store plaintext)

---

### Q2: Role Management Scope and Available Roles

**Context**: Feature spec mentions updating user roles, but we need to determine which roles are available for client admins to assign.

**Decision**: Client admins can assign only 'client' and 'client_admin' roles within their organization

**Rationale**:
- Existing User model has role enum: `'client', 'client_admin', 'staff', 'admin'`
- Security principle: Client admins should not create 'staff' or 'admin' roles (system-wide privileges)
- Multi-tenant isolation: Client organizations manage their own team with client-level roles
- 'client_admin' can create other 'client_admin' users (allows delegation of admin responsibilities)
- 'client' role is for standard users without user management privileges

**Alternatives Considered**:
1. **Allow any role assignment**: Rejected - security violation, client admins could elevate privileges to system admin
2. **Only 'client' role allowed**: Rejected - prevents delegation of admin responsibilities within organization
3. **Custom role creation**: Rejected - out of scope per spec boundaries, existing RBAC system sufficient

**Implementation Notes**:
- Backend validation: Reject requests to create/update users with 'staff' or 'admin' roles
- Frontend UI: Role dropdown shows only 'Client User' and 'Client Admin' options
- Error message if invalid role submitted: "You can only assign Client User or Client Admin roles"

---

### Q3: Email Notification Content and Delivery Pattern

**Context**: FR-010 requires sending notifications to newly created users with login credentials.

**Decision**: Send HTML email asynchronously with credentials, system URL, and first-login instructions

**Rationale**:
- Existing nodemailer service in `/backend/utils/emailService.js` provides email infrastructure
- Constitution email standards: Asynchronous, non-blocking, failure-tolerant
- User creation should succeed even if email fails (log error, don't block operation)
- Email should include: temporary password, login URL, instructions to change password, support contact

**Alternatives Considered**:
1. **SMS notifications**: Rejected - requires additional service integration (Twilio, etc.), phone numbers are optional
2. **In-app notifications only**: Rejected - users don't have access yet, need out-of-band communication
3. **Blocking email delivery**: Rejected - violates constitution (email must be non-blocking)

**Implementation Notes**:
- Extend `/backend/utils/emailService.js` with `sendNewUserCredentialsEmail(user, temporaryPassword)` function
- HTML template: Professional styling, clear call-to-action, mobile-responsive
- Environment variables: Reuse existing EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
- Error handling: Catch email failures, log error with user ID (not password), continue user creation
- Email subject: "Welcome to NextGen WOM - Your Account Credentials"

---

### Q4: User List Pagination and Performance

**Context**: Success criteria requires supporting up to 500 users per organization with <500ms rendering time.

**Decision**: Implement server-side pagination with default page size of 50, client-side search/filter

**Rationale**:
- 500 users is manageable but benefits from pagination for better UX and performance
- Server-side pagination reduces data transfer and frontend rendering overhead
- Page size of 50 provides good balance (10 pages max for 500 users)
- Client-side search/filter on current page for responsive UX (no server roundtrip)
- Sequelize supports pagination via `limit` and `offset` parameters

**Alternatives Considered**:
1. **Load all users at once**: Rejected - poor performance at scale, unnecessary data transfer
2. **Infinite scroll**: Rejected - harder to navigate, less intuitive for admin use case (need direct access to specific users)
3. **Virtual scrolling**: Rejected - over-engineering, adds complexity for limited benefit at this scale

**Implementation Notes**:
- API endpoint: `GET /api/users?page=1&limit=50`
- Response format: `{ users: [...], total: 500, page: 1, totalPages: 10 }`
- Frontend: Use React state for page number, simple pagination controls (prev/next, page numbers)
- Search: Client-side filtering on name/email fields within current page
- Default sort: Alphabetical by full_name (ascending)

---

### Q5: Duplicate Email Validation Approach

**Context**: FR-004 requires preventing duplicate emails within the same client organization.

**Decision**: Database-level unique constraint on (email, client_id) + API validation layer

**Rationale**:
- Database constraint provides strongest guarantee (prevents race conditions)
- Sequelize validation provides user-friendly error messages before hitting database
- Multi-tenant consideration: Email must be unique within organization, but can exist across different clients
- Existing User model has email field, can add compound unique constraint

**Alternatives Considered**:
1. **Global email uniqueness**: Rejected - too restrictive for multi-tenant system (different organizations may have users with same email)
2. **API-only validation**: Rejected - doesn't prevent race conditions, weaker guarantee
3. **Case-sensitive validation**: Rejected - emails should be case-insensitive (user@example.com == USER@EXAMPLE.COM)

**Implementation Notes**:
- Add migration to create compound unique index: `CREATE UNIQUE INDEX user_email_client_idx ON users (LOWER(email), client_id)`
- Sequelize model validation: Check for existing user with same email and client_id before creation
- API error response: `{ error: "A user with this email already exists in your organization" }`
- Frontend: Display error message inline on email field

---

### Q6: Mobile-First UI Pattern for User Management

**Context**: Constitution Principle I requires mobile-first design with touch-friendly controls.

**Decision**: Responsive card layout for mobile, table layout for desktop, bottom sheet modals for forms

**Rationale**:
- Card layout works better on narrow screens (320px-414px) than tables
- Each user card displays: name, email, role badge, action buttons (edit, view details)
- Desktop: Switch to table layout at 768px breakpoint for efficient space usage
- Bottom sheet modals (slide up from bottom) are mobile-native pattern for forms
- Touch targets: 44x44px minimum for all buttons and interactive elements
- Tailwind CSS provides responsive utilities for breakpoint-based layouts

**Alternatives Considered**:
1. **Table-only layout**: Rejected - poor UX on mobile, horizontal scrolling required
2. **Modal-only (no bottom sheet)**: Rejected - centered modals less ergonomic on mobile
3. **Separate mobile/desktop pages**: Rejected - unnecessary complexity, responsive design sufficient

**Implementation Notes**:
- Mobile (<768px): Vertical card stack with stacked form fields, full-width buttons
- Desktop (≥768px): Table with sortable columns, centered modal dialogs
- Form design: Single-column layout, large input fields (min-height: 44px)
- Action buttons: Icon + label on desktop, icon-only on mobile (with tooltips)
- Navigation: Add "Users" menu item in existing mobile nav drawer

---

### Q7: Phone Number Validation Standard

**Context**: FR-012 requires phone number validation when provided (optional field).

**Decision**: Use libphonenumber-js for international phone validation with E.164 format storage

**Rationale**:
- System is used in New Zealand but may expand internationally
- libphonenumber-js provides robust international phone validation
- E.164 format (e.g., +64211234567) is international standard for storage
- Library handles country codes, regional formats, validation
- Lightweight alternative to Google's full libphonenumber library

**Alternatives Considered**:
1. **Regex-only validation**: Rejected - too complex for international support, error-prone
2. **No validation**: Rejected - violates FR-012, risks bad data entry
3. **Country-specific validation (NZ only)**: Rejected - limits future expansion

**Implementation Notes**:
- Backend: Add libphonenumber-js dependency, validate in user controller before save
- Frontend: Format phone input as user types (mask pattern), show validation errors
- Storage format: E.164 (+64...), display format: National (02 1234 5678) or International
- Validation: Allow empty/null (optional field), reject if provided and invalid
- Default country: NZ (+64) for convenience in UI

---

## Best Practices Applied

### Security Best Practices
1. **Password Hashing**: bcrypt with work factor 10 (existing User model standard)
2. **JWT Token Validation**: Reuse existing auth.middleware.js (verifyToken, isClientAdmin)
3. **Multi-tenant Isolation**: Reuse existing clientScoping.js middleware (addClientScope)
4. **Input Validation**: Sanitize all inputs, validate email/phone formats, check role constraints
5. **Rate Limiting**: Leverage existing rate limiting middleware on auth routes (apply to user creation)

### API Design Best Practices
1. **RESTful Endpoints**: Follow REST conventions (GET, POST, PUT/PATCH)
2. **Consistent Error Responses**: `{ error: "message", details: {...} }` format
3. **Pagination Standards**: Standard query params (page, limit), consistent response structure
4. **Versioning**: Use `/api/users` path (no version in URL, handled via headers if needed later)
5. **CORS Configuration**: Reuse existing CORS settings (already configured for frontend origin)

### Frontend Best Practices
1. **Component Composition**: Separate concerns (UserList, CreateUserForm, EditUserModal)
2. **State Management**: Use React hooks (useState, useEffect, useContext for auth)
3. **Error Handling**: Display user-friendly error messages, loading states, success confirmations
4. **Form Validation**: Client-side validation before submission (instant feedback)
5. **Accessibility**: ARIA labels, keyboard navigation, focus management in modals

### Performance Best Practices
1. **Pagination**: Reduce data transfer and rendering overhead
2. **Lazy Loading**: Load UserManagementPage only when route accessed (React.lazy + Suspense)
3. **Debouncing**: Debounce search input to reduce re-renders
4. **Memoization**: Use React.memo for UserList items to prevent unnecessary re-renders
5. **Database Indexing**: Leverage existing indexes on email, client_id fields

---

## Technology Integration Patterns

### Backend Integration
- **Express Routes**: Register in server.js as `app.use('/api/users', userRoutes)`
- **Middleware Stack**: `verifyToken → isClientAdmin → addClientScope → route handler`
- **Error Handling**: Use existing error middleware for consistent error responses
- **Database Queries**: Sequelize ORM with eager loading for client associations

### Frontend Integration
- **Routing**: Add protected route in App.jsx: `<ProtectedRoute path="/users" element={<UserManagementPage />} />`
- **API Service**: Create userService.js following pattern of existing authService.js
- **Navigation**: Add menu item in existing nav component (mobile drawer, desktop sidebar)
- **Authorization**: Check user.role === 'client_admin' in UserManagementPage, redirect if unauthorized

### Email Integration
- **Service Extension**: Add new function to existing emailService.js
- **Environment Variables**: Reuse EMAIL_* variables from .env file
- **Error Handling**: Wrap in try-catch, log errors, don't throw (non-blocking)
- **Testing**: Use existing verifyEmailConfig() function for connection testing

---

## Risk Mitigation

### Risk 1: Email Delivery Failures
**Mitigation**: User creation succeeds regardless of email status, log failures for manual follow-up, provide UI to resend credentials

### Risk 2: Role Privilege Escalation
**Mitigation**: Server-side validation of allowed roles, reject any attempts to assign 'staff' or 'admin' roles

### Risk 3: Cross-Organization Access
**Mitigation**: Enforce client_id filtering in all queries, use existing clientScoping middleware, validate in controller layer

### Risk 4: Duplicate Emails Across Tenants
**Mitigation**: Database compound unique constraint on (email, client_id), clear error messaging

### Risk 5: Mobile UX Degradation
**Mitigation**: Follow constitution mobile-first requirements, test on actual devices (iOS Safari, Android Chrome)

---

## Summary

All technical unknowns resolved. Implementation approach is clear:
- Reuse existing User/Client models (no database changes)
- Extend existing authentication/authorization infrastructure
- Add new backend routes/controllers with proper security middleware
- Build mobile-first frontend UI with responsive design
- Follow constitutional principles and technical standards throughout

Ready to proceed to Phase 1: Design & Contracts.
