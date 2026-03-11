# Implementation Plan: Admin and Client Admin Password Reset

**Branch**: `007-admin-client-admin-password-reset` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-admin-client-admin-password-reset/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a user password reset capability to the admin user-management area that is available only to `admin` and `client_admin` roles. Reset will generate a secure temporary password, force password change on next login, and send a notification email to the target user. For resets initiated by `client_admin`, the email will include BCC notifications to active `admin` users for oversight.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18.x (backend), React 19 (frontend)  
**Primary Dependencies**: Express 4.x, Sequelize 6.x, bcryptjs, nodemailer, Brevo SDK, React Router, Tailwind CSS  
**Storage**: PostgreSQL via Sequelize (existing `users` table)  
**Testing**: Manual API/UI verification plus lint/build checks  
**Target Platform**: Web PWA (mobile-first and desktop browsers)
**Project Type**: Web application (backend API + frontend SPA)  
**Performance Goals**: Password reset API responds in <300ms p95 excluding async email delivery; email side effects remain non-blocking  
**Constraints**: Only `admin` and `client_admin`; strict client isolation for `client_admin`; preserve existing auth and login password-change flow  
**Scale/Scope**: Single new user endpoint, user-management UI action, email notification path update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Mobile-First Design**: Add reset action to existing responsive card/table layouts in `UserList`.
- [x] **Multi-Client Data Isolation**: `client_admin` reset queries scoped by `client_id`; `admin` respects existing context-switch behavior.
- [x] **Role-Based Access**: Endpoint protected by `verifyToken` + `isClientAdminOrAdmin` middleware.
- [x] **Brand Consistency**: Reuse existing Tailwind styling patterns and palette in user-management screens.
- [x] **Environment Parity**: No env-specific logic changes; uses existing email service abstraction.
- [ ] **Release Documentation**: Deferred until release packaging step.
- [x] **Integration Resilience**: Email notifications stay async/non-blocking with failure logging.

*If any checks fail, document in Complexity Tracking table below.*

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
backend/
├── controllers/
│   └── user.controller.js
├── routes/
│   └── user.routes.js
├── utils/
│   └── emailService.js
└── middleware/
  ├── auth.middleware.js
  └── clientScoping.js

frontend/
└── src/
  ├── pages/
  │   └── UserManagementPage.jsx
  ├── components/
  │   └── UserList.jsx
  └── services/
    └── userService.js
```

**Structure Decision**: Web application structure (backend + frontend) using existing user-management modules and service patterns.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Release Documentation deferred in implementation step | Feature coding can proceed safely before versioning | Blocking implementation on release docs slows delivery; release notes done as packaging task |

