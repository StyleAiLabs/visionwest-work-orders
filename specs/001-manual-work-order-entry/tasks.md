# Implementation Tasks: Manual Work Order Entry

**Feature**: Manual Work Order Entry
**Branch**: `001-manual-work-order-entry`
**Generated**: 2025-10-16
**Status**: Ready for Implementation

## Task Overview

This document breaks down the implementation of manual work order entry into actionable tasks organized by phase and user story. Tasks are marked with:
- **Priority**: P1 (MVP), P2 (Post-MVP), P3 (Enhancement)
- **User Story**: US#1 (Create), US#2 (Edit), US#3 (Autocomplete)
- **Task ID**: T### for tracking and cross-referencing

## Task Statistics

- **Total Tasks**: 39
- **P1 (MVP)**: 24 tasks
- **P2 (Post-MVP)**: 9 tasks
- **P3 (Enhancement)**: 6 tasks
- **Estimated Total Time**: 12-15 hours

## Implementation Status

### ✅ P1 MVP (COMPLETE)
**Status**: Implementation complete, manual testing pending
**Completed**: 2025-10-17

**What's Done:**
- ✅ Phase 0: Environment setup (T001-T008)
- ✅ Phase 1: Backend API for manual work order creation (T010-T025)
  - Email notification service with nodemailer
  - Role-based access control (client_admin only)
  - Validation and error handling
- ✅ Phase 2: Frontend form and UI (T026-T045)
  - Mobile-first WorkOrderForm component with React Hook Form
  - CreateWorkOrder page with success/error handling
  - FAB (Floating Action Button) for client_admin users
  - Routing integration

**Manual Testing Required** (T046-T052):
- Form validation behavior
- Work order creation end-to-end
- FAB visibility for client_admin role
- Mobile responsiveness (320px-414px breakpoints)
- Touch target accessibility (44x44px minimum)

**Integration Testing Pending** (T088-T096):
- n8n webhook compatibility
- Manual + email work orders in same list
- Mobile device testing (iOS/Android)
- PWA offline caching

**Servers Running:**
- Backend: http://localhost:5002
- Frontend: http://localhost:5174

### 📋 P2 Edit Work Order (BACKLOG)
**Status**: Deferred to post-MVP
**Tasks**: T053-T070 (Phase 3)
**Features**:
- Edit existing work order details
- Audit trail via system-generated notes
- Field change tracking

### 📋 P3 Autocomplete (BACKLOG)
**Status**: Deferred to post-MVP
**Tasks**: T071-T087 (Phase 4)
**Features**:
- Property name autocomplete with address/phone auto-fill
- Supplier name autocomplete with email/phone auto-fill
- Debounced API calls for performance

## Phase 0: Setup & Prerequisites

**Goal**: Ensure development environment is ready and all prerequisites are met.

### Environment Setup

- [X] T001 [P1] Checkout feature branch `001-manual-work-order-entry`
- [X] T002 [P1] Install backend dependencies: `cd backend && npm install`
- [X] T003 [P1] Install nodemailer for email notifications: `cd backend && npm install nodemailer`
- [X] T004 [P1] Install frontend dependencies: `cd frontend && npm install`
- [X] T005 [P1] Start backend dev server: `cd backend && npm run dev` (port 5002)
- [X] T006 [P1] Start frontend dev server: `cd frontend && npm run dev` (port 5174)
- [X] T007 [P1] Verify database connection and existing work_order_type field

### Configuration

- [X] T008 [P1] Add email environment variables to `backend/.env`: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_NOTIFICATION_RECIPIENT=mark@williamspropertyservices.co.nz
- [ ] T009 [P1] (Optional) Add database index on `work_order_type` for query performance

## Phase 1: Backend Foundation (P1 - Create Work Order)

**Goal**: Implement backend API for manual work order creation with email notifications.

**Estimated Time**: 2-3 hours

### Backend Middleware

- [X] T010 [P1] [US#1] Verify or create `isClientAdmin` middleware in `backend/middleware/auth.middleware.js` that checks `req.userRole === 'client_admin'` and returns 403 if unauthorized

### Backend Email Service

- [X] T011 [P1] [US#1] Create email service utility at `backend/utils/emailService.js`
- [X] T012 [P1] [US#1] Implement `sendWorkOrderCreatedEmail(workOrder, createdBy)` function using nodemailer with email template containing job_no, property_name, supplier_name, description, created_by details
- [X] T013 [P1] [US#1] Configure nodemailer transporter with SMTP settings from environment variables
- [X] T014 [P1] [US#1] Add error handling for email failures (log error but don't throw exception)

### Backend Controller (Create)

- [X] T015 [P1] [US#1] Create or update `backend/controllers/workOrder.controller.js`
- [X] T016 [P1] [US#1] Implement `createManualWorkOrder` controller function:
  - Validate required fields: job_no, supplier_name, property_name, description
  - Check for duplicate job_no
  - Create work order with work_order_type='manual', created_by=req.userId, status='pending'
  - Default date to current date if not provided
  - Save to database
  - Trigger in-app notifications (reuse existing notification helper)
  - Call email service asynchronously (non-blocking)
  - Return success response with work order ID
- [X] T017 [P1] [US#1] Add validation for optional email fields (supplier_email, authorized_email must be valid email format)
- [X] T018 [P1] [US#1] Handle database errors and return appropriate 500 error responses

### Backend Routes (Create)

- [X] T019 [P1] [US#1] Add POST route in `backend/routes/workOrder.routes.js`: `router.post('/', verifyToken, isClientAdmin, workOrderController.createManualWorkOrder)`
- [X] T020 [P1] [US#1] Ensure route is registered in Express app before webhook routes (to avoid path conflicts)

### Backend Testing (Create)

- [X] T021 [P1] [US#1] Test POST /api/work-orders with all required fields using curl/Postman
- [X] T022 [P1] [US#1] Test validation errors (missing fields, duplicate job_no, invalid email format)
- [X] T023 [P1] [US#1] Test role authorization (403 for non-client_admin users)
- [⚠️] T024 [P1] [US#1] Verify email sent to mark@williamspropertyservices.co.nz with correct work order details (Email attempted but failed due to placeholder SMTP credentials - requires real Gmail credentials in production)
- [X] T025 [P1] [US#1] Verify in-app notifications sent to staff/admin/client users

## Phase 2: Frontend Foundation (P1 - Create Work Order)

**Goal**: Build mobile-first React form for manual work order creation.

**Estimated Time**: 3-4 hours

### Frontend Service Layer

- [X] T026 [P1] [US#1] Create or update `frontend/src/services/workOrderService.js`
- [X] T027 [P1] [US#1] Implement `createWorkOrder(formData)` function that POSTs to /api/work-orders with JWT authentication

### Frontend Form Component

- [X] T028 [P1] [US#1] Create reusable `frontend/src/components/WorkOrderForm.jsx` component
- [X] T029 [P1] [US#1] Implement React Hook Form for form state management and validation
- [X] T030 [P1] [US#1] Add controlled inputs for required fields: job_no, supplier_name, property_name, description
- [X] T031 [P1] [US#1] Add controlled inputs for optional fields: date, supplier_phone, supplier_email, property_address, property_phone, po_number, authorized_by, authorized_contact, authorized_email
- [X] T032 [P1] [US#1] Apply Tailwind CSS mobile-first styling with minimum 44x44px touch targets (h-11 class)
- [X] T033 [P1] [US#1] Implement field-level validation with immediate error feedback
- [X] T034 [P1] [US#1] Add focus states for accessibility: focus:ring-2 focus:border-blue-500

### Frontend Create Page

- [X] T035 [P1] [US#1] Create `frontend/src/pages/CreateWorkOrder.jsx` page component
- [X] T036 [P1] [US#1] Import and render WorkOrderForm component
- [X] T037 [P1] [US#1] Implement form submission handler that calls workOrderService.createWorkOrder
- [X] T038 [P1] [US#1] Display success message on successful creation
- [X] T039 [P1] [US#1] Navigate back to work order list on success using React Router
- [X] T040 [P1] [US#1] Display error messages for failed submissions

### Frontend Routing & Navigation

- [X] T041 [P1] [US#1] Add route in `frontend/src/App.jsx`: `<Route path="/work-orders/create" element={<CreateWorkOrder />} />`
- [X] T042 [P1] [US#1] Update `frontend/src/pages/WorkOrderList.jsx` to add floating action button (FAB) for client_admin users only
- [X] T043 [P1] [US#1] Style FAB with Tailwind: `fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg`
- [X] T044 [P1] [US#1] Add PlusIcon or similar icon to FAB button
- [X] T045 [P1] [US#1] Link FAB to `/work-orders/create` route

### Frontend Testing (Create)

- [MANUAL] T046 [P1] [US#1] Test form validation displays errors for missing required fields
- [MANUAL] T047 [P1] [US#1] Test form submission creates work order successfully
- [MANUAL] T048 [P1] [US#1] Test success message displays after creation
- [MANUAL] T049 [P1] [US#1] Test work order appears in list immediately after creation
- [MANUAL] T050 [P1] [US#1] Test FAB button only visible to client_admin users
- [MANUAL] T051 [P1] [US#1] Test mobile responsiveness at 320px, 375px, 390px, 414px breakpoints
- [MANUAL] T052 [P1] [US#1] Test touch targets meet 44x44px minimum on actual mobile device

## Phase 3: Edit Work Order (P2)

**Goal**: Allow tenancy managers to edit work order details with audit trail.

**Estimated Time**: 2-3 hours

### Backend Controller (Edit)

- [ ] T053 [P2] [US#2] Add `editWorkOrder` controller function in `backend/controllers/workOrder.controller.js`:
  - Verify client_admin role
  - Fetch existing work order by ID
  - Return 404 if not found
  - Compare old vs new values to determine changed fields
  - Update only fields included in request body
  - Create system note: "Work order updated by [user.full_name]. Changed: [field_list]"
  - Save changes and note to database
  - Trigger update notifications
  - Return success response with updated_fields array
- [ ] T054 [P2] [US#2] Add validation to preserve email metadata fields (email_subject, email_sender, email_received_date) - silently ignore if client attempts to edit

### Backend Routes (Edit)

- [ ] T055 [P2] [US#2] Add PUT route in `backend/routes/workOrder.routes.js`: `router.put('/:id', verifyToken, isClientAdmin, workOrderController.editWorkOrder)`

### Backend Testing (Edit)

- [ ] T056 [P2] [US#2] Test PUT /api/work-orders/:id with partial updates
- [ ] T057 [P2] [US#2] Verify audit trail note created with correct field list
- [ ] T058 [P2] [US#2] Test 404 response for non-existent work order ID
- [ ] T059 [P2] [US#2] Verify email metadata fields cannot be modified

### Frontend Edit Page

- [ ] T060 [P2] [US#2] Create `frontend/src/pages/EditWorkOrder.jsx` page component
- [ ] T061 [P2] [US#2] Fetch existing work order data using work order ID from route params
- [ ] T062 [P2] [US#2] Render WorkOrderForm component pre-populated with existing data
- [ ] T063 [P2] [US#2] Implement `editWorkOrder(workOrderId, updates)` function in `frontend/src/services/workOrderService.js`
- [ ] T064 [P2] [US#2] Handle form submission to update work order via PUT request
- [ ] T065 [P2] [US#2] Display success message and navigate back to work order detail page

### Frontend Routing & Navigation (Edit)

- [ ] T066 [P2] [US#2] Add route in `frontend/src/App.jsx`: `<Route path="/work-orders/:id/edit" element={<EditWorkOrder />} />`
- [ ] T067 [P2] [US#2] Add "Edit" button on work order detail page (visible to client_admin only)

### Frontend Testing (Edit)

- [ ] T068 [P2] [US#2] Test edit form pre-populates with existing data
- [ ] T069 [P2] [US#2] Test partial updates save successfully
- [ ] T070 [P2] [US#2] Test audit trail note appears in work order detail view

## Phase 4: Autocomplete Suggestions (P3)

**Goal**: Provide autocomplete for property and supplier names to reduce data entry errors.

**Estimated Time**: 3-4 hours

### Backend Controller (Autocomplete)

- [ ] T071 [P3] [US#3] Add `getSuggestions` controller function in `backend/controllers/workOrder.controller.js`:
  - Validate query parameters: type (property/supplier), q (min 2 chars), limit (default 10, max 50)
  - Return 400 if invalid parameters
  - Query database for distinct property_name or supplier_name matching query (case-insensitive, partial match)
  - Group by name with associated details (address, phone, email)
  - Order by match_count DESC (frequency of use)
  - Return suggestions array with match counts

### Backend Routes (Autocomplete)

- [ ] T072 [P3] [US#3] Add GET route in `backend/routes/workOrder.routes.js`: `router.get('/suggestions', verifyToken, workOrderController.getSuggestions)`
- [ ] T073 [P3] [US#3] Ensure route is defined BEFORE `/:id` route to avoid path conflicts

### Backend Testing (Autocomplete)

- [ ] T074 [P3] [US#3] Test GET /api/work-orders/suggestions?type=property&q=sunset returns property suggestions
- [ ] T075 [P3] [US#3] Test GET /api/work-orders/suggestions?type=supplier&q=abc returns supplier suggestions
- [ ] T076 [P3] [US#3] Test validation errors for missing/invalid parameters

### Frontend Autocomplete UI

- [ ] T077 [P3] [US#3] Add debounced input handler (300ms delay) to WorkOrderForm component for property_name field
- [ ] T078 [P3] [US#3] Implement `fetchSuggestions(type, query)` function in `frontend/src/services/workOrderService.js`
- [ ] T079 [P3] [US#3] Add dropdown UI below property_name input to display suggestions
- [ ] T080 [P3] [US#3] Implement suggestion selection handler that auto-fills property_address and property_phone
- [ ] T081 [P3] [US#3] Repeat autocomplete implementation for supplier_name field (auto-fill supplier_phone and supplier_email)
- [ ] T082 [P3] [US#3] Add keyboard navigation support (arrow keys, enter to select, escape to close)
- [ ] T083 [P3] [US#3] Style dropdown with Tailwind CSS for mobile-friendly touch targets

### Frontend Testing (Autocomplete)

- [ ] T084 [P3] [US#3] Test autocomplete displays suggestions after typing 2+ characters
- [ ] T085 [P3] [US#3] Test suggestion selection auto-fills related fields
- [ ] T086 [P3] [US#3] Test free text entry still works if no suggestions match
- [ ] T087 [P3] [US#3] Test debouncing reduces API calls during rapid typing

## Phase 5: Integration & Polish

**Goal**: Ensure feature works end-to-end and doesn't break existing functionality.

**Estimated Time**: 1-2 hours

### Integration Testing

- [ ] T088 [P1] Verify n8n webhook still creates work orders successfully (POST /api/webhook/work-orders unchanged)
- [ ] T089 [P1] Verify manual and email work orders appear together in work order list
- [ ] T090 [P1] Verify work_order_type filter works correctly (if implemented in UI)
- [ ] T091 [P1] Test creating work order on 3G connection (mobile performance)
- [ ] T092 [P1] Test offline PWA caching of form page (should load offline)

### Mobile Device Testing

- [ ] T093 [P1] Test form on actual iOS device (iPhone)
- [ ] T094 [P1] Test form on actual Android device
- [ ] T095 [P1] Verify responsive breakpoints work correctly
- [ ] T096 [P1] Verify touch targets meet accessibility standards

### Documentation & Cleanup

- [ ] T097 [P1] Review quickstart.md and ensure all implementation steps are accurate
- [ ] T098 [P1] Update CLAUDE.md if any new architectural decisions were made
- [ ] T099 [P1] Remove any debug console.log statements from code

## Dependency Graph & Parallel Execution Opportunities

### Critical Path (Sequential Dependencies)

```
Phase 0 (T001-T009) → Phase 1 Backend (T010-T025) → Phase 2 Frontend (T026-T052)
                                                      ↓
Phase 3 Backend (T053-T059) → Phase 3 Frontend (T060-T070)
                                                      ↓
Phase 4 Backend (T071-T076) → Phase 4 Frontend (T077-T087)
                                                      ↓
Phase 5 Integration & Polish (T088-T099)
```

### Parallel Execution Opportunities

**After Phase 0 Setup**:
- Backend tasks (T010-T025) and Frontend service setup (T026-T027) can run in parallel
- Email service (T011-T014) can be developed independently from controller logic (T015-T018)

**After Phase 1 Backend Complete**:
- Frontend form component (T028-T034) and frontend page (T035-T040) can be developed in parallel
- Frontend routing (T041-T045) can be done while testing backend (T021-T025)

**After P1 MVP Complete**:
- Phase 3 (Edit) and Phase 4 (Autocomplete) are independent and can be developed in parallel if resources allow

**Testing Tasks**:
- Backend testing (T021-T025) can run while frontend is being developed
- Frontend testing (T046-T052) can run while Phase 3 backend is being developed

### Recommended Implementation Order

1. **Sprint 1 (P1 MVP)**: T001-T052 (Backend + Frontend for Create Work Order)
2. **Sprint 2 (P2)**: T053-T070 (Edit Work Order)
3. **Sprint 3 (P3)**: T071-T087 (Autocomplete)
4. **Sprint 4 (Polish)**: T088-T099 (Integration Testing & Mobile Validation)

## Success Validation

After completing all tasks, verify:

- [ ] ✅ Tenancy managers can create work orders in under 3 minutes (SC-001)
- [ ] ✅ 95% validation pass rate on first submission (SC-002)
- [ ] ✅ Work orders appear in dashboard within 5 seconds (SC-003)
- [ ] ✅ Notifications delivered within 10 seconds (SC-004)
- [ ] ✅ n8n webhook workflow continues to function (SC-005)
- [ ] ✅ Edit changes visible immediately (SC-006)
- [ ] ✅ Email notification sent to mark@williamspropertyservices.co.nz for every new manual work order

## Notes

- **Email Notifications**: Every manual work order creation (P1) triggers an email to mark@williamspropertyservices.co.nz. This is non-blocking and failures are logged but don't prevent work order creation.
- **Mobile Testing**: Constitution Principle I requires testing on actual physical devices, not just browser devtools.
- **Breaking Changes**: No changes to existing webhook endpoints per Constitution Principle III.
- **Role Mapping**: Tenancy manager role maps to existing `client_admin` role per FR-014.
