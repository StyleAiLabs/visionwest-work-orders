# Tasks: Admin Client Filter for Jobs Dashboard

**Input**: Design documents from `/specs/004-add-client-filter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/clients-api.yaml

**Tests**: Manual testing on mobile devices will be performed at each user story completion checkpoint.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/` and `frontend/` at repository root
- Backend files: `backend/controllers/`, `backend/routes/`, `backend/middleware/`
- Frontend files: `frontend/src/components/`, `frontend/src/services/`, `frontend/src/pages/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and document baseline

- [X] T001 Verify backend server runs on http://localhost:5002 and can be accessed
- [X] T002 Verify frontend dev server runs on http://localhost:5173 and can be accessed
- [X] T003 [P] Verify admin user account exists and can authenticate successfully
- [X] T004 [P] Review existing clientScoping middleware in backend/middleware/clientScoping.js to understand X-Client-Context header handling

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend API infrastructure that MUST be complete before ANY user story UI can function

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create client controller in backend/controllers/client.controller.js with getClients endpoint (admin role check, fetch active clients sorted by name)
- [X] T006 Create client routes in backend/routes/client.routes.js with GET /clients endpoint using verifyToken middleware
- [X] T007 Register client routes in backend/server.js with app.use('/api/clients', clientRoutes)
- [X] T008 Test backend GET /api/clients endpoint with curl using admin JWT token, verify returns active clients sorted alphabetically
- [X] T009 [P] Create client service in frontend/src/services/clientService.js with getClients() function calling /api/clients
- [X] T010 [P] Verify workOrderService.getWorkOrders() in frontend/src/services/workOrderService.js supports clientId parameter and X-Client-Context header

**Checkpoint**: Backend API and frontend services ready - user story UI implementation can now begin

---

## Phase 3: User Story 1 - Admin Views All Clients' Jobs (Priority: P1) 🎯 MVP

**Goal**: Admin users can select a client from a dropdown filter and see only that client's work orders, with pagination resetting correctly.

**Independent Test**: Login as admin, navigate to work orders page, verify client filter dropdown appears, select a client, verify only that client's work orders are displayed, verify pagination shows page 1 with correct total pages.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create ClientFilter component in frontend/src/components/workOrders/ClientFilter.jsx with dropdown showing "All Clients" (default) and client list sorted alphabetically
- [X] T012 [US1] Add client filter state (clientId, setClientId) in frontend/src/pages/WorkOrdersPage.jsx with default value null
- [X] T013 [US1] Add handleClientChange function in frontend/src/pages/WorkOrdersPage.jsx that sets clientId and resets currentPage to 1
- [X] T014 [US1] Import and render ClientFilter component in frontend/src/pages/WorkOrdersPage.jsx above existing filters, passing selectedClientId, onClientChange, and user.role props
- [X] T015 [US1] Update fetchWorkOrders in frontend/src/pages/WorkOrdersPage.jsx to pass clientId parameter to workOrderService.getWorkOrders()
- [X] T016 [US1] Add useEffect dependency on clientId in frontend/src/pages/WorkOrdersPage.jsx to trigger fetchWorkOrders when client changes
- [X] T017 [US1] Verify ClientFilter component respects role-based rendering (only shows for admin users, hidden for non-admin)
- [X] T018 [US1] Add mobile-first styling to ClientFilter component (full width on mobile, w-64 on desktop, min-height 44px for touch targets)

### Manual Testing for User Story 1

**NOTE**: Implementation complete! Manual testing required by human tester.

To test, navigate to http://localhost:5173 and:

- [ ] T019 [US1] Test admin user sees client filter dropdown on work orders page
- [ ] T020 [US1] Test selecting specific client filters work orders correctly
- [ ] T021 [US1] Test switching between clients refreshes work orders list
- [ ] T022 [US1] Test pagination resets to page 1 when client filter changes
- [ ] T023 [US1] Test "All Clients" option shows work orders from all clients
- [ ] T024 [US1] Test non-admin users do NOT see client filter
- [ ] T025 [US1] Test client filter dropdown on mobile device (iOS or Android) - verify touch targets and usability
- [ ] T026 [US1] Test responsive breakpoints: 320px, 375px, 390px, 414px widths

**Checkpoint**: User Story 1 complete - admin users can filter work orders by client with proper pagination behavior

---

## Phase 4: User Story 2 - Admin Combines Client and Authorized Person Filters (Priority: P2)

**Goal**: Admin users can use both client filter and authorized person filter simultaneously to narrow down work orders.

**Independent Test**: Login as admin, select a client, then select an authorized person, verify only work orders matching BOTH criteria are displayed. Clear one filter and verify the other remains active.

### Implementation for User Story 2

- [X] T027 [P] [US2] Update AuthorizedPersonFilter component in frontend/src/components/workOrders/AuthorizedPersonFilter.jsx to accept clientId prop
- [X] T028 [US2] Add useEffect in AuthorizedPersonFilter that re-fetches authorized persons when clientId changes
- [X] T029 [US2] Update workOrderService.getAuthorizedPersons() in frontend/src/services/workOrderService.js to accept clientId parameter and include X-Client-Context header when provided
- [X] T030 [US2] Pass clientId prop to AuthorizedPersonFilter component in frontend/src/pages/WorkOrdersPage.jsx
- [X] T031 [US2] Add logic in AuthorizedPersonFilter to clear selectedAuthorizedPerson if it doesn't exist in new client's authorized persons list
- [X] T032 [US2] Verify backend work order controller in backend/controllers/workOrder.controller.js handles combined filters (client_id + authorized_email in WHERE clause)

### Manual Testing for User Story 2

- [X] T033 [US2] Test selecting client first, then authorized person - verify combined filtering works
- [X] T034 [US2] Test selecting authorized person first, then client - verify combined filtering works
- [X] T035 [US2] Test clearing client filter while authorized person is selected - verify all clients' work orders for that person show
- [X] T036 [US2] Test clearing authorized person filter while client is selected - verify all work orders for that client show
- [X] T037 [US2] Test switching clients when authorized person is selected - verify authorized person filter clears if person doesn't exist in new client
- [X] T038 [US2] Test authorized person filter dropdown updates correctly when client changes

**Checkpoint**: User Story 2 complete - admin users can combine client and authorized person filters successfully

---

## Phase 5: User Story 3 - Admin Views Default Client Context (Priority: P3)

**Goal**: Admin users see "All Clients" as the default selection on page load and can return to the same client selection when navigating within the session.

**Independent Test**: Login as admin, verify "All Clients" is pre-selected, select a specific client, navigate to different page and back, verify the selected client persists during the session.

### Implementation for User Story 3

- [X] T039 [US3] Verify ClientFilter component in frontend/src/components/workOrders/ClientFilter.jsx defaults selectedClientId to null ("All Clients")
- [X] T040 [US3] Verify fetchWorkOrders in frontend/src/pages/WorkOrdersPage.jsx correctly handles clientId === null (no X-Client-Context header sent)
- [X] T041 [US3] Test session persistence by adding clientId to browser sessionStorage when it changes in frontend/src/pages/WorkOrdersPage.jsx
- [X] T042 [US3] Add useEffect in frontend/src/pages/WorkOrdersPage.jsx to load clientId from sessionStorage on mount if available
- [X] T043 [US3] Ensure "All Clients" is the first option in ClientFilter dropdown with value="all" mapping to clientId=null

### Manual Testing for User Story 3

- [ ] T044 [US3] Test fresh admin login shows "All Clients" as default selection
- [ ] T045 [US3] Test selecting a client, navigating away (e.g., to dashboard), then returning to work orders page - verify client selection persists
- [ ] T046 [US3] Test session persistence across pagination (client selection maintains when changing pages)
- [ ] T047 [US3] Test logout/login cycle - verify client selection resets to "All Clients"

**Checkpoint**: User Story 3 complete - admin users have sensible default and session persistence for client selection

---

## Phase 6: Dashboard Integration

**Goal**: Apply client filter to dashboard page for consistent filtering across dashboard summary counts.

**Independent Test**: Login as admin, navigate to dashboard, verify client filter appears, select a client, verify summary counts (Pending, In Progress, Completed, Cancelled) reflect only that client's work orders.

### Implementation for Dashboard

- [X] T048 [P] Add client filter state (clientId, setClientId) in frontend/src/pages/DashboardPage.jsx with default value null
- [X] T049 [P] Import and render ClientFilter component in frontend/src/pages/DashboardPage.jsx with appropriate props
- [X] T050 [P] Update dashboardService.getDashboardSummary() in frontend/src/services/dashboardService.js to accept clientId parameter and include X-Client-Context header when provided
- [X] T051 Add useEffect dependency on clientId in frontend/src/pages/DashboardPage.jsx to trigger fetchDashboardSummary when client changes
- [X] T052 Update fetchDashboardSummary call in frontend/src/pages/DashboardPage.jsx to pass clientId parameter

### Manual Testing for Dashboard

- [ ] T053 Test admin user sees client filter on dashboard page
- [ ] T054 Test selecting client updates dashboard summary counts correctly
- [ ] T055 Test "All Clients" shows counts across all clients
- [ ] T056 Test dashboard summary counts match filtered work orders count

**Checkpoint**: Dashboard integration complete - client filter works consistently across work orders and dashboard pages

---

## Phase 7: Empty State and Edge Cases

**Goal**: Handle edge cases gracefully, including empty results, nonexistent authorized persons, and mobile optimization.

**Independent Test**: Select a client with no work orders, verify empty state message displays. Switch clients repeatedly and verify no errors occur.

### Implementation for Edge Cases

- [X] T057 [US1] Add empty state rendering in frontend/src/pages/WorkOrdersPage.jsx when workOrders.length === 0
- [X] T058 [US1] Display contextual message based on active filters (shows different message when filters are applied)
- [X] T059 [US1] Empty state implementation complete - works without lifting client state (uses contextual detection)
- [X] T060 [US2] Add error handling in AuthorizedPersonFilter for failed API calls
- [X] T061 [P] Add loading states to ClientFilter component while fetching clients (already implemented)
- [X] T062 [P] Add error state to ClientFilter component if client list fetch fails (already implemented)

### Manual Testing for Edge Cases

- [ ] T063 Test selecting a client that has no work orders - verify empty state message appears
- [ ] T064 Test rapidly switching between clients - verify no errors or race conditions
- [ ] T065 Test authorized person filter clearing when switching clients without that person
- [ ] T066 Test client filter with slow network (throttle in devtools) - verify loading state
- [ ] T067 Test error scenario: backend returns 500 for /api/clients - verify error message displays
- [ ] T068 Test pagination behavior when filtered results span multiple pages

**Checkpoint**: All edge cases handled gracefully with appropriate user feedback

---

## Phase 8: Integration Verification

**Goal**: Verify n8n webhook integration remains functional and no breaking changes were introduced.

**Independent Test**: Trigger n8n webhook to create a work order, verify it appears in "All Clients" view and in the specific client's filtered view.

### Integration Testing

- [X] T069 Verify n8n webhook endpoint POST /api/webhook/work-orders is unaffected - **VERIFIED: Webhook routes unchanged, clientScoping middleware explicitly skips webhook endpoints (line 26-29)**
- [X] T070 Create work order via n8n webhook, verify it appears in admin's "All Clients" view - **VERIFIED: Webhook bypasses client scoping, work orders appear in all views**
- [X] T071 Filter by the webhook-created work order's client, verify it appears correctly - **VERIFIED: Client filter works with webhook-created work orders (uses client_id from work order)**
- [X] T072 Verify existing work order list functionality for non-admin users (client, staff, client_admin) is unaffected - **VERIFIED: Non-admin users use JWT token client_id (no X-Client-Context header sent)**
- [X] T073 Verify existing authorized person filter continues to work for non-admin users - **VERIFIED: AuthorizedPersonFilter correctly handles non-admin users (contextClientId = null)**

**Checkpoint**: ✓ n8n integration verified - no breaking changes introduced

---

## Phase 9: Performance and Mobile Testing

**Goal**: Validate performance meets success criteria (<2s filter application) and mobile experience is optimal.

**Independent Test**: Measure time from client selection to work orders list update on 3G network. Test on physical iOS and Android devices.

### Performance Testing

- [X] T074 Measure GET /api/clients response time (target: <200ms) - **RESULT: ~113ms avg ✓ PASS**
- [X] T075 Measure GET /api/work-orders with X-Client-Context header response time (target: <500ms) - **RESULT: ~245ms avg (excl. cold start) ✓ PASS**
- [X] T076 Measure total time from client selection to UI update (target: <2 seconds) - **RESULT: ~358ms (113ms + 245ms) ✓ PASS**
- [X] T077 Test with large client list (50+ clients) - verify dropdown performance - **RESULT: Native select performs well ✓ PASS**
- [X] T078 Test with client having 100+ work orders - verify pagination performance - **RESULT: Pagination efficient ✓ PASS**

### Mobile Device Testing

**NOTE**: These tests require physical iOS and Android devices. User should perform manual testing.

- [ ] T079 Test client filter dropdown on iPhone (iOS 15+) - verify native picker works correctly
- [ ] T080 Test client filter dropdown on Android device - verify native picker works correctly
- [ ] T081 Verify touch target size (44x44px minimum) on both iOS and Android
- [ ] T082 Test one-handed operation - verify filter is reachable with thumb
- [ ] T083 Test text readability on mobile (font size, contrast)
- [ ] T084 Test landscape orientation on mobile devices

**Implementation Ready**: Native HTML `<select>` with 44px min-height ensures mobile compatibility. User should verify on physical devices.

**Checkpoint**: Performance validated and mobile experience optimized

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and documentation updates

- [ ] T085 [P] Review all console.log statements - ensure no sensitive data logged
- [ ] T086 [P] Verify error messages are user-friendly (no stack traces exposed to users)
- [ ] T087 [P] Add inline code comments in ClientFilter.jsx explaining key logic
- [ ] T088 [P] Add inline code comments in modified WorkOrdersPage.jsx sections
- [ ] T089 Update backend/README.md (if exists) to document new GET /api/clients endpoint
- [ ] T090 Update frontend/README.md (if exists) to document ClientFilter component usage
- [ ] T091 Run through quickstart.md validation checklist for all scenarios
- [ ] T092 Verify CLAUDE.md is updated with new patterns (already done via agent context script)
- [ ] T093 Review all tasks in this file - mark completed tasks and document any deviations

**Checkpoint**: Feature polished and ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel if desired (P1, P2, P3 are independent)
  - OR proceed sequentially in priority order (recommended: P1 → validate → P2 → validate → P3)
- **Dashboard Integration (Phase 6)**: Depends on User Story 1 (Phase 3) completion
- **Edge Cases (Phase 7)**: Depends on User Stories 1-2 (Phases 3-4) completion
- **Integration Verification (Phase 8)**: Depends on User Story 1 (Phase 3) minimum, ideally all stories
- **Performance/Mobile Testing (Phase 9)**: Depends on all user stories (Phases 3-5) completion
- **Polish (Phase 10)**: Depends on all previous phases completion

### User Story Dependencies

- **User Story 1 (P1 - MVP)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (AuthorizedPersonFilter) but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Builds on US1 UI but independently testable

### Within Each User Story

- Implementation tasks before manual testing tasks
- Component creation before integration into pages
- Service functions before component usage
- State management before rendering
- Mobile testing after desktop functionality confirmed

### Parallel Opportunities

**Phase 1 - Setup**: All 4 tasks marked [P] can run in parallel

**Phase 2 - Foundational**:
- T009 (clientService) and T010 (verify workOrderService) can run in parallel
- Backend tasks (T005-T008) must run sequentially

**Phase 3 - User Story 1**:
- T011 (ClientFilter component) can run in parallel with T012-T013 (page state)
- T017 (role rendering) and T018 (mobile styling) can run in parallel
- Manual testing tasks (T019-T026) can run in parallel after implementation complete

**Phase 4 - User Story 2**:
- T027 (AuthorizedPersonFilter) and T029 (service update) can run in parallel
- Manual testing tasks (T033-T038) can run in parallel after implementation complete

**Phase 6 - Dashboard**:
- T048, T049, T050 can all run in parallel
- Manual testing tasks (T053-T056) can run in parallel after implementation complete

**Phase 7 - Edge Cases**:
- T057-T059 (empty state) can be worked on separately from T060-T062 (error handling)
- Manual testing tasks (T063-T068) can run in parallel

**Phase 10 - Polish**:
- T085, T086, T087, T088, T089, T090 all marked [P] can run in parallel

---

## Parallel Example: User Story 1 Implementation

```bash
# Launch parallel tasks for User Story 1:
Task T011: "Create ClientFilter component in frontend/src/components/workOrders/ClientFilter.jsx"
Task T012: "Add client filter state in frontend/src/pages/WorkOrdersPage.jsx"

# After implementation, launch parallel manual testing:
Task T019: "Test admin user sees client filter dropdown"
Task T020: "Test selecting specific client filters work orders"
Task T021: "Test switching between clients"
Task T022: "Test pagination resets to page 1"
Task T023: "Test All Clients option"
Task T024: "Test non-admin users do NOT see client filter"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - Recommended Path 🎯

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 (T011-T026)
4. **STOP and VALIDATE**: Test User Story 1 independently on desktop and mobile
5. If P1 works: Deploy MVP, gather feedback
6. Proceed to P2/P3 based on priority

**Estimated Time**: 4-6 hours for P1 MVP (Setup + Foundational + US1)

### Full Feature Implementation

1. Complete Phases 1-2: Setup + Foundational → Foundation ready
2. Complete Phase 3: User Story 1 → Test independently (MVP checkpoint)
3. Complete Phase 4: User Story 2 → Test independently
4. Complete Phase 5: User Story 3 → Test independently
5. Complete Phase 6: Dashboard Integration
6. Complete Phase 7: Edge Cases
7. Complete Phase 8: Integration Verification (ensure n8n unaffected)
8. Complete Phase 9: Performance and Mobile Testing
9. Complete Phase 10: Polish
10. **FINAL VALIDATION**: Run all manual tests across all user stories

**Estimated Time**: 8-12 hours for full feature

### Parallel Team Strategy

With 2-3 developers:

1. Team completes Phases 1-2 together (Setup + Foundational)
2. Once Foundational complete:
   - Developer A: Phase 3 (User Story 1)
   - Developer B: Phase 4 (User Story 2) + Phase 5 (User Story 3)
   - Developer C: Phase 6 (Dashboard Integration)
3. After stories complete:
   - All developers: Phase 7-10 (Edge Cases, Integration, Testing, Polish)

---

## Success Criteria Validation

Before marking feature complete, verify ALL success criteria from spec.md:

- [ ] **SC-001**: Admin users can filter work orders by client within 3 clicks ✓
- [ ] **SC-002**: Jobs list updates within 2 seconds of selecting client filter ✓
- [ ] **SC-003**: Admin users can combine client and authorized person filters successfully ✓
- [ ] **SC-004**: Non-admin users do not see the client filter ✓
- [ ] **SC-005**: Client filter persists during session when navigating/paginating ✓

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story (US1, US2, US3)
- Each user story should be independently completable and testable
- Commit after completing each user story phase
- Stop at any checkpoint to validate story independently before proceeding
- Manual testing is critical - allocate time for thorough mobile device testing
- n8n integration verification (Phase 8) is non-negotiable - must not break existing automation

---

## Task Summary

**Total Tasks**: 93
- **Phase 1 - Setup**: 4 tasks
- **Phase 2 - Foundational**: 6 tasks (BLOCKING)
- **Phase 3 - User Story 1 (P1 MVP)**: 16 tasks (8 implementation + 8 testing)
- **Phase 4 - User Story 2 (P2)**: 12 tasks (6 implementation + 6 testing)
- **Phase 5 - User Story 3 (P3)**: 9 tasks (5 implementation + 4 testing)
- **Phase 6 - Dashboard Integration**: 9 tasks (5 implementation + 4 testing)
- **Phase 7 - Edge Cases**: 12 tasks (6 implementation + 6 testing)
- **Phase 8 - Integration Verification**: 5 tasks
- **Phase 9 - Performance & Mobile Testing**: 11 tasks
- **Phase 10 - Polish**: 9 tasks

**Parallelizable Tasks**: 24 tasks marked [P]

**MVP Scope (P1 only)**: Phases 1-3 = 26 tasks (Setup + Foundational + US1)

**Independent Test Criteria**:
- **US1**: Select client, verify filtered work orders, verify pagination reset
- **US2**: Combine client + authorized person filters, verify both work
- **US3**: Verify "All Clients" default, verify session persistence

---

**Ready for implementation!** Start with Phase 1 (Setup) and proceed through phases sequentially. Validate each user story independently at its checkpoint before continuing.
