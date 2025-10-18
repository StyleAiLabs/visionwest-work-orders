# Implementation Plan: Client User Management

**Branch**: `003-client-user-management` | **Date**: 2025-10-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-client-user-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable client admins to create new users within their organization, update user roles, and modify user contact details. This feature extends the existing multi-tenant user management system to provide self-service user administration capabilities for client organizations. Implementation will leverage the existing User and Client models with new API endpoints and a dedicated user management UI page accessible only to client_admin role users.

## Technical Context

**Language/Version**: Node.js 18.x (backend), React 19 (frontend)
**Primary Dependencies**:
- Backend: Express 4.x, Sequelize 6.x ORM, bcrypt (password hashing), jsonwebtoken (JWT auth), nodemailer (email notifications)
- Frontend: React 19, Vite 6.x, Tailwind CSS 3.x, React Router 7.x
**Storage**: PostgreSQL (existing User and Client models via Sequelize)
**Testing**: Manual testing on mobile devices (per constitution requirements), API endpoint testing via tools
**Target Platform**: Web application (mobile-first PWA) - iOS Safari, Android Chrome, desktop browsers
**Project Type**: Web application (separate backend API + frontend SPA)
**Performance Goals**:
- User list rendering: <500ms for up to 500 users per organization
- Form submission: <200ms API response time
- Email delivery: Asynchronous, non-blocking (5 minute SLA for credential emails)
**Constraints**:
- Mobile-first: All UI must be touch-friendly, responsive down to 320px width
- Multi-tenant isolation: Users can only manage users within their own client organization
- Role-based access: Only client_admin role can access user management features
- Backward compatibility: Must not affect n8n webhook integration or existing user authentication flows
**Scale/Scope**:
- Support up to 500 users per client organization
- Estimated 3-5 API endpoints (create user, list users, update role, update contact details, get user details)
- Single new frontend page (UserManagementPage) with create/edit modals or forms
- Reuse existing User and Client models (no new database tables required)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design - ✅ PASS
- All user management UI will be designed mobile-first with touch-friendly controls
- User list will use responsive cards/table optimized for small screens
- Create/edit forms will have large touch targets (44x44px minimum)
- Navigation to user management will be accessible from mobile menu
- Manual testing on actual mobile devices required before deployment

### Principle II: Progressive Enhancement & Offline Capability - ✅ PASS (Partial Requirement)
- User management requires network connectivity for creating/updating users (acceptable for admin function)
- User list viewing could leverage service worker caching for recently fetched data (optional enhancement)
- This feature does not degrade core offline work order viewing/creation capabilities
- **Rationale**: User management is an administrative function performed in office/connected environments, not a field operation requiring offline support

### Principle III: Integration Integrity - ✅ PASS
- No changes to existing authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`)
- No changes to n8n webhook endpoint (`POST /api/webhook/work-orders`)
- New endpoints will use separate routes (`/api/users/*`) with client scoping middleware
- Existing JWT authentication and role middleware will be reused without modification
- User creation via this feature uses same User model as existing registration flow (consistent data structure)

### Principle IV: User Story-Driven Development - ✅ PASS
- P1 (Create New User): Delivers MVP - admins can onboard team members
- P2 (Update User Role): Enhances security/access control management
- P3 (Update Contact Details): Adds convenience for maintaining team directory
- Each story independently testable and deployable
- Plan to implement P1 fully before considering P2/P3

### Principle V: Security & Data Protection - ✅ PASS
- JWT authentication required for all user management endpoints
- `admin` (SuperAdmin of this App) role can access user management feature for all the client organisations.
- Role-based access control: Only `client_admin` role can access user management features
- Multi-tenant isolation: Admins can only create/update users within their own client organization (enforced via `client_id` FK and client scoping middleware)
- Password generation: Initial passwords will be securely generated and hashed with bcrypt before storage
- Email credentials: Sent via nodemailer with environment-configured SMTP (no credentials in logs)
- Input validation: Email format, phone format, duplicate email checks enforced at API and database level
- No SQL injection risk: Sequelize ORM with parameterized queries

### Technical Standards - ✅ PASS
- **Technology Stack**: Using required stack (Node.js 18.x, Express, PostgreSQL, Sequelize, React 19, Vite, Tailwind CSS)
- **Email Notification Standards**: Following constitution pattern - asynchronous, non-blocking, failure-tolerant
- **Project Structure**: Following web application structure (backend/ and frontend/ directories)
- **Version Synchronization**: Will update both frontend and backend package.json versions
- **Performance Standards**: API response times <200ms (well within <500ms requirement)

### Development Workflow - ✅ PASS
- Following P1 MVP validation pattern: Backend → Frontend → Manual Testing → Integration Testing
- Will test on actual mobile devices before considering P1 complete
- Specification created in `/specs/003-client-user-management/spec.md`
- Implementation plan in `/specs/003-client-user-management/plan.md`
- Tasks will be grouped by user story priority
- Manual testing required for mobile responsiveness, authentication flows, role restrictions

### Version Management - ✅ PASS
- Will update Settings page version display before merging to main
- Will add release notes documenting new user management feature
- Will synchronize frontend/backend package.json versions
- Minor version bump appropriate (new feature, non-breaking): 2.6.0 → 2.7.0

### Final Gate Assessment: **ALL GATES PASSED** ✅
No constitutional violations. Feature aligns with all core principles and technical standards.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── models/
│   ├── user.model.js           # EXISTING - will reuse (has client_id FK, role enum, phone_number)
│   ├── client.model.js         # EXISTING - will reuse (has user associations)
│   └── index.js                # EXISTING - model associations defined here
├── routes/
│   ├── auth.routes.js          # EXISTING - no changes needed
│   └── user.routes.js          # NEW - user management endpoints
├── controllers/
│   ├── auth.controller.js      # EXISTING - no changes needed
│   └── user.controller.js      # NEW - user management logic
├── middleware/
│   ├── auth.middleware.js      # EXISTING - will reuse isClientAdmin()
│   └── clientScoping.js        # EXISTING - will reuse for multi-tenant isolation
├── utils/
│   ├── emailService.js         # EXISTING - will extend for credential emails
│   └── passwordGenerator.js    # NEW - generate secure initial passwords
└── server.js                   # EXISTING - will register new user.routes

frontend/
├── src/
│   ├── pages/
│   │   └── UserManagementPage.jsx   # NEW - main user management UI
│   ├── components/
│   │   ├── UserList.jsx             # NEW - display users table/cards
│   │   ├── CreateUserForm.jsx       # NEW - form for creating new users
│   │   ├── EditUserModal.jsx        # NEW - modal for editing user details
│   │   └── UserRoleSelect.jsx       # NEW - role selection dropdown
│   ├── services/
│   │   └── userService.js           # NEW - API calls for user management
│   ├── context/
│   │   └── AuthContext.jsx          # EXISTING - no changes needed
│   └── App.jsx                      # EXISTING - will add new route for user management
└── public/
    └── manifest.json                # EXISTING - no changes needed
```

**Structure Decision**: Web application structure (Option 2). The project uses a clean separation between backend (Express API) and frontend (React SPA). This feature will add new backend routes/controllers and a new frontend page with supporting components, all following the established project structure. No changes to database models required - existing User and Client models already support all needed fields (client_id, role, phone_number, etc.).

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations. This section is not applicable.

