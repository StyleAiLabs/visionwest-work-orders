<!--
SYNC IMPACT REPORT
==================
Version Change: 1.1.0 → 1.2.0 (MINOR - corrected RBAC permission matrix, added cancellation
  integrity rules, updated quotes workflow, photo limits, and app version)
Last Updated: 2026-03-06

Principles Defined:
- Mobile-First Design (mandatory)
- Multi-Client Data Isolation (security critical)
- Role-Based Access Control (enforced at query level) ← UPDATED
- Brand Consistency (NextGen WOM identity)
- Environment Parity (dev/staging/production)
- Release Documentation (changelog required)
- Integration Resilience (n8n/SMS async patterns)

Changes in v1.2.0:
- FIXED: Permission matrix - Staff CANNOT cancel work orders (was erroneously shown as ✅,
  corrected to ❌ to match auth.middleware.js handleWorkOrderStatusUpdate implementation)
- ADDED: Cancellation Integrity rules under RBAC (mandatory reason, permanent status,
  no reactivation, audit trail - introduced in v2.8.0)
- ADDED: Quotes workflow access pattern under RBAC (client_admin/admin create requests;
  staff provides quotes; client_admin/admin approve/decline)
- UPDATED: File Upload Pattern - 20 photos max, 5MB per file (was 10 photos, 10MB total)
- UPDATED: App Version 2.7.0 → 2.8.0
- UPDATED: Last Amended date to 2026-03-06

Templates Status:
✅ plan-template.md - aligned with multi-environment setup (no changes needed)
✅ spec-template.md - aligned with user story priorities (no changes needed)
✅ tasks-template.md - aligned with independent testing (no changes needed)
⚠️  README.md - needs constitution reference
⚠️  DEPLOYMENT_GUIDE.md - needs version policy reference

Follow-up TODOs:
- Add CHANGELOG.md template for release documentation principle
- Create pre-commit hooks for brand color validation
- Add automated tests for role-based access patterns (cancellation, quote permissions)
- Consider adding a dedicated principle for the Quotes system as it matures
-->

# NextGen WOM Constitution

## Core Principles

### I. Mobile-First Design (NON-NEGOTIABLE)

All features MUST be designed and tested for mobile devices first, then adapted for desktop. The system is a Progressive Web App where field workers use smartphones as the primary interface.

**Requirements**:
- Touch targets minimum 44px
- Responsive layouts using Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px)
- Offline functionality via PWA service workers
- Test on actual mobile devices before considering feature complete

**Rationale**: Field workers access the system on-site using mobile devices. Desktop optimization is secondary.

### II. Multi-Client Data Isolation (SECURITY CRITICAL)

Every database query MUST enforce client-level data isolation through `client_id` filtering. Never rely on application-level filtering alone.

**Requirements**:
- All `users` and `work_orders` tables MUST have `client_id` foreign key
- Controller methods MUST build `whereClause` with client filtering before any database query
- Pattern in `workOrder.controller.js` is canonical: `getSummary()`, `getAllWorkOrders()`, `getAuthorizedPersons()` all use role-specific `whereClause`
- New models MUST include `client_id` if they contain client-specific data

**Rationale**: Multi-tenant architecture prevents data leakage between organizations. Database-level isolation is the only safe approach.

### III. Role-Based Access Control

Access control MUST be enforced at the API route level using role-specific middleware. Four roles with distinct access patterns:

**Roles**:
- `client`: Sees only work orders where `authorized_email` matches their email; Can cancel own work
  orders only (with mandatory reason)
- `client_admin`: Sees all work orders for their client; Can create, update, and cancel work orders
  for their client (with mandatory reason); Can create/approve/decline quote requests
- `staff`: Sees all work orders across all clients; Can view and update any work order; CANNOT
  cancel, delete, or access the admin section; Can provide quotes to client_admin/admin requests
- `admin`: Full system access; Can view, update, cancel, and delete any work order; Full access to
  admin section including user management and client management; Can create and approve quotes

**Work Order Permission Matrix**:
| Action | client | client_admin | staff | admin |
|--------|--------|--------------|-------|-------|
| View own client work orders | ✅ (email-filtered) | ✅ | ✅ | ✅ |
| View all client work orders | ❌ | ✅ (own client) | ✅ (all clients) | ✅ (all clients) |
| Create work order | ❌ | ✅ | ❌ | ✅ |
| Update work order | ❌ | ✅ (own client) | ✅ (all clients) | ✅ (all clients) |
| Delete work order | ❌ | ❌ | ❌ | ✅ |
| Cancel work order | ✅ (own, with notes) | ✅ (client's, with notes) | ❌ (403) | ✅ (any, with notes) |
| Export work order PDF | ❌ | ✅ | ✅ | ✅ |
| Access admin section | ❌ | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ |
| Client management | ❌ | ❌ | ❌ | ✅ |

**Quotes Permission Matrix**:
| Action | client | client_admin | staff | admin |
|--------|--------|--------------|-------|-------|
| Create quote request | ❌ | ✅ | ❌ | ✅ |
| View quotes | ❌ | ✅ (own client) | ✅ (all) | ✅ (all) |
| Provide quote (price) | ❌ | ❌ | ✅ | ✅ |
| Approve/decline quote | ❌ | ✅ | ❌ | ✅ |
| Convert quote to work order | ❌ | ❌ | ✅ | ✅ |

**Requirements**:
- All routes use `authMiddleware.verifyToken` + role middleware (e.g., `authMiddleware.isAnyValidRole`,
  `authMiddleware.isStaffOrAdmin`, `authMiddleware.isAdmin`)
- `clientScoping.js` middleware MUST be applied after `verifyToken` for all client-scoped routes;
  admins and staff can override scope via `X-Client-Context` header
- Status update middleware (`handleWorkOrderStatusUpdate`) enforces: clients → only `cancelled`;
  staff → all statuses except `cancelled`; client_admin and admin → all statuses
- Client ownership validation MUST skip for `staff` and `admin` roles (they bypass client scoping)
- DELETE endpoints protected by `authMiddleware.isAdmin` only
- Admin section routes protected by `authMiddleware.isAdmin` only
- Maintain consistency between dashboard summaries and work order listings

**Cancellation Integrity Rules** (enforced since v2.8.0):
- ALL cancellations MUST include a non-empty written reason (`notes` field required)
- Cancelled work orders CANNOT be reactivated (status change attempt returns 400)
- Every cancellation MUST create both a `WorkOrderNote` (audit message with user full name) and a
  `StatusUpdate` record (with `previous_status`, `new_status`, `notes`, and `updated_by`)
- Staff users are blocked from cancelling any work order (403 Forbidden by design)
- Completed work orders CANNOT be cancelled

**Rationale**: Clear role separation prevents unauthorized access while enabling appropriate visibility.
Staff can manage all work orders operationally without administrative privileges. Cancellation audit
trails ensure accountability and data integrity for permanently closed work orders.

### IV. Brand Consistency (NextGen WOM Identity)

All UI components MUST use the NextGen WOM color palette and design system defined in `.specify/memory/brand-kit-guidelines.md`.

**Required Colors** (Tailwind config):
- `deep-navy` (#0e2640) - Headers, navigation, primary elements
- `nextgen-green` (#8bc63b) - CTAs, accents, success states
- `rich-black` (#010308) - Body text, high contrast
- `pure-white` (#ffffff) - Backgrounds, cards

**Requirements**:
- No hardcoded colors outside Tailwind config
- Status colors: pending (amber), in-progress (nextgen-green), completed (nextgen-green), cancelled (red)
- WCAG AA contrast compliance mandatory (see brand-kit-guidelines.md for verification)
- Icons from Heroicons outline style only

**Rationale**: Consistent branding reinforces professional identity and maintains accessibility standards.

### V. Environment Parity

Code MUST behave identically across development, staging, and production environments. Only configuration differs.

**Environments**:
- **Development**: `npm run dev` - Uses `sequelize.sync({ alter: true })` for schema changes
- **Staging**: `npm run dev:staging` - Uses staging database, authentication only (no sync)
- **Production**: `npm start` - Runs migrations via Sequelize CLI, then starts server

**Requirements**:
- Environment switching: `node scripts/set-env.js [staging|development]` copies appropriate `.env.*` file
- Never use `NODE_ENV` checks to alter business logic
- Database connection configs in `backend/config/db.config.js`
- Test staging deployment before production merge

**Rationale**: Environment-specific bugs are prevented when code paths are identical and only data sources differ.

### VI. Release Documentation Required

Every feature update MUST include updated release notes documenting user-facing changes.

**Requirements**:
- Version follows semantic versioning: MAJOR.MINOR.PATCH (currently 2.8.0)
- MAJOR: Breaking API changes, database schema removals, role permission changes
- MINOR: New features, new API endpoints, new UI components
- PATCH: Bug fixes, typo corrections, performance improvements
- Release notes MUST be created in `/release-notes` folder as `release-X.Y.Z-summary.md`
- Release notes MUST be added to Settings → App Information → Release Notes (in ReleaseNotesPage.jsx)
- Version MUST be updated in:
  - `frontend/package.json` - Frontend version
  - `backend/package.json` - Backend version (used by /api/app/info endpoint)
  - `frontend/src/pages/SettingsPage.jsx` - Fallback version display
  - `frontend/src/pages/ReleaseNotesPage.jsx` - Latest version entry
- Document in commit message and create GitHub release notes
- Include migration instructions if database schema changes

**Release Notes Structure**:
- Summary section with release date and type
- New Features (user-facing capabilities)
- Bug Fixes (issues resolved)
- Technical Improvements (developer-facing changes)
- Breaking Changes (if any)
- Upgrade Instructions

**Rationale**: Deployment teams and clients need clear change documentation for production updates. Users can view release history from Settings → App Information → View Release Notes.

### VII. Integration Resilience

External service integrations (n8n webhooks, SMS notifications, PDF export) MUST be asynchronous
and failure-tolerant.

**Requirements**:
- Use `setImmediate()` for async operations after responding to user
  (see `workOrder.controller.js:updateWorkOrderStatus`)
- SMS notifications via `smsService.sendWorkOrderStatusSMS()` - failure logs but does not block
- n8n webhook creates work orders with VisionWest `client_id` by default
- Webhook endpoint bypasses JWT authentication using `WEBHOOK_API_KEY` header
- PDF export via `pdfService.generateWorkOrderPDF(id)` - returns buffer, does not alter work order state
- Photo uploads: maximum 20 photos per work order, 5MB per file (via multer + S3 storage)
- Test webhooks with `/scripts/test-webhook.js` script

**Rationale**: External service failures should never block user operations or corrupt application state.

## Brand Guidelines

### Color Palette Standards

All UI development MUST reference `.specify/memory/brand-kit-guidelines.md` for comprehensive color, typography, and component specifications.

**Enforcement**:
- Use Tailwind classes, never inline hex codes
- Component examples in brand-kit-guidelines.md are canonical
- Accessibility contrast ratios are pre-verified in guidelines document

### Typography Hierarchy

- Headers: Rich Black for maximum contrast
- Body Text: Rich Black (primary), Gray 600 (secondary)
- Interactive Text: NextGen Green for links and active states
- Error Text: Red 600 (#dc2626)
- Success Text: NextGen Green

## Development Environments

### Local Development Setup

**Backend**:
```bash
cd backend
npm install
cp .env.example .env  # Configure database credentials
npm run dev           # Start with nodemon + sequelize sync
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev           # Start Vite dev server on port 5173
```

### Database Seeding

- **Production Users**: `npm run setup` (creates VisionWest client users)
- **Development Data**: `node utils/seeder.js` (generates test work orders)
- **Test Credentials**: See `backend/README.md` "Development Notes" section

### Environment Switching

```bash
# Switch to staging database
node scripts/set-env.js staging

# Switch back to development
node scripts/set-env.js development
```

### Testing Scripts

- `node scripts/test-webhook.js` - Verify n8n integration
- `node scripts/test-client-api.js` - Test client management
- `node scripts/validate-migration.js` - Verify database schema
- `node scripts/test-data-integrity.js` - Multi-client validation

## Deployment Pipeline

### Branch Strategy

- **dev branch** → Auto-deploys to:
  - Frontend: https://demo.wom.wpsg.nz/
  - Backend: https://visionwest-api.onrender.com/
  
- **main branch** → Auto-deploys to:
  - Frontend: https://app.wom.wpsg.nz/
  - Backend: https://vw-womapi-prod.onrender.com/

### Deployment Process

1. **Feature Development**: Work on `dev` branch → Auto-deploy to staging
2. **Testing**: Validate features on dev environment
3. **Production Release**: Merge `dev` → `main` → Auto-deploy to production
4. **Release Notes**: Document changes in commit message and GitHub release

### Pre-Production Checklist

- [ ] All tests pass (`npm test` in backend/frontend)
- [ ] Brand guidelines followed (no hardcoded colors)
- [ ] Mobile tested on actual devices
- [ ] Role-based access verified for new endpoints
- [ ] Database migrations tested with `validate-migration.js`
- [ ] Release notes prepared with version bump rationale

## Governance

### Constitution Authority

This constitution supersedes all other development practices and guidelines. When conflicts arise, constitution principles take precedence.

### Amendment Procedure

1. Propose amendment with rationale and impact analysis
2. Update version number following semantic versioning:
   - MAJOR: Removing/redefining principles (backward incompatible)
   - MINOR: Adding new principles or sections
   - PATCH: Clarifications, typos, non-semantic refinements
3. Update dependent templates (plan, spec, tasks)
4. Document in Sync Impact Report (HTML comment at file top)
5. Commit with message: `docs: amend constitution to vX.Y.Z (description)`

### Compliance Review

- **Quarterly**: Review all principles against current codebase
- **Pre-PR**: Verify new code aligns with constitution
- **Architecture Changes**: Requires constitution update or explicit violation justification

### Violation Handling

Principle violations MUST be documented in implementation plan's "Complexity Tracking" table with:
- Which principle is violated
- Why violation is necessary
- What simpler alternative was rejected and why

**Version**: 1.2.0 | **Ratified**: 2025-10-20 | **Last Amended**: 2026-03-06 | **App Version**: 2.8.0

````
