# Implementation Plan: Admin Client Filter for Jobs Dashboard

**Branch**: `004-add-client-filter` | **Date**: 2025-10-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-add-client-filter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a client filter dropdown to the jobs dashboard for admin users, allowing them to filter work orders by specific clients. The filter will work alongside the existing authorized person filter, support combined filtering, reset pagination appropriately, and default to showing "All Clients" on initial load. The implementation extends the existing multi-tenant work order system with client-scoped filtering capabilities.

## Technical Context

**Language/Version**: Node.js 18.x (backend), React 19 (frontend)
**Primary Dependencies**: Express 4.x, Sequelize 6.x, PostgreSQL (backend); React 19, Vite 6.x, Tailwind CSS 3.x, React Router 7.x (frontend)
**Storage**: PostgreSQL with existing clients and work_orders tables
**Testing**: Manual testing on mobile devices (iOS/Android), integration testing with n8n webhook
**Target Platform**: Web application (PWA) with mobile-first design
**Project Type**: Web application (separate frontend and backend)
**Performance Goals**: <2 seconds for filter application, <500ms API response time
**Constraints**: Must not break n8n webhook integration, mobile-first UI, maintain existing client scoping middleware
**Scale/Scope**: Small feature enhancement to existing dashboard (5-8 files modified/created)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✓ PASS
- Client filter dropdown will be designed for mobile-first interaction
- Touch target requirements will be met (44x44px minimum)
- Filter UI will be tested on 320px, 375px, 390px, 414px breakpoints
- Dropdown will be thumb-friendly for one-handed operation

### Principle II: Progressive Enhancement & Offline Capability ⚠️ DEFERRED
- Client filter requires network connectivity to fetch client list
- Offline caching of client list can be added in future enhancement
- Core filtering functionality will work with cached work orders if available
- **Justification**: P1 MVP focuses on online filtering; offline enhancement is P2/P3 scope

### Principle III: Integration Integrity ✓ PASS
- No changes to n8n webhook endpoint (`POST /api/webhook/work-orders`)
- Backend client filter uses existing `X-Client-Context` header mechanism
- No breaking changes to work order data structures
- New client list endpoint (`GET /api/clients`) is additive only

### Principle IV: User Story-Driven Development ✓ PASS
- Feature has 3 prioritized user stories (P1, P2, P3)
- P1: Basic client filtering (MVP)
- P2: Combined client + authorized person filtering
- P3: Default selection and session persistence
- Each story is independently testable

### Principle V: Security & Data Protection ✓ PASS
- Client list endpoint will require admin role authentication
- Client filter respects existing RBAC (admin-only feature)
- Uses existing JWT authentication and client scoping middleware
- No exposure of sensitive client data beyond what admins already access

**Constitution Compliance**: ✓ PASSED (1 deferred enhancement acceptable for P1 MVP)

## Project Structure

### Documentation (this feature)

```
specs/004-add-client-filter/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── clients-api.yaml # OpenAPI spec for client list endpoint
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── controllers/
│   ├── workOrder.controller.js      # Modified: Add clientId parameter handling
│   └── client.controller.js         # New: Client list endpoint
├── routes/
│   ├── workOrder.routes.js          # Modified: Update query handling
│   └── client.routes.js             # New: Client routes
├── middleware/
│   └── clientScoping.js             # Review: Verify admin context switching
└── models/
    └── client.model.js              # Existing: No changes needed

frontend/
├── src/
│   ├── components/
│   │   └── workOrders/
│   │       ├── ClientFilter.jsx     # New: Client filter dropdown component
│   │       └── AuthorizedPersonFilter.jsx  # Modified: Update when client changes
│   ├── pages/
│   │   ├── WorkOrdersPage.jsx       # Modified: Add client filter state
│   │   └── DashboardPage.jsx        # Modified: Add client filter state
│   ├── services/
│   │   ├── workOrderService.js      # Modified: Add clientId to API calls
│   │   └── clientService.js         # New: Client API service
│   └── context/
│       └── FilterContext.jsx        # New: Shared filter state (optional)
└── tests/
    └── [manual testing checklist]
```

**Structure Decision**: Web application structure with separate frontend and backend directories. Frontend changes focus on the work orders components and services, backend adds a new client controller and modifies work order controller to accept client filtering.

## Complexity Tracking

*No constitutional violations requiring justification.*

This feature maintains project simplicity by:
- Reusing existing client scoping infrastructure (`X-Client-Context` header)
- Following established filter pattern (similar to AuthorizedPersonFilter)
- No new dependencies or architectural patterns
- Leveraging existing multi-tenant database relationships

---

## Post-Design Constitution Re-evaluation

**Re-evaluated**: 2025-10-19 (after Phase 1 design artifacts complete)

### Principle I: Mobile-First Design ✓ PASS (Confirmed)
- ClientFilter component uses native `<select>` with minimum 44px touch target
- Full width on mobile (w-full), fixed width on desktop (w-64)
- Responsive design confirmed in quickstart guide with specific breakpoints
- Manual testing checklist includes physical device testing

### Principle II: Progressive Enhancement & Offline Capability ⚠️ DEFERRED (Confirmed)
- P1 MVP requires network for client list fetch
- Offline enhancement documented as P2/P3 opportunity
- No change from initial assessment

### Principle III: Integration Integrity ✓ PASS (Confirmed)
- API contract confirms no changes to `/api/webhook/work-orders`
- New endpoint `/api/clients` is additive only
- Existing work order queries extended with optional `X-Client-Context` header
- Backward compatible

### Principle IV: User Story-Driven Development ✓ PASS (Confirmed)
- Implementation plan follows P1 → P2 → P3 order
- Quickstart guide organizes phases by user story priority
- Each phase delivers testable increment

### Principle V: Security & Data Protection ✓ PASS (Confirmed)
- Admin role check enforced in client controller
- JWT authentication required for all endpoints
- No sensitive data exposure (clients endpoint returns minimal fields)
- API contract documents authorization requirements

**Final Compliance Status**: ✓ PASSED (all principles satisfied or acceptably deferred)

---

## Phase Completion Summary

### Phase 0: Research ✓ COMPLETE
- [research.md](./research.md) generated with 8 technical decisions
- All NEEDS CLARIFICATION items resolved
- Implementation approach validated

### Phase 1: Design & Contracts ✓ COMPLETE
- [data-model.md](./data-model.md) - Entity relationships and query patterns
- [contracts/clients-api.yaml](./contracts/clients-api.yaml) - OpenAPI 3.0 specification
- [quickstart.md](./quickstart.md) - Developer implementation guide
- Agent context updated (CLAUDE.md)

### Phase 2: Task Generation - NOT STARTED
**Note**: Task generation is performed by `/speckit.tasks` command, not `/speckit.plan`

---

## Ready for Implementation

All planning artifacts are complete and the feature is ready for task generation and implementation.
