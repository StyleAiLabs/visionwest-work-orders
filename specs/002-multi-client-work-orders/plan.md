# Implementation Plan: Multi-Client Work Order Management

**Branch**: `002-multi-client-work-orders` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-multi-client-work-orders/spec.md`

## Summary

Extend the VisionWest work order platform into a multi-client solution where multiple independent organizations can be onboarded, each with isolated users, data, and workflows. This feature transforms a single-tenant system into a multi-tenant SaaS platform while preserving all existing Visionwest operations. The P1 MVP includes data isolation, global admin management, and seamless migration of legacy data.

**Technical Approach**: Add a `clients` table with foreign key relationships to `users` and `work_orders`. Extend JWT authentication to include client context. Implement middleware-based automatic client scoping for all API endpoints. Create mobile-first admin UI for client management. Execute zero-downtime migration to assign existing data to Visionwest client.

## Technical Context

**Language/Version**: Node.js 18.x (backend), React 19+ (frontend)

**Primary Dependencies**:
- Backend: Express 4.x, Sequelize 6.x, PostgreSQL, JWT (jsonwebtoken), bcrypt
- Frontend: React 19, Vite 6.x, Tailwind CSS 3.x, React Router 7.x, React Context API

**Storage**: PostgreSQL for relational data (clients, users, work_orders with foreign keys), AWS S3 for photos

**Testing**: Manual testing following Constitution requirements (mobile device testing, n8n integration validation)

**Target Platform**: Web application (mobile-first responsive design), deployed on Netlify (frontend) + Render (backend)

**Project Type**: Web application (separate frontend and backend)

**Performance Goals**:
- Client context switching: <3 seconds
- Work order list loading with client scoping: <10% performance degradation vs current
- Database queries with client filters: <500ms response time
- Support 10+ concurrent client organizations

**Constraints**:
- MUST maintain n8n webhook compatibility (Principle III)
- MUST be mobile-first for admin panel (Principle I)
- MUST preserve 100% of existing Visionwest data during migration
- MUST NOT break existing user workflows or authentication

**Scale/Scope**:
- 10-100 client organizations initially
- 50-500 users per client
- Thousands of work orders per client
- Single-region deployment (North America)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design (NON-NEGOTIABLE)
**Status**: ⚠️ REQUIRES ATTENTION

**Compliance**:
- ✅ Client organization list must be mobile-optimized
- ✅ Admin panel for client management must follow 44x44px touch targets
- ✅ Client context switcher must be thumb-friendly
- ⚠️ Admin features typically desktop-focused - must resist this pattern
- ✅ All responsive breakpoints (320px, 375px, 390px, 414px) must be tested

**Actions Required**:
- Design admin UI mobile-first, NOT desktop-first
- Ensure client switcher is accessible on small screens
- Test on actual mobile devices, not just browser devtools

### Principle II: Progressive Enhancement & Offline Capability
**Status**: ✅ COMPATIBLE

**Compliance**:
- ✅ Client data can be cached for offline viewing
- ✅ Client context stored in localStorage for offline persistence
- ⚠️ Admin operations (create/edit clients) may require online connectivity - acceptable for MVP
- ✅ Service worker can cache client list for offline admin access

**Notes**: Admin features don't require full offline support as they're typically performed in office environments with connectivity.

### Principle III: Integration Integrity
**Status**: ✅ CRITICAL - REQUIRES CAREFUL DESIGN

**Compliance**:
- ✅ n8n webhook endpoint (`POST /api/webhook/work-orders`) MUST remain unchanged
- ✅ All webhook-created work orders MUST be assigned to Visionwest client automatically
- ✅ Webhook payload structure MUST NOT change
- ✅ Migration script MUST assign n8n integration to Visionwest client
- ✅ Client scoping middleware MUST NOT affect webhook endpoint

**Actions Required**:
- Exclude webhook endpoint from client scoping middleware
- Test n8n integration thoroughly after migration
- Document webhook-to-client mapping in contracts/
- Add integration test for webhook + multi-client coexistence

### Principle IV: User Story-Driven Development
**Status**: ✅ COMPLIANT

**Compliance**:
- ✅ Specification includes 4 prioritized user stories (3 P1, 1 P2)
- ✅ P1 forms viable MVP: data isolation + admin management + migration
- ✅ P2 (staff cross-client access) can be deferred to post-MVP
- ✅ Each story is independently testable and deployable

**P1 MVP Scope**:
1. Client Data Isolation
2. Global Admin Client Management
3. Seamless Legacy Data Migration

**P2 Post-MVP**:
4. Staff Cross-Client Work Order Access

### Principle V: Security & Data Protection
**Status**: ✅ CRITICAL - CORE FEATURE REQUIREMENT

**Compliance**:
- ✅ Client data isolation is the primary security requirement
- ✅ JWT tokens MUST include client_id for authorization
- ✅ API endpoints MUST enforce client scoping automatically
- ✅ Direct URL access to other clients' work orders MUST be blocked
- ✅ SQL injection prevented via Sequelize ORM parameterization
- ✅ Foreign key constraints ensure referential integrity
- ✅ Audit logging MUST include client context

**Security Risks & Mitigations**:
- **Risk**: Middleware bypass allowing cross-client data access
  - **Mitigation**: Comprehensive middleware coverage testing, fail-secure defaults
- **Risk**: JWT tampering to change client_id
  - **Mitigation**: JWT signature validation, server-side client_id enforcement
- **Risk**: Migration errors creating orphaned users/work orders
  - **Mitigation**: Transactional migration with rollback, staging environment testing

**GATE EVALUATION**: ⚠️ CONDITIONAL PASS

**Passes**:
- ✅ Integration Integrity (with careful webhook handling)
- ✅ User Story-Driven Development
- ✅ Security & Data Protection (core feature)
- ✅ Progressive Enhancement (admin features acceptable online-only)

**Requires Attention**:
- ⚠️ Mobile-First Design: Admin panel must be designed mobile-first, NOT as afterthought

**Proceed to Phase 0**: Yes, with mobile-first admin UI as priority design consideration

## Project Structure

### Documentation (this feature)

```
specs/002-multi-client-work-orders/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── client-api.md    # Client CRUD endpoints
│   ├── auth-changes.md  # JWT token modifications
│   └── migration.md     # Database migration contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── models/
│   └── Client.js             # New Sequelize model
├── middleware/
│   └── clientScoping.js      # New: automatic client filtering
├── routes/
│   └── client.routes.js      # New: client management endpoints
├── controllers/
│   └── client.controller.js  # New: client CRUD operations
├── migrations/
│   └── YYYYMMDD-add-multi-client-support.js  # Database migration
└── scripts/
    └── backfill-visionwest-client.js  # Data migration script

frontend/
├── src/
│   ├── components/
│   │   └── admin/
│   │       ├── ClientList.jsx       # New: mobile-first client list
│   │       ├── ClientForm.jsx       # New: create/edit client
│   │       └── ClientSwitcher.jsx   # New: admin context switcher
│   ├── pages/
│   │   └── AdminPanel.jsx           # New: client management page
│   ├── context/
│   │   └── ClientContext.jsx        # Extended: client awareness
│   └── services/
│       └── clientService.js         # New: client API calls
```

**Structure Decision**: Web application structure (Option 2) - separate frontend and backend with existing directory layout. Multi-client feature extends existing models, adds new middleware layer, and creates admin-specific UI components.

## Complexity Tracking

*No constitutional violations requiring justification*

**Note**: While admin panel could be desktop-only (common pattern), Constitution Principle I explicitly requires mobile-first design. This is accepted complexity necessary for constitutional compliance and ensures field supervisors can manage clients from mobile devices.

## Planning Phase Completion

### Phase 0: Research ✅ COMPLETE

**File**: `research.md`

**Content**:
- 7 major technical decisions documented
- Best practices for multi-tenant architecture
- Sequelize patterns for client scoping
- n8n webhook integration preservation
- Performance considerations and caching strategy
- Risk mitigation strategies
- Future enhancements identified

### Phase 1: Design Artifacts ✅ COMPLETE

**Files Created**:

1. **data-model.md** - Complete database schema specification
   - New `Client` entity with full field definitions
   - Modified `User` and `WorkOrder` entities
   - Foreign key relationships and indexes
   - Four-phase migration plan with rollback procedures
   - Sequelize model definitions
   - Data validation queries

2. **contracts/client-api.md** - REST API contract for client management
   - 6 admin endpoints (List, Get, Create, Update, Delete, Stats)
   - Admin context switching via `X-Client-Context` header
   - Webhook endpoint protection
   - Error responses and rate limiting

3. **contracts/auth-changes.md** - Authentication system modifications
   - JWT token structure changes (added `clientId` claim)
   - Login/registration endpoint updates
   - Client scoping middleware implementation
   - Token security considerations
   - Audit logging requirements

4. **contracts/migration.md** - Database migration contract
   - Four-phase migration strategy (30 minutes total, zero downtime)
   - Validation queries for each phase
   - Complete rollback procedures
   - Testing requirements and acceptance criteria
   - Troubleshooting guide

5. **quickstart.md** - Integration and testing guide
   - Development environment setup
   - 5 comprehensive testing scenarios
   - API integration code examples (React + Express)
   - Troubleshooting common issues
   - Quick reference for SQL queries and endpoints

## Next Steps

### For Implementation: Run `/speckit.tasks`

The planning phase is complete. To proceed with implementation:

```bash
/speckit.tasks
```

This command will:
1. Parse all design artifacts (research.md, data-model.md, contracts/)
2. Generate dependency-ordered tasks in `tasks.md`
3. Break down P1 MVP into actionable implementation tasks
4. Create tasks for:
   - Phase 1: Database migration (4 steps)
   - Phase 2: Backend implementation (models, middleware, controllers, routes)
   - Phase 3: Frontend implementation (admin UI components, context, services)
   - Phase 4: Testing and validation
   - Phase 5: Deployment

### Manual Review Checklist

Before running `/speckit.tasks`, review:

- [ ] **Constitution Check**: All 5 principles addressed (especially mobile-first admin UI)
- [ ] **Technical Context**: Accurate technology stack and constraints documented
- [ ] **Research Decisions**: All 7 technical decisions reviewed and approved
- [ ] **Data Model**: Database schema validated against requirements
- [ ] **API Contracts**: All endpoints cover functional requirements
- [ ] **Migration Plan**: Four-phase strategy understood and staging environment available
- [ ] **Integration Tests**: n8n webhook scenarios documented

### Key Implementation Priorities

**P1 MVP** (Must complete before deployment):
1. ✅ Client Data Isolation (FR-001 to FR-007)
2. ✅ Global Admin Client Management (FR-008 to FR-013)
3. ✅ Seamless Legacy Data Migration (FR-014 to FR-018)

**P2 Post-MVP** (Deferred):
4. ⏳ Staff Cross-Client Work Order Access

### Success Criteria Validation

After implementation, verify:
- [ ] **SC-001**: 100% data isolation verified through access control testing
- [ ] **SC-002**: Admin can manage 10+ clients via mobile and desktop
- [ ] **SC-003**: Context switching <3 seconds, visual indicators present
- [ ] **SC-004**: Zero data loss during migration verified
- [ ] **SC-005**: <10% performance impact on work order queries
- [ ] **SC-006**: Support 10+ concurrent clients with independent data
- [ ] **SC-007**: Zero cross-client violations in 90-day monitoring period

---

## Document Status

**Plan Status**: ✅ COMPLETE
**Created**: 2025-10-17
**Last Updated**: 2025-10-17
**Version**: 1.0.0

**Artifacts Generated**:
- ✅ plan.md (this file)
- ✅ research.md
- ✅ data-model.md
- ✅ contracts/client-api.md
- ✅ contracts/auth-changes.md
- ✅ contracts/migration.md
- ✅ quickstart.md
- ⏳ tasks.md (run `/speckit.tasks` to generate)

**Ready for**: `/speckit.tasks` command to generate implementation task list

