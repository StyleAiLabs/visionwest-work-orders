<!--
Sync Impact Report - Constitution v1.0.1
========================================
Version Change: 1.0.0 → 1.0.1
Rationale: Patch update with clarifications based on successful P1 MVP implementation (manual work order entry feature completed 2025-10-17)

Change Type: PATCH - Clarifications and refinements based on implementation learnings

Modified Principles:
  - Principle III (Integration Integrity): Clarified webhook endpoint path correction
  - Principle V (Security & Data Protection): Added email notification security guidance

Added Sections:
  - Technical Standards → Email Notification Standards (new subsection)
  - Development Workflow → P1 MVP Validation Pattern (new guideline based on successful implementation)

Removed Sections: None

Templates Requiring Updates:
  ✅ plan-template.md - No changes required, constitution check section remains valid
  ✅ spec-template.md - No changes required, user story prioritization guidance remains valid
  ✅ tasks-template.md - No changes required, P1/P2/P3 task organization remains valid
  ✅ checklist-template.md - No changes required, mobile-first validation items still applicable
  ✅ agent-file-template.md - No changes required, auto-generated content

Implementation Learnings Incorporated:
  1. Email notification pattern established: Asynchronous, non-blocking, failure-tolerant
  2. P1 MVP pattern validated: Backend → Frontend → Manual Testing → Integration Testing
  3. Webhook endpoint path corrected: /api/webhook/work-orders (not /api/work-orders/webhook)

Follow-up TODOs:
  1. Continue manual testing of P1 MVP (T046-T052) per tasks.md
  2. Integration testing pending (T088-T096)
  3. P2 (Edit Work Order) and P3 (Autocomplete) remain in backlog
  4. Consider documenting email notification service pattern in integration docs

No breaking changes to existing templates or workflows.
Constitution remains fully compatible with all existing features and ongoing development.
-->

# NextGen WOM - Work Order Management System Constitution

## Brand Guidelines Reference
For comprehensive brand identity, color palette, typography, and component design standards, refer to:
📖 **[Brand Kit Guidelines](./brand-kit-guidelines.md)** - Complete visual identity and design system documentation

## Core Principles

### I. Mobile-First Design (NON-NEGOTIABLE)

Every feature MUST prioritize mobile user experience as the primary interface. All UI components, workflows, and interactions MUST be fully functional on smartphone screens before desktop optimization. Touch targets MUST meet minimum size requirements (44x44px), and navigation MUST be thumb-friendly for one-handed operation.

**Rationale**: Field technicians and maintenance staff primarily access the system on mobile devices while on-site. A desktop-first approach would render the system unusable for its primary user base.

**Testing Requirements**:
- All features MUST be tested on actual mobile devices (not just browser emulation)
- Responsive breakpoints MUST be validated at 320px, 375px, 390px, and 414px widths
- Touch interactions MUST be verified (tap, swipe, long-press where applicable)

### II. Progressive Enhancement & Offline Capability

The application MUST function as a Progressive Web App (PWA) with installable capabilities, offline functionality for core features, and graceful degradation when network connectivity is limited. Service workers MUST cache critical assets and data for offline access.

**Rationale**: Maintenance work often occurs in areas with poor or no connectivity (basements, remote properties, etc.). Users must be able to view work orders, add notes, and capture photos offline with automatic sync when connectivity returns.

**Implementation Requirements**:
- Service worker MUST cache app shell, critical routes, and recent work orders
- Offline status MUST be clearly communicated to users
- Data modifications offline MUST be queued and synced automatically
- Conflict resolution strategy MUST be documented for offline changes

### III. Integration Integrity

All changes to the API contract MUST maintain backward compatibility with the existing n8n workflow integration. Breaking changes to webhook endpoints, data structures, or authentication mechanisms require explicit migration plans and stakeholder approval before implementation.

**Rationale**: The n8n workflow is a critical automation pipeline that processes incoming work orders from email, extracts data from PDFs using AI, and creates work orders via webhook. Breaking this integration would halt incoming work order creation.

**Protected Endpoints**:
- Work order creation webhook: `POST /api/webhook/work-orders`
- Work order status update endpoints used by n8n
- Authentication endpoints used by n8n automation

**Change Process**:
- API contract changes MUST be documented in `/specs/[feature]/contracts/`
- Backward compatibility MUST be maintained or explicit versioning introduced
- n8n workflow maintainer MUST approve breaking changes
- New endpoints (like manual work order creation) MUST NOT conflict with or alter webhook behavior

### IV. User Story-Driven Development

All feature development MUST begin with prioritized user stories (P1, P2, P3...) where each story represents an independently testable, deployable increment of value. Implementation MUST proceed in priority order, with P1 stories delivering MVP functionality.

**Rationale**: This enables incremental delivery, reduces risk, allows early user feedback, and ensures the most critical functionality is built first. Each story should be demonstrable to stakeholders independently.

**Requirements**:
- Every feature specification MUST include at least one user story
- Each user story MUST have clear acceptance criteria in Given/When/Then format
- Tasks MUST be grouped by user story to enable independent implementation
- P1 stories collectively MUST form a functional MVP
- P2 and P3 stories MAY be deferred to backlog after P1 MVP completion

### V. Security & Data Protection

The system MUST implement JWT-based authentication, role-based access control (RBAC), and secure handling of all work order data including photos. Sensitive data MUST NOT be logged. File uploads MUST be validated and sanitized. All API endpoints MUST enforce authentication and authorization.

**Rationale**: Work orders contain sensitive property information, tenant details, and contractor data. Unauthorized access could lead to privacy violations, data breaches, or system misuse.

**Security Standards**:
- JWT tokens MUST expire and require refresh
- Password storage MUST use bcrypt with appropriate work factor
- Photos MUST be stored in cloud storage with access controls (currently AWS S3)
- SQL injection prevention MUST be enforced via Sequelize ORM parameterization
- CORS MUST be properly configured to allow only authorized origins
- Email notifications MUST NOT expose sensitive credentials in logs or error messages

## Technical Standards

### Technology Stack

**Frontend** (Non-negotiable):
- React 19+ with Vite build system
- Tailwind CSS for responsive styling
- React Router for client-side routing
- PWA support via vite-plugin-pwa

**Backend** (Non-negotiable):
- Node.js 18.x with Express framework
- PostgreSQL for relational data storage
- Sequelize ORM for database access
- JWT for authentication
- AWS SDK for file storage

**Deployment**:
- Frontend: Netlify (static hosting with CDN)
- Backend: Render (containerized Node.js service)
- Database: PostgreSQL managed service

### Email Notification Standards

Email notifications (when required by features) MUST follow these patterns:

**Implementation Pattern**:
- Email sending MUST be asynchronous and non-blocking
- Email failures MUST NOT prevent primary operation completion (e.g., work order creation)
- Email configuration MUST use environment variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD)
- Recipient addresses MUST be configurable via environment variables
- Email service library: nodemailer (current standard)

**Error Handling**:
- Email failures MUST be logged with appropriate detail level
- Sensitive credentials MUST NOT appear in logs
- Primary operation success MUST NOT depend on email delivery success

### Project Structure

The project follows a **web application structure** with separate frontend and backend:

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level components
│   ├── context/        # React Context providers
│   └── services/       # API client utilities
└── public/             # Static assets, PWA manifest

backend/
├── server.js           # Express app entry point
├── config/             # Database, auth configuration
├── models/             # Sequelize models
├── routes/             # Express route handlers
├── middleware/         # Auth, error handling
├── utils/              # Shared utilities
└── scripts/            # Migration and setup scripts
```

### Version Synchronization

Frontend and backend versions MUST remain synchronized. Both package.json files MUST reflect the same version number. Version increments follow semantic versioning (MAJOR.MINOR.PATCH).

### Performance Standards

- Initial page load MUST complete in under 3 seconds on 3G connection
- Time to Interactive (TTI) MUST be under 5 seconds on mobile
- Image uploads MUST be optimized (sharp library for compression)
- API response times MUST be under 500ms for standard queries
- Database queries MUST use indexes for frequently accessed fields

## Development Workflow

### Feature Development Process

1. **Specification Phase**: Create feature spec in `/specs/[###-feature-name]/spec.md` using the spec template
2. **Planning Phase**: Generate implementation plan in `/specs/[###-feature-name]/plan.md` using the plan template
3. **Task Generation**: Create dependency-ordered tasks in `/specs/[###-feature-name]/tasks.md` grouped by user story
4. **Constitution Check**: Verify compliance with all principles before implementation
5. **Implementation**: Execute tasks in priority order, with P1 user stories first
6. **Validation**: Test each user story independently before proceeding to next priority
7. **Integration Testing**: Verify n8n workflow integration if API changes were made
8. **Deployment**: Deploy to staging, validate PWA functionality, then promote to production

### P1 MVP Validation Pattern

When implementing P1 MVP features, follow this validated pattern:

1. **Backend First**: Implement and test backend API endpoints, middleware, and services
2. **Frontend Integration**: Build UI components, forms, and pages that consume the backend API
3. **Manual Testing**: Validate form behavior, error handling, success flows, and role-based access
4. **Integration Testing**: Verify compatibility with existing features (n8n webhook, work order list, etc.)
5. **Mobile Device Testing**: Test on actual iOS and Android devices before considering P1 complete
6. **P2/P3 Deferral**: Document P2 and P3 features in backlog; deploy P1 MVP before continuing

### Code Review Requirements

- All frontend changes MUST be tested on at least one physical mobile device
- API changes MUST include contract documentation in `/specs/[feature]/contracts/`
- Security-sensitive changes (auth, file upload, data access) require additional review
- Database migrations MUST be tested against production-like data volumes
- PWA functionality MUST be validated after frontend deployments

### Testing Expectations

While comprehensive test suites are aspirational, the following MUST be manually validated:
- Mobile responsiveness on real devices
- Offline functionality for PWA features
- n8n webhook integration for API changes
- Authentication and authorization flows
- Photo upload and retrieval

### Branching & Commits

- Feature branches MUST use naming convention: `[###-feature-name]`
- Commits SHOULD be atomic and reference feature/task numbers
- Commit messages SHOULD follow conventional commits format when possible
- Pull requests MUST link to feature specification in `/specs/`

### Version Management Before Main Branch Push

Before pushing to the main branch, the following version management steps MUST be completed:

1. **Update Settings Page Version**: Navigate to Settings page (`src/pages/SettingsPage.jsx` or equivalent) and update the version number display
2. **Add Release Note**: Include a brief release note summarizing the changes being merged (features added, bugs fixed, enhancements made) (`/relse-notes/`)
3. **Synchronize package.json**: Ensure both `frontend/package.json` and `backend/package.json` reflect the same version number
4. **Follow Semantic Versioning**:
   - **MAJOR** (X.0.0): Breaking changes, major feature overhauls
   - **MINOR** (0.X.0): New features, non-breaking enhancements
   - **PATCH** (0.0.X): Bug fixes, minor improvements, documentation updates

**Rationale**: Version tracking in the Settings page provides users with visibility into system updates and helps support teams identify which version is deployed. Release notes document change history and facilitate troubleshooting.

## Governance

### Amendment Process

This constitution can be amended through the following process:
1. Proposed changes documented with rationale and impact analysis
2. Stakeholder review and approval (project owner/technical lead)
3. Version increment following semantic versioning rules:
   - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
4. Update all dependent templates and documentation
5. Generate Sync Impact Report documenting changes

### Compliance Review

- All feature specifications MUST include a Constitution Check section
- Pull requests SHOULD reference relevant constitutional principles when applicable
- Violations of NON-NEGOTIABLE principles MUST be explicitly justified or rejected
- Quarterly review of constitution alignment with project evolution

### Complexity Justification

Any violation of constitutional principles (adding unnecessary complexity, skipping mobile testing, breaking n8n integration) MUST be justified in the feature's implementation plan with:
- Why the violation is necessary
- What simpler alternatives were considered and why rejected
- Mitigation strategy for any risks introduced

### Runtime Guidance

For AI coding agents and developers, runtime development guidance should reference this constitution when making architectural decisions, proposing features, or evaluating trade-offs. When in doubt, prioritize mobile users, maintain n8n integration, and deliver incrementally by user story.

**P1 MVP Pattern**: When implementing features, complete P1 (MVP) tasks fully before considering P2/P3 enhancements. Validate P1 functionality with manual and integration testing before expanding scope.

**Version**: 1.0.1 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-17
