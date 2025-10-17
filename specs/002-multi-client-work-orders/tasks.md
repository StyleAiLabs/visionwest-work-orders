# Tasks: Multi-Client Work Order Management

**Input**: Design documents from `/specs/002-multi-client-work-orders/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This feature does not explicitly request tests. Tasks focus on implementation with manual testing per constitution requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/` for Node.js/Express backend, `frontend/src/` for React frontend
- Tasks reference absolute file paths from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database preparation for multi-client architecture

- [X] T001 Review plan.md, research.md, and data-model.md to understand multi-tenant architecture decisions
- [X] T002 [P] Install required backend dependencies: Sequelize CLI for migrations (if not already installed)
- [X] T003 [P] Create backend/migrations/ directory structure if not exists
- [X] T004 [P] Create backend/scripts/ directory for data migration scripts
- [X] T005 Create database backup script in backend/scripts/backup-database.js for pre-migration safety

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core multi-client infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. This phase implements the database migration and core authentication changes.

### Database Migration (Four-Phase Strategy per migration.md)

- [X] T006 Create Phase 1 migration file: backend/migrations/YYYYMMDDHHMMSS-add-multi-client-support-phase1.js - creates clients table, adds nullable client_id columns to users and work_orders
- [X] T007 Run Phase 1 migration on local development database
- [X] T008 Verify Phase 1: Check clients table exists, Visionwest client created, client_id columns are nullable
- [X] T009 Create backfill script: backend/scripts/backfill-visionwest-client.js - assigns all existing users and work_orders to Visionwest client (implements Phase 2 of migration)
- [X] T010 Run backfill script on local development database
- [X] T011 Verify Phase 2: Check zero NULL client_id values in users and work_orders tables
- [ ] T012 Create Phase 3 migration file: backend/migrations/YYYYMMDDHHMMSS-add-multi-client-support-phase3.js - makes client_id NOT NULL, adds composite indexes
- [ ] T013 Run Phase 3 migration on local development database
- [ ] T014 Verify Phase 3: Check client_id is NOT NULL, verify composite indexes exist with validation queries from migration.md

### Core Models and Middleware

- [ ] T015 [P] Create Client Sequelize model in backend/models/Client.js with all attributes, validations, and associations per data-model.md
- [ ] T016 [P] Update User Sequelize model in backend/models/User.js - add client_id field, belongsTo association, update indexes per data-model.md
- [ ] T017 [P] Update WorkOrder Sequelize model in backend/models/WorkOrder.js - add client_id field, belongsTo association, update indexes per data-model.md
- [ ] T018 Create client scoping middleware in backend/middleware/clientScoping.js - implements automatic client_id filtering per auth-changes.md contract
- [ ] T019 Update authentication middleware in backend/middleware/auth.middleware.js - extend JWT token generation to include clientId claim per auth-changes.md
- [ ] T020 Update JWT token verification in backend/middleware/auth.middleware.js - extract clientId from token and attach to req.user
- [ ] T021 Apply client scoping middleware to all work order routes (exclude webhook endpoint) in backend/routes/workOrder.routes.js

**Checkpoint**: Foundation ready - multi-tenant infrastructure in place, all user story implementation can now begin

---

## Phase 3: User Story 1 - Client Data Isolation (Priority: P1) 🎯 MVP Part 1

**Goal**: Ensure users can only access work orders and data belonging to their organization. This is the core security requirement for multi-tenancy.

**Independent Test**: Create two test clients, assign users to each, create work orders for each client, verify users from Client A cannot access Client B work orders through UI or API.

### Implementation for User Story 1

- [X] T022 [P] [US1] Update getAllWorkOrders controller in backend/controllers/workOrder.controller.js - add client_id filter using req.clientId from middleware
- [X] T023 [P] [US1] Update getWorkOrderById controller in backend/controllers/workOrder.controller.js - add client_id validation to prevent cross-client access
- [X] T024 [P] [US1] Update createWorkOrder controller in backend/controllers/workOrder.controller.js - automatically assign req.clientId to new work orders
- [X] T025 [P] [US1] Update updateWorkOrder controller in backend/controllers/workOrder.controller.js - validate work order belongs to user's client before allowing updates
- [X] T026 [P] [US1] Update deleteWorkOrder controller in backend/controllers/workOrder.controller.js - validate work order belongs to user's client before allowing deletion
- [X] T027 [US1] Update login endpoint in backend/controllers/auth.controller.js - include client details in response per auth-changes.md contract
- [X] T028 [US1] Update register endpoint in backend/controllers/auth.controller.js - require and validate client_id for new users per auth-changes.md contract
- [X] T029 [US1] Test user story 1 isolation: Create test users for two clients, verify work order access is properly scoped

**Checkpoint**: At this point, client data isolation should be fully functional - users can only see their own client's work orders

---

## Phase 4: User Story 2 - Global Admin Client Management (Priority: P1) 🎯 MVP Part 2

**Goal**: Enable global admins to manage multiple client organizations, switch contexts, and view data across all clients.

**Independent Test**: Log in as global admin, create new clients through admin interface, switch between client contexts, verify work orders correctly scoped to selected client.

### Backend Implementation for User Story 2

- [ ] T030 [P] [US2] Create client routes file in backend/routes/client.routes.js - define all 6 endpoints from client-api.md contract (List, Get, Create, Update, Delete, Stats)
- [ ] T031 [P] [US2] Create client controller in backend/controllers/client.controller.js with admin-only middleware protection
- [ ] T032 [P] [US2] Implement getAllClients controller method - supports pagination, filtering by status, search by name/code per client-api.md
- [ ] T033 [P] [US2] Implement getClientById controller method - returns client details with user_count and work_order_count
- [ ] T034 [P] [US2] Implement createClient controller method - validates required fields (name, code) and uniqueness constraints per client-api.md
- [ ] T035 [P] [US2] Implement updateClient controller method - prevents code modification, allows partial updates per client-api.md
- [ ] T036 [P] [US2] Implement deleteClient controller method - validates no active users/work orders, implements soft delete (status='archived') per client-api.md
- [ ] T037 [P] [US2] Implement getClientStats controller method - returns work order counts by status, user counts by role per client-api.md
- [ ] T038 [US2] Update client scoping middleware in backend/middleware/clientScoping.js - add admin context switching via X-Client-Context header per auth-changes.md
- [ ] T039 [US2] Register client routes in backend/app.js or main server file with admin role authorization

### Frontend Implementation for User Story 2

- [ ] T040 [P] [US2] Create clientService in frontend/src/services/clientService.js - API calls for all client endpoints (List, Get, Create, Update, Delete, Stats)
- [ ] T041 [P] [US2] Create ClientContext in frontend/src/context/ClientContext.jsx - manages current client context for admin users
- [ ] T042 [P] [US2] Create ClientList component in frontend/src/components/admin/ClientList.jsx - mobile-first card layout displaying all clients per research.md Decision 7
- [ ] T043 [P] [US2] Create ClientForm component in frontend/src/components/admin/ClientForm.jsx - create/edit client with validation (mobile-first full-screen modal)
- [ ] T044 [P] [US2] Create ClientSwitcher component in frontend/src/components/admin/ClientSwitcher.jsx - dropdown/bottom sheet for admin context switching with visual indicator
- [ ] T045 [US2] Create AdminPanel page in frontend/src/pages/AdminPanel.jsx - integrates ClientList, provides admin-only navigation
- [ ] T046 [US2] Update workOrderService in frontend/src/services/workOrderService.js - add X-Client-Context header support for admin users per quickstart.md Example 3
- [ ] T047 [US2] Update App.jsx routing to include /admin route for admin users only
- [ ] T048 [US2] Add visual client context banner in frontend UI when admin has switched context (per auth-changes.md security requirements)
- [ ] T049 [US2] Test user story 2: Log in as admin, create new client, switch contexts, verify work order lists update correctly

**Checkpoint**: At this point, global admin client management should be fully functional - admins can manage clients and switch contexts

---

## Phase 5: User Story 3 - Seamless Legacy Data Migration (Priority: P1) 🎯 MVP Part 3

**Goal**: Ensure existing Visionwest users and work orders are automatically migrated without disruption to current operations.

**Independent Test**: Run migration on staging database copy, verify all users assigned to Visionwest client, all work orders linked to Visionwest, existing functionality (logins, work order access) works identically.

### Implementation for User Story 3

- [ ] T050 [P] [US3] Create rollback script in backend/scripts/rollback-migration.js - implements complete rollback per migration.md
- [ ] T051 [P] [US3] Create migration validation script in backend/scripts/validate-migration.js - runs all validation queries from migration.md
- [ ] T052 [US3] Document migration procedure in backend/scripts/MIGRATION_GUIDE.md - step-by-step instructions with validation checkpoints
- [ ] T053 [US3] Verify n8n webhook endpoint excluded from client scoping in backend/routes/workOrder.routes.js - webhook must bypass JWT auth and client scoping per research.md
- [ ] T054 [US3] Update webhook handler in backend/controllers/workOrder.controller.js - automatically assign Visionwest client_id to webhook-created work orders per client-api.md contract
- [ ] T055 [US3] Test webhook integration: Send test webhook request, verify work order created with Visionwest client_id, verify Visionwest users can see it
- [ ] T056 [US3] Run complete migration on staging environment: Execute all four phases, run validation script
- [ ] T057 [US3] Test legacy user login: Verify existing Visionwest user can log in and receives token with clientId claim
- [ ] T058 [US3] Test legacy work order access: Verify existing Visionwest user sees same work orders as before migration
- [ ] T059 [US3] Perform data integrity validation: Run all queries from data-model.md "Data Validation Checklist" section

**Checkpoint**: At this point, legacy data migration should be complete and validated - all existing Visionwest operations continue seamlessly

---

## Phase 6: User Story 4 - Staff Cross-Client Work Order Access (Priority: P2)

**Goal**: Enable staff members to view and update work orders across all client organizations for maintenance operations.

**Independent Test**: Create staff users, assign work orders from multiple clients, verify staff can view and update across client boundaries while client users remain restricted.

**Note**: This is P2 (post-MVP) - can be deferred until after P1 MVP deployment.

### Implementation for User Story 4

- [ ] T060 [P] [US4] Update client scoping middleware in backend/middleware/clientScoping.js - add exception for staff role to bypass client_id filtering
- [ ] T061 [P] [US4] Update getAllWorkOrders controller in backend/controllers/workOrder.controller.js - remove client_id filter for staff users
- [ ] T062 [P] [US4] Update work order update controllers - allow staff to update any client's work orders (maintain client_id validation for client/client_admin roles)
- [ ] T063 [P] [US4] Update WorkOrdersPage component in frontend/src/pages/WorkOrdersPage.jsx - display client name column for staff users
- [ ] T064 [US4] Update notification system to include client name in work order notifications for staff users (per edge case in spec.md)
- [ ] T065 [US4] Test user story 4: Create staff user, verify can view and update work orders from multiple clients

**Checkpoint**: Staff cross-client access should be functional - staff can work across all clients while client users remain isolated

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T066 [P] Add audit logging for admin client context switching in backend/middleware/clientScoping.js per auth-changes.md requirements
- [ ] T067 [P] Add rate limiting for client management endpoints (100 requests per minute per admin) per client-api.md contract
- [ ] T068 [P] Update API error responses to follow standard format from client-api.md and auth-changes.md contracts
- [ ] T069 [P] Add comprehensive logging for all client-scoped operations (include client_id in logs) per research.md best practices
- [ ] T070 [P] Performance testing: Run EXPLAIN ANALYZE queries from data-model.md to verify composite indexes are used
- [ ] T071 [P] Security audit: Test cross-client access attempts, verify all return 404 Not Found per client-api.md
- [ ] T072 [P] Mobile device testing: Test admin panel on actual mobile devices (320px, 375px, 390px, 414px breakpoints) per Constitution Principle I
- [ ] T073 [P] Update CLAUDE.md with multi-client architecture details and client scoping patterns
- [ ] T074 Run all test scenarios from quickstart.md: Scenario 1 (isolation), Scenario 2 (admin switching), Scenario 3 (CRUD), Scenario 4 (webhook), Scenario 5 (JWT validation)
- [ ] T075 Create production migration plan document with rollback procedures and monitoring checklist per migration.md
- [ ] T076 Verify all constitution principles: Mobile-first admin UI, n8n integration intact, security & data protection validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion, can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) and User Story 1 (Phase 3) completion - validates migration
- **User Story 4 (Phase 6)**: Depends on User Story 1 completion - extends client scoping with staff exception
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: CORE - Must complete first. Implements fundamental client data isolation.
- **User Story 2 (P1)**: Can start after Foundational. Backend can run in parallel with US1 backend, but frontend needs US1 client scoping to work correctly.
- **User Story 3 (P1)**: Validates US1 works with legacy data. Should be done after US1 to ensure migration preserves data isolation.
- **User Story 4 (P2)**: POST-MVP. Extends US1 client scoping with staff role exception.

### Within Each User Story

- Database migration (T006-T014) MUST complete before any model/controller updates
- Models (T015-T017) before controllers
- Middleware (T018-T021) before route updates
- Backend implementation before frontend (frontend needs API endpoints working)
- Core implementation before integration testing
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel (different directories)
- **Phase 2 Migration**: T006-T014 must run sequentially (migration phases)
- **Phase 2 Models**: T015, T016, T017 can run in parallel (different model files)
- **Phase 2 Middleware**: T018, T019, T020 should run sequentially (auth.middleware.js)
- **Phase 3 (US1)**: T022-T026 can run in parallel (different controller methods in same file - careful)
- **Phase 4 (US2) Backend**: T030-T037 can run in parallel if writing different methods
- **Phase 4 (US2) Frontend**: T040-T044 can run in parallel (different component files)
- **Phase 6 (US4)**: T060-T063 can run in parallel (different files/sections)
- **Phase 7 Polish**: T066-T073 can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# Launch all controller updates for User Story 1 together:
Task: "T022 - Update getAllWorkOrders controller - add client_id filter"
Task: "T023 - Update getWorkOrderById controller - add client_id validation"
Task: "T024 - Update createWorkOrder controller - auto-assign client_id"
Task: "T025 - Update updateWorkOrder controller - validate client ownership"
Task: "T026 - Update deleteWorkOrder controller - validate client ownership"

# Note: These all edit the same file (workOrder.controller.js) so may have conflicts.
# Better approach: Complete T022, then T023, then T024, etc. sequentially.
```

## Parallel Example: User Story 2 Frontend

```bash
# Launch all frontend components for User Story 2 together (truly parallel - different files):
Task: "T040 - Create clientService.js"
Task: "T041 - Create ClientContext.jsx"
Task: "T042 - Create ClientList.jsx"
Task: "T043 - Create ClientForm.jsx"
Task: "T044 - Create ClientSwitcher.jsx"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

**Goal**: Minimum viable multi-client platform

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T021) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 - Client Data Isolation (T022-T029)
4. Complete Phase 4: User Story 2 - Global Admin Client Management (T030-T049)
5. Complete Phase 5: User Story 3 - Seamless Legacy Data Migration (T050-T059)
6. Complete Phase 7: Polish (T066-T076) - Focus on security and mobile testing
7. **STOP and VALIDATE**: Test all P1 scenarios from quickstart.md
8. Deploy to production

**MVP Deliverable**: Multi-tenant platform with:
- ✅ Client data isolation working (FR-001 to FR-007)
- ✅ Admin can manage multiple clients (FR-008 to FR-013)
- ✅ Legacy Visionwest data migrated seamlessly (FR-014 to FR-018)
- ✅ n8n webhook continues working with Visionwest client
- ✅ Mobile-first admin panel

### Incremental Delivery

1. **Foundation** (Phase 1-2): Database multi-tenant ready → Test migration on staging
2. **Data Isolation** (Phase 3): Client scoping works → Test with 2 test clients
3. **Admin Management** (Phase 4): Admin panel functional → Demo client creation
4. **Migration Validation** (Phase 5): Legacy data preserved → Deploy to production
5. **Staff Access** (Phase 6 - POST-MVP): Staff cross-client → P2 enhancement

### Parallel Team Strategy

With multiple developers:

1. **Everyone together**: Phase 1 (Setup) and Phase 2 (Foundational) - MUST complete together
2. **Once Foundational is done**:
   - Developer A: Phase 3 (User Story 1 - Backend)
   - Developer B: Phase 4 (User Story 2 - Backend)
   - Developer C: Phase 4 (User Story 2 - Frontend)
3. **After US1 Backend done**: Developer A switches to US1 testing, then US3 (Migration validation)
4. **Integration**: All developers test together, verify client isolation and admin management work

---

## Task Summary

### Total Tasks: 76

**By Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 16 tasks (including 4-phase migration)
- Phase 3 (User Story 1 - P1): 8 tasks
- Phase 4 (User Story 2 - P1): 20 tasks (10 backend, 10 frontend)
- Phase 5 (User Story 3 - P1): 10 tasks
- Phase 6 (User Story 4 - P2): 6 tasks (POST-MVP)
- Phase 7 (Polish): 11 tasks

**MVP Scope (P1 Only)**: 60 tasks (T001-T059, T066-T076)
- Estimated time: 3-5 weeks for single developer
- Estimated time: 2-3 weeks for team of 2-3 developers working in parallel

**Post-MVP (P2)**: 6 tasks (T060-T065)
- Estimated time: 1 week additional

**Parallel Opportunities**:
- 27 tasks marked [P] can run in parallel within their phase
- User Story 2 backend and frontend can be split across developers
- Phase 7 polish tasks highly parallelizable

**Critical Path**:
Phase 1 → Phase 2 (Migration + Models + Middleware) → Phase 3 (Client Isolation) → Phase 5 (Migration Validation) → Phase 7 (Production Readiness)

---

## Notes

- [P] tasks = different files or independent sections, no direct dependencies
- [US1], [US2], [US3], [US4] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable
- Constitution Principle I (Mobile-First): Tasks T042-T044 and T072 specifically address admin mobile UI
- Constitution Principle III (Integration Integrity): Tasks T053-T055 protect n8n webhook
- Commit after each task or logical group of [P] tasks completed together
- Stop at checkpoints to validate story independently before proceeding
- Migration (Phase 2) is CRITICAL PATH - database must be multi-tenant before any user story implementation
- Test scenarios from quickstart.md should be run throughout implementation, not just at end
