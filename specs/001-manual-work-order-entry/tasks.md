# Tasks: Work Order Cancellation

**Input**: Design documents from `/specs/001-manual-work-order-entry/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this feature as the specification requests manual testing via Postman/curl for backend and browser testing for frontend.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions
- Web app structure: `backend/` and `frontend/` directories at repository root
- Backend: `backend/controllers/`, `backend/middleware/`, `backend/models/`
- Frontend: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [ ] T001 Verify project structure matches plan.md (backend/ and frontend/ directories)
- [ ] T002 Verify Node.js 18+ installed and dependencies current (package.json versions)
- [ ] T003 [P] Verify PostgreSQL database contains work_orders table with status ENUM including 'cancelled'
- [ ] T004 [P] Verify work_order_notes table exists for audit trail
- [ ] T005 Verify backend server starts successfully on port 5002
- [ ] T006 Verify frontend dev server starts successfully on port 5173

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Verify existing PATCH /api/work-orders/:id/status endpoint exists in backend/routes/workOrder.routes.js
- [ ] T008 Verify auth.middleware.js contains verifyToken and isAnyValidRole middleware
- [ ] T009 Verify workOrder.controller.js contains updateWorkOrderStatus function
- [ ] T010 Verify WorkOrder model in backend/models/workOrder.model.js includes is_urgent boolean field
- [ ] T011 Verify WorkOrderNote model in backend/models/workOrderNote.model.js for audit trail

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Work Order Manually (Priority: P1) 🎯 MVP

**Status**: ✅ COMPLETE (Implementation done 2025-10-17)

**Goal**: Enable tenancy managers (client_admin role) to manually create work orders with all required fields, auto-populated supplier/authorization details, and optional photo uploads

**Independent Test**: Log in as client_admin user, navigate to work order creation form, fill required fields (property name, property address, property phone, description, job number), verify supplier auto-fills to "Williams Property Service", verify authorized by auto-fills from user profile, submit form, verify work order appears in list with "manual" type

### Implementation for User Story 1

- [x] T012 [P] [US1] Create manual work order creation form component in frontend/src/components/workOrders/CreateWorkOrderForm.jsx
- [x] T013 [P] [US1] Add form validation for required fields (job_no, property_name, property_address, property_phone, description) in CreateWorkOrderForm.jsx
- [x] T014 [US1] Auto-populate supplier_name to "Williams Property Service" in CreateWorkOrderForm.jsx
- [x] T015 [US1] Auto-populate supplier_phone to "021 123 4567" and supplier_email to "info@williamspropertyservices.co.nz" in CreateWorkOrderForm.jsx
- [x] T016 [US1] Auto-populate authorized_by field from user.full_name in CreateWorkOrderForm.jsx
- [x] T017 [US1] Auto-populate authorized_contact field from user.phone (if available) in CreateWorkOrderForm.jsx
- [x] T018 [US1] Auto-populate authorized_email field from user.email in CreateWorkOrderForm.jsx
- [x] T019 [US1] Add photo upload interface with multiple file support in CreateWorkOrderForm.jsx
- [x] T020 [US1] Implement createWorkOrder API endpoint POST /api/work-orders in backend/controllers/workOrder.controller.js
- [x] T021 [US1] Add job number uniqueness validation in createWorkOrder controller
- [x] T022 [US1] Set work_order_type to "manual" and status to "pending" in createWorkOrder controller
- [x] T023 [US1] Set created_by to logged-in user ID in createWorkOrder controller
- [x] T024 [US1] Add route POST /api/work-orders with client_admin role check in backend/routes/workOrder.routes.js
- [x] T025 [US1] Send notifications to staff/admin/client users on work order creation in backend/controllers/workOrder.controller.js
- [x] T026 [US1] Add "Create Work Order" button to dashboard/work order list page in frontend/src/pages/WorkOrdersPage.jsx
- [x] T027 [US1] Add navigation to CreateWorkOrderForm from work order list page
- [x] T028 [US1] Display success message and redirect to work order detail page after creation
- [x] T029 [US1] Display validation errors for missing required fields in CreateWorkOrderForm.jsx

**Checkpoint**: ✅ User Story 1 complete - client_admin users can create manual work orders

---

## Phase 4: User Story 2 - Edit Work Order Fields (Priority: P2)

**Goal**: Enable tenancy managers to edit work order details after initial creation, adding missing information like PO numbers or updating descriptions, with audit trail tracking

**Independent Test**: Create a manual work order with minimal info, navigate to detail page, click "Edit", update optional fields (PO number, property phone), save changes, verify changes persist and audit trail note created

### Implementation for User Story 2

- [ ] T030 [P] [US2] Create edit work order form component in frontend/src/components/workOrders/EditWorkOrderForm.jsx
- [ ] T031 [US2] Pre-fill EditWorkOrderForm with current work order data from detail page
- [ ] T032 [US2] Allow editing of optional fields (PO number, property_phone, authorized_contact, description) in EditWorkOrderForm.jsx
- [ ] T033 [US2] Prevent editing of email metadata fields (email_subject, email_sender, email_received_date) in EditWorkOrderForm.jsx
- [ ] T034 [US2] Implement updateWorkOrder API endpoint PATCH /api/work-orders/:id in backend/controllers/workOrder.controller.js
- [ ] T035 [US2] Create audit trail note documenting changes in updateWorkOrder controller using WorkOrderNote.create()
- [ ] T036 [US2] Add route PATCH /api/work-orders/:id with client_admin role check in backend/routes/workOrder.routes.js
- [ ] T037 [US2] Add "Edit" button to work order detail page in frontend/src/components/workOrders/WorkOrderSummary.jsx
- [ ] T038 [US2] Display success message after edit and refresh detail view
- [ ] T039 [US2] Display audit trail notes showing edit history in work order timeline

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can create and edit work orders

---

## Phase 5: User Story 3 - Mark Work Order as Urgent (Priority: P2)

**Status**: ⚠️ PARTIALLY COMPLETE (Filter UI completed, toggle functionality pending)

**Goal**: Allow clients/client_admins to mark work orders as urgent during creation, display urgent badge in list views, enable staff/admin to toggle urgency on detail pages with audit trail

**Independent Test**: Create work order with urgent checkbox enabled, verify urgent badge appears in list view, verify urgent filter works, as staff/admin toggle urgent status on detail page, verify audit trail note created

### Implementation for User Story 3

- [ ] T040 [P] [US3] Add urgent checkbox/toggle to CreateWorkOrderForm.jsx for client and client_admin roles
- [ ] T041 [P] [US3] Set is_urgent field to checkbox value in createWorkOrder API call from CreateWorkOrderForm.jsx
- [ ] T042 [US3] Update createWorkOrder controller to accept is_urgent field and default to false in backend/controllers/workOrder.controller.js
- [ ] T043 [US3] Add urgent badge display component in frontend/src/components/workOrders/UrgentBadge.jsx
- [ ] T044 [US3] Display UrgentBadge in work order list items when is_urgent is true in frontend/src/components/workOrders/WorkOrderCard.jsx
- [x] T045 [US3] Add urgent filter option to FilterBar in frontend/src/components/workOrders/FilterBar.jsx (✅ Completed in previous session)
- [x] T046 [US3] Update backend getAllWorkOrders to filter by is_urgent when status='urgent' in backend/controllers/workOrder.controller.js (✅ Completed in previous session)
- [ ] T047 [US3] Sort urgent work orders before non-urgent within same status in getAllWorkOrders controller
- [ ] T048 [US3] Add urgent toggle control for staff/admin roles on detail page in frontend/src/components/workOrders/WorkOrderSummary.jsx
- [ ] T049 [US3] Display urgent status as read-only badge for client/client_admin roles on detail page in WorkOrderSummary.jsx
- [ ] T050 [US3] Implement updateUrgentStatus API endpoint PATCH /api/work-orders/:id/urgent in backend/controllers/workOrder.controller.js
- [ ] T051 [US3] Create audit trail note when urgent flag changed ("Marked as urgent by [Name]" or "Removed urgent flag by [Name]") in updateUrgentStatus controller
- [ ] T052 [US3] Add route PATCH /api/work-orders/:id/urgent with staff/admin role check in backend/routes/workOrder.routes.js
- [ ] T053 [US3] Handle urgent toggle change event in WorkOrderSummary.jsx with immediate state update
- [ ] T054 [US3] Display urgent audit trail notes in work order timeline

**Checkpoint**: All user stories (1, 2, 3) should now be independently functional - urgent flag management complete

---

## Phase 6: User Story 4 - Attach Property Details with Autocomplete (Priority: P3)

**Goal**: Provide property name autocomplete suggesting previously used properties, auto-fill associated property details when selected, maintain ability to enter new properties

**Independent Test**: Start typing property name in creation form, verify suggestions appear from existing work orders, select suggestion, verify property address and phone auto-fill, test entering new property name not in suggestions works

### Implementation for User Story 4

- [ ] T055 [P] [US4] Create getPropertySuggestions API endpoint GET /api/work-orders/suggestions/properties in backend/controllers/workOrder.controller.js
- [ ] T056 [P] [US4] Query distinct property names, addresses, phones from existing work orders in getPropertySuggestions controller
- [ ] T057 [US4] Add route GET /api/work-orders/suggestions/properties in backend/routes/workOrder.routes.js
- [ ] T058 [US4] Add autocomplete input component for property_name in CreateWorkOrderForm.jsx
- [ ] T059 [US4] Fetch property suggestions from API on property_name input change
- [ ] T060 [US4] Display property suggestions dropdown below property_name input
- [ ] T061 [US4] Auto-fill property_address and property_phone when suggestion selected
- [ ] T062 [US4] Allow manual entry of new property details if no suggestion selected
- [ ] T063 [US4] Verify supplier remains "Williams Property Service" (no autocomplete needed per spec assumption 8)

**Checkpoint**: All user stories (1, 2, 3, 4) complete - autocomplete enhances data entry

---

## Phase 7: User Story 5 - Cancel Work Order (Priority: P2) 🎯 CURRENT FOCUS

**Goal**: Enable client, client_admin, and admin users to cancel work orders via detail page with confirmation dialog, create audit trail, prevent reactivation, exclude staff from cancellation permissions

**Independent Test**: Navigate to work order detail page as client_admin, click "Cancel" button or select cancelled from status dropdown, confirm cancellation dialog, verify status changes to "cancelled", verify audit trail note created, verify staff user cannot cancel

### Implementation for User Story 5

- [x] T064 [P] [US5] Update handleWorkOrderStatusUpdate middleware to reject staff cancellations in backend/middleware/auth.middleware.js
- [x] T065 [P] [US5] Add 403 error response for staff users attempting cancellation in auth.middleware.js
- [x] T066 [US5] Update updateWorkOrderStatus controller to prevent reactivation of cancelled work orders in backend/controllers/workOrder.controller.js
- [x] T067 [US5] Add 400 error response "Cancelled work orders cannot be reactivated" in updateWorkOrderStatus controller
- [x] T068 [US5] Create audit trail note on cancellation "Work order cancelled by [User Full Name]" in updateWorkOrderStatus controller
- [x] T069 [P] [US5] Create ConfirmCancelDialog component with React portals in frontend/src/components/workOrders/ConfirmCancelDialog.jsx
- [x] T070 [US5] Add confirmation dialog UI with "Are you sure?" message and Yes/No buttons in ConfirmCancelDialog.jsx
- [x] T071 [US5] Style ConfirmCancelDialog with NextGen WOM colors (deep-navy header, red cancel button, 44px+ touch targets)
- [x] T072 [US5] Add cancel button to WorkOrderSummary.jsx for client, client_admin, admin roles only
- [x] T073 [US5] Hide/disable cancel button for staff users in WorkOrderSummary.jsx
- [x] T074 [US5] Add handleCancelClick function to show ConfirmCancelDialog in WorkOrderSummary.jsx
- [x] T075 [US5] Add handleConfirmCancel function to call updateWorkOrderStatus API with status='cancelled' in WorkOrderSummary.jsx
- [x] T076 [US5] Update work order state to 'cancelled' on successful API response in WorkOrderSummary.jsx
- [x] T077 [US5] Close ConfirmCancelDialog and show success toast on cancellation
- [x] T078 [US5] Display "Cancelled (Permanent)" badge when work order status is cancelled in WorkOrderSummary.jsx
- [x] T079 [US5] Verify cancelled filter in FilterBar.jsx displays only cancelled work orders (✅ Filter already exists from previous implementation)
- [x] T080 [US5] Verify cancelled work orders appear in dashboard summary statistics with dedicated count
- [x] T081 [US5] Add error handling for 400 (reactivation attempt) and 403 (staff permission denied) in WorkOrderSummary.jsx
- [x] T082 [US5] Display error toast for reactivation attempts and permission denied errors

**Checkpoint**: All user stories complete - cancellation feature fully functional with confirmation, audit trail, and role restrictions

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and finalize the feature

- [ ] T083 [P] Update frontend/package.json version to 2.8.0
- [ ] T084 [P] Update backend/package.json version to 2.8.0
- [ ] T085 Create release notes entry for version 2.8.0 in frontend/src/pages/ReleaseNotesPage.jsx
- [ ] T086 Create release-notes/release-2.8.0-summary.md with cancellation feature details
- [ ] T087 Verify mobile responsiveness of CreateWorkOrderForm on Chrome/Safari mobile
- [ ] T088 Verify mobile responsiveness of ConfirmCancelDialog on Chrome/Safari mobile (44px+ touch targets)
- [ ] T089 Verify urgent badge visibility on mobile devices
- [ ] T090 Test complete user journey: create work order → mark urgent → edit details → cancel with confirmation
- [ ] T091 Test role-based permissions: client (authorized_email match), client_admin (all for client), staff (no cancel), admin (all)
- [ ] T092 Verify audit trail notes appear in timeline for all operations (create, edit, urgent toggle, cancel)
- [ ] T093 Verify dashboard statistics update correctly with cancelled count
- [ ] T094 Verify performance: status update < 500ms, confirmation dialog render < 100ms, audit trail visible < 2s
- [ ] T095 Run manual tests from quickstart.md cancellation checklist
- [ ] T096 Test error scenarios: duplicate job number, missing required fields, reactivation attempt, staff cancellation attempt
- [ ] T097 Verify n8n webhook integration still works (no disruption to automated work orders)
- [ ] T098 Code review and cleanup across all modified files
- [ ] T099 Update .github/copilot-instructions.md if cancellation patterns need documentation
- [ ] T100 Final validation: All 5 user stories work independently and together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US3 (P2) → US5 (P2) → US2 (P2) → US4 (P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Create Work Order**: ✅ COMPLETE - No dependencies on other stories (MVP delivered)
- **User Story 2 (P2) - Edit Work Order**: Depends on US1 for work order creation, but edit functionality is independent
- **User Story 3 (P2) - Mark as Urgent**: Depends on US1 for work order creation (urgent flag on creation form), extends detail page
- **User Story 4 (P3) - Autocomplete**: Depends on US1 for property data, but autocomplete is independent enhancement
- **User Story 5 (P2) - Cancel Work Order**: Can start after Foundational - Uses existing status update infrastructure ✅ **CURRENT PRIORITY**

### Suggested Implementation Order

**Current State**:
- ✅ Phase 1: Setup → Phase 2: Foundational → COMPLETE
- ✅ Phase 3: User Story 1 (Create Work Order) → COMPLETE (2025-10-17)
- ⚠️ Phase 5: User Story 3 (Urgent) → PARTIALLY COMPLETE (filter integration done)
- **→ Phase 7: User Story 5 (Cancel Work Order)** ← **IMPLEMENT NEXT (19 tasks)**

**Recommended Next Steps**:
1. Complete Phase 7: User Story 5 (Cancellation) → Test independently → Deploy v2.8.0
2. Complete Phase 5: User Story 3 (Urgent toggle) → Test independently → Deploy v2.9.0
3. Complete Phase 4: User Story 2 (Edit) → Test independently → Deploy v2.10.0
4. Complete Phase 6: User Story 4 (Autocomplete) → Test independently → Deploy v2.11.0
5. Phase 8: Polish and final validation

**Parallel Team Strategy**:
1. Team completes Setup + Foundational together ✅ DONE
2. Once Foundational is done:
   - Developer A: User Story 1 (Create) ✅ DONE + User Story 2 (Edit) ⏳ TODO
   - Developer B: User Story 5 (Cancel) ⏳ **START HERE** + User Story 3 (Urgent) ⏳ FINISH
   - Developer C: User Story 4 (Autocomplete) ⏳ TODO
3. Converge on Phase 8: Polish together

### Within Each User Story

- Backend API endpoints before frontend components
- Form components before page integration
- Core functionality before error handling
- Validation before notifications
- Story complete and tested before moving to next priority

### Parallel Opportunities

- **Phase 1**: T003 and T004 (database verification) can run in parallel with T002 (dependency check)
- **Phase 2**: All verification tasks (T007-T011) can run in parallel
- **User Story 2**: T030 (edit form) and T034 (API endpoint) can start in parallel
- **User Story 3**: T040 (urgent checkbox) and T043 (urgent badge) can run in parallel
- **User Story 4**: T055, T056 (API suggestions) and T058 (autocomplete input) can start in parallel
- **User Story 5**: T064-T068 (backend changes) and T069-T071 (dialog component) can run in parallel
- **Phase 8**: T083 and T084 (version bumps) can run in parallel

---

## Parallel Example: User Story 5 (Cancellation)

```bash
# Launch backend and frontend tasks in parallel:

# Backend Team:
Task: "T064 [P] [US5] Update handleWorkOrderStatusUpdate middleware in backend/middleware/auth.middleware.js"
Task: "T066 [US5] Update updateWorkOrderStatus controller in backend/controllers/workOrder.controller.js"

# Frontend Team (can start at same time):
Task: "T069 [P] [US5] Create ConfirmCancelDialog component in frontend/src/components/workOrders/ConfirmCancelDialog.jsx"
Task: "T072 [P] [US5] Add cancel button to WorkOrderSummary.jsx"

# After both complete:
Task: "T075 [US5] Add handleConfirmCancel function connecting dialog to API"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. ✅ Complete Phase 3: User Story 1 (Create Work Order)
4. ✅ **VALIDATED**: Tested User Story 1 independently
5. ✅ Deployed manual work order creation (MVP delivered 2025-10-17!)

### Current Priority (Cancellation Feature - v2.8.0)

Since User Story 1 is already implemented, the immediate focus is:

1. ✅ Setup + Foundational already complete
2. ✅ User Story 1 (Create Work Order) already implemented
3. **→ Phase 7: User Story 5 (Cancel Work Order)** ← **START HERE (T064-T082)**
4. Test cancellation independently (detail page → confirm dialog → status updated → audit trail)
5. Deploy v2.8.0 with cancellation feature

### Incremental Delivery

1. Setup + Foundational → Foundation ready ✅
2. Add User Story 1 → Test independently → Deploy/Demo ✅ (MVP complete - v2.7.0)
3. **Add User Story 5 → Test independently → Deploy/Demo** ← **NEXT (v2.8.0 - Cancellation)**
4. Add User Story 3 → Test independently → Deploy/Demo (v2.9.0 - Urgent flag)
5. Add User Story 2 → Test independently → Deploy/Demo (v2.10.0 - Editing)
6. Add User Story 4 → Test independently → Deploy/Demo (v2.11.0 - Autocomplete)
7. Each story adds value without breaking previous stories

---

## Manual Testing Checklist (From quickstart.md)

### User Story 5 (Cancellation) - Required Tests

- [ ] Client user can cancel their own work order (authorized_email match)
- [ ] Client_admin can cancel any work order for their client
- [ ] Admin can cancel any work order
- [ ] **Staff user receives 403 error when attempting cancellation**
- [ ] Confirmation dialog appears on cancel button click
- [ ] Cancellation creates audit trail note with user's name
- [ ] Cancelled work orders show "Cancelled (Permanent)" badge
- [ ] **Cancelled work orders cannot be reactivated (400 error)**
- [ ] Mobile: Touch targets are 44px minimum
- [ ] Mobile: Dialog is responsive and readable
- [ ] Cancelled filter works in work order list

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Manual testing required (no automated tests requested in spec)
- Focus on mobile-first design (44px+ touch targets, responsive dialogs)
- Maintain backward compatibility with n8n webhook integration
- All role-based permissions enforced in middleware
- Performance targets: API < 500ms, UI < 100ms, audit trail < 2s

---

## Task Count Summary

- **Total Tasks**: 100
- **Phase 1 (Setup)**: 6 tasks ✅ (assumed complete)
- **Phase 2 (Foundational)**: 5 tasks ✅ (assumed complete)
- **Phase 3 (US1 - Create)**: 18 tasks ✅ (complete 2025-10-17)
- **Phase 4 (US2 - Edit)**: 10 tasks ⏳ (pending)
- **Phase 5 (US3 - Urgent)**: 15 tasks ⚠️ (2/15 complete - filter integration done)
- **Phase 6 (US4 - Autocomplete)**: 9 tasks ⏳ (pending)
- **Phase 7 (US5 - Cancel)**: 19 tasks ⏳ ← **CURRENT FOCUS (T064-T082)**
- **Phase 8 (Polish)**: 18 tasks ⏳ (pending)

**Parallel Opportunities Identified**: 25 tasks marked [P] can run in parallel within their phase

**Independent Test Criteria**: Each user story has clear test criteria in the checkpoint sections

**MVP Delivered**: ✅ User Story 1 complete (v2.7.0)

**Current Priority**: User Story 5 (Cancellation) - 19 tasks starting from T064

**Estimated Time for US5**: 4-6 hours (backend 2h, frontend 2-3h, testing 1h)
