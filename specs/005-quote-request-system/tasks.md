# Tasks: Quote Request System

**Feature ID**: 005-quote-request-system
**Input**: Design documents from `/specs/005-quote-request-system/`
**Prerequisites**: plan.md ✅, spec.md ✅
**Tests**: Tests are OPTIONAL per template - Not included unless explicitly requested

**Organization**: Tasks are grouped by user story (Epic) to enable independent implementation and testing of each increment.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1.1, US2.1, etc.)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/models/`, `backend/controllers/`, `backend/routes/`, `backend/services/`, `backend/middleware/`
- **Frontend**: `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/services/`
- **Database**: `backend/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, models, and basic quote infrastructure

- [X] T001 Create quotes table migration with fields: id, quote_number, client_id, status, property_name, property_address, property_phone, title, description, scope_of_work, contact_person, contact_email, contact_phone, is_urgent, required_by_date, estimated_cost, estimated_hours, quote_notes, quote_valid_until, quoted_at, approved_at, declined_at, converted_at, converted_to_work_order_id, created_by, created_at, updated_at, submitted_at in backend/migrations/20251102000001-create-quotes-table.js
- [X] T002 Create quote_messages table migration with fields: id, quote_id, user_id, message_type, message, previous_cost, new_cost, previous_hours, new_hours, created_at in backend/migrations/20251102000002-create-quote-messages-table.js
- [X] T003 Create quote_attachments table migration with fields: id, quote_id, user_id, file_type, file_name, file_url, file_size, mime_type, description, uploaded_at in backend/migrations/20251102000003-create-quote-attachments-table.js
- [X] T004 Add quote reference fields to work_orders table migration: created_from_quote_id, quote_number in backend/migrations/20251102000004-add-quote-fields-to-work-orders.js
- [X] T005 [P] Create Quote Sequelize model with associations (hasMany Messages/Attachments, belongsTo User/Client) in backend/models/quote.model.js
- [X] T006 [P] Create QuoteMessage Sequelize model with associations in backend/models/quoteMessage.model.js
- [X] T007 [P] Create QuoteAttachment Sequelize model with associations in backend/models/quoteAttachment.model.js
- [X] T008 Add database indexes for quotes: (client_id, status), (quote_number), (created_by) in migrations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core authentication, routing, and middleware that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create quote routes file with express.Router() in backend/routes/quote.routes.js
- [X] T010 [P] Implement quoteAccess middleware with canAccessQuote(role, client_id, authorized_email) in backend/middleware/quoteAccess.middleware.js
- [X] T011 [P] Implement auto-generation utility for quote_number (format: QTE-YYYY-###) in backend/services/quoteService.js
- [X] T012 [P] Create quoteNotificationService with base notification functions in backend/services/quoteNotificationService.js
- [X] T013 Register quote routes in backend/server.js or main app file

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: US1.1 - Client Admin Requests Quote (Priority: Must Have) 🎯 MVP

**Goal**: Client admins can create quote requests with property details, description, photos, save as draft, and submit for WPSG review

**Independent Test**:
1. Login as client_admin (Cameron)
2. Navigate to Quotes → New Request
3. Fill form with property, description, scope, contact, urgency
4. Upload 2-3 photos
5. Save as draft → Verify saved
6. Submit → Verify quote receives QTE-YYYY-### number
7. Verify quote appears in "Pending" status
8. Verify WPSG staff receives notification

### Implementation for US1.1

- [X] T014 [P] [US1.1] Implement POST /api/quotes endpoint - create new quote (client_admin, admin) with validation in backend/controllers/quote.controller.js
- [X] T015 [P] [US1.1] Implement PATCH /api/quotes/:id endpoint - update draft quote in backend/controllers/quote.controller.js
- [X] T016 [P] [US1.1] Implement POST /api/quotes/:id/submit endpoint - submit quote for review, status: Draft → Submitted in backend/controllers/quote.controller.js
- [X] T017 [US1.1] Add validation for quote creation: required fields (property, description min 20 chars, contact), character limits in backend/controllers/quote.controller.js
- [X] T018 [US1.1] Implement client_id scoping for client_admin role in quoteAccess middleware
- [X] T019 [US1.1] Implement notifyQuoteSubmitted() function - send notification to WPSG staff in backend/services/quoteNotificationService.js
- [X] T020 [P] [US1.1] Create QuoteRequestForm component with all fields (property, title, description, scope, contact, urgency, required-by date) in frontend/src/pages/Quotes/QuoteRequestForm.jsx
- [X] T021 [US1.1] Add form validation with react-hook-form + zod in QuoteRequestForm component
- [X] T022 [US1.1] Implement photo/document upload component with preview in QuoteRequestForm
- [X] T023 [US1.1] Add "Save Draft" and "Submit" buttons with loading states in QuoteRequestForm
- [X] T024 [US1.1] Implement auto-save every 30 seconds in QuoteRequestForm
- [X] T025 [US1.1] Apply mobile-responsive layout and NextGen WOM branding (deep-navy, nextgen-green) to QuoteRequestForm
- [X] T026 [P] [US1.1] Implement createQuote(data) in frontend/src/services/quoteService.js
- [X] T027 [P] [US1.1] Implement updateQuote(id, data) in frontend/src/services/quoteService.js
- [X] T028 [P] [US1.1] Implement submitQuote(id) in frontend/src/services/quoteService.js
- [X] T029 [US1.1] Add error handling and toast notifications to quote service methods

**Checkpoint**: ✅ Client admins can create, save as draft, and submit quote requests with photos

**Checkpoint**: Client admins can create, save as draft, and submit quote requests with photos

---

## Phase 4: US2.1 - Staff Views Pending Quote Requests (Priority: Must Have)

**Goal**: WPSG staff can view all pending quote requests across all clients with filters, search, and urgency indicators

**Independent Test**:
1. Login as WPSG staff
2. Navigate to Quotes dashboard
3. Verify pending quotes from all clients visible
4. Filter by urgency → See only urgent quotes with red badges
5. Search by quote number → Find specific quote
6. Sort by date submitted → Verify order correct

### Implementation for US2.1

- [X] T030 [P] [US2.1] Implement GET /api/quotes endpoint with role-based filtering (client=authorized_email, client_admin=client_id, staff/admin=all) in backend/controllers/quote.controller.js
- [X] T031 [P] [US2.1] Implement GET /api/quotes/:id endpoint - get quote details with access control in backend/controllers/quote.controller.js
- [X] T032 [P] [US2.1] Implement GET /api/quotes/summary endpoint - dashboard summary counts by status in backend/controllers/quote.controller.js
- [X] T033 [US2.1] Add query filters support: status, urgency, client_id, search, date_range in GET /api/quotes endpoint
- [X] T034 [US2.1] Add pagination support (page, limit) to GET /api/quotes endpoint
- [X] T035 [P] [US2.1] Create QuoteListPage component with cards (mobile) and table (desktop) layout in frontend/src/pages/Quotes/QuoteListPage.jsx
- [X] T036 [US2.1] Add status badges with colors (draft=gray, pending=blue, quoted=green, approved=bright-green, declined=red, expired=dark-red, converted=nextgen-green) to QuoteListPage
- [X] T037 [US2.1] Implement filters UI: status, urgency, date range in QuoteListPage
- [X] T038 [US2.1] Add search functionality (quote number, property name, description) to QuoteListPage
- [X] T039 [US2.1] Implement pagination controls in QuoteListPage
- [X] T040 [US2.1] Add "New Quote Request" button with role-based visibility in QuoteListPage
- [X] T041 [US2.1] Show urgent quotes with red badge and flame icon in QuoteListPage
- [X] T042 [P] [US2.1] Implement getQuotes(filters) in frontend/src/services/quoteService.js
- [X] T043 [P] [US2.1] Implement getQuoteSummary() in frontend/src/services/quoteService.js

**Checkpoint**: Staff can view, filter, search, and identify urgent quote requests from all clients

---

## Phase 5: US5.1 - View Quote Dashboard (Priority: Must Have)

**Goal**: All users see quote summary widget on dashboard with status breakdown and quick actions

**Independent Test**:
1. Login as client_admin → See only own client quotes in dashboard widget
2. Login as staff → See all client quotes in dashboard widget
3. Click "Pending" status card → Navigate to filtered quotes list showing only Pending
4. Verify urgent count shows red badge
5. Click "New Quote Request" → Navigate to QuoteRequestForm

### Implementation for US5.1

- [X] T044 [P] [US5.1] Create QuoteSummaryWidget component with status cards (Draft, Pending, Quoted, Approved, Declined) in frontend/src/components/Dashboard/QuoteSummaryWidget.jsx
- [X] T045 [US5.1] Display status counts with color-coded cards (gray, blue, green, bright-green, red) in QuoteSummaryWidget
- [X] T046 [US5.1] Make status cards clickable - navigate to QuoteListPage filtered by status
- [X] T047 [US5.1] Add urgent quotes count with red badge in QuoteSummaryWidget
- [X] T048 [US5.1] Add "New Quote Request" button in widget header (role-based visibility: client_admin, admin)
- [X] T049 [US5.1] Implement role-based data fetching (client_admin=own client, staff/admin=all) in QuoteSummaryWidget
- [X] T050 [US5.1] Apply responsive grid layout to QuoteSummaryWidget
- [X] T051 [US5.1] Integrate QuoteSummaryWidget into main dashboard page

**Checkpoint**: Dashboard shows quote summary with clickable status cards and quick access to create new quotes

---

## Phase 6: US2.2 - Staff Provides Quote (Priority: Must Have)

**Goal**: WPSG staff can provide formal quotes with cost estimates, hours, scope details, validity period, and itemized breakdown

**Independent Test**:
1. Login as WPSG staff
2. Open pending quote request
3. Click "Provide Quote"
4. Enter estimated_cost=5000, estimated_hours=20, quote_notes="Includes materials and labor"
5. Set validity_period=30 days
6. Add itemized breakdown (optional)
7. Submit → Verify status changes to "Quoted"
8. Verify client receives notification
9. Verify quote visible to client with all details

### Implementation for US2.2

- [X] T052 [P] [US2.2] Implement PATCH /api/quotes/:id/provide-quote endpoint - staff provides quote with estimated_cost, estimated_hours, quote_notes, quote_valid_until in backend/controllers/quote.controller.js
- [X] T053 [US2.2] Add validation: estimated_cost > 0, estimated_hours > 0, validity_date in future in provide-quote endpoint
- [X] T054 [US2.2] Change status from Pending → Quoted and create QuoteMessage with type='quote_provided' in provide-quote endpoint
- [X] T055 [US2.2] Add middleware authMiddleware.isStaffOrAdmin to provide-quote endpoint
- [X] T056 [US2.2] Implement notifyQuoteProvided() function - send notification to client with quote details in backend/services/quoteNotificationService.js
- [X] T057 [P] [US2.2] Implement POST /api/quotes/:id/attachments endpoint - upload quote documents (PDF, spreadsheet) in backend/controllers/quote.controller.js
- [X] T058 [US2.2] Configure multer for file handling (max 10 files, 10MB each, types: images, PDF, doc, xlsx) in quote controller
- [X] T059 [US2.2] Integrate with AWS S3 (reuse existing photo service pattern) for quote attachments
- [X] T060 [P] [US2.2] Create QuoteProvisionForm component with fields: estimated_cost, estimated_hours, quote_notes, validity_period in frontend/src/components/Quotes/QuoteProvisionForm.jsx
- [X] T061 [US2.2] Add itemized cost breakdown section (optional, array input for materials, labor, subcontractor) to QuoteProvisionForm
- [X] T062 [US2.2] Add quote document upload (PDF, Excel) to QuoteProvisionForm
- [X] T063 [US2.2] Implement "Provide Quote" button with validation and loading state in QuoteProvisionForm
- [X] T064 [US2.2] Add error handling and success toast notification in QuoteProvisionForm
- [X] T065 [P] [US2.2] Implement uploadAttachments(quoteId, files) in frontend/src/services/quoteService.js

**Checkpoint**: Staff can provide quotes with cost estimates, hours, notes, validity period, and documents

---

## Phase 7: US3.1 - Client Reviews Provided Quote (Priority: Must Have)

**Goal**: Client admins can view provided quotes with all details, cost breakdown, attachments, and see validity period

**Independent Test**:
1. Login as client_admin
2. Navigate to quote with status "Quoted"
3. Verify quote details displayed: estimated_cost, estimated_hours, quote_notes, validity_date
4. Verify itemized breakdown visible (if provided by staff)
5. Download attached quote documents
6. Verify "Approve" and "Decline" buttons visible
7. Check validity date shows "Valid until [date]"
8. For expired quote → Verify approval disabled with "Quote Expired" message

### Implementation for US3.1

- [X] T066 [P] [US3.1] Create QuoteDetailPage component with quote header (title, quote_number, status badge, urgency flag) in frontend/src/pages/Quotes/QuoteDetailPage.jsx
- [X] T067 [US3.1] Display property information and contact details section in QuoteDetailPage
- [X] T068 [US3.1] Display description and scope of work section in QuoteDetailPage
- [X] T069 [US3.1] Show quote details section: estimated_cost, estimated_hours, quote_notes, validity_date with expiry warning in QuoteDetailPage
- [X] T070 [US3.1] Display itemized cost breakdown table (if provided) in QuoteDetailPage
- [X] T071 [US3.1] Show attachments gallery with photos and documents (downloadable) in QuoteDetailPage
- [X] T072 [US3.1] Add action buttons panel based on role and status (Approve/Decline for client_admin on Quoted status) in QuoteDetailPage
- [X] T073 [US3.1] Implement mobile-responsive layout for QuoteDetailPage
- [X] T074 [US3.1] Apply NextGen WOM branding and styling to QuoteDetailPage
- [X] T075 [P] [US3.1] Implement getQuoteById(id) in frontend/src/services/quoteService.js

**Checkpoint**: Client admins can review provided quotes with all details, breakdown, and documents

---

## Phase 8: US3.2 - Client Admin Approves Quote (Priority: Must Have)

**Goal**: Client admins can approve quotes to proceed with work, triggering notifications to WPSG staff

**Independent Test**:
1. Login as client_admin
2. Open quote with status "Quoted" (not expired)
3. Click "Approve Quote"
4. Verify confirmation dialog appears with commitment message
5. Confirm approval
6. Verify status changes to "Approved"
7. Verify WPSG staff receives immediate notification
8. Verify "Convert to Work Order" button now visible for staff
9. Verify cannot un-approve (audit compliance)

### Implementation for US3.2

- [X] T076 [P] [US3.2] Implement PATCH /api/quotes/:id/approve endpoint - client admin approves quote in backend/controllers/quote.controller.js
- [X] T077 [US3.2] Validate quote not expired before allowing approval in approve endpoint
- [X] T078 [US3.2] Validate only client_admin role can approve (not client role) in approve endpoint
- [X] T079 [US3.2] Change status from Quoted → Approved and create QuoteMessage with type='approved' in approve endpoint
- [X] T080 [US3.2] Add middleware authMiddleware.isClientAdminOrAdmin to approve endpoint
- [X] T081 [US3.2] Implement notifyQuoteApproved() function - send notification to WPSG staff in backend/services/quoteNotificationService.js
- [X] T082 [P] [US3.2] Create QuoteApprovalCard component with quote details (cost, hours, scope, validity) in frontend/src/components/Quotes/QuoteApprovalCard.jsx
- [X] T083 [US3.2] Implement "Approve Quote" button with confirmation dialog in QuoteApprovalCard
- [X] T084 [US3.2] Add confirmation dialog text: "Approval means commitment to proceed with work. Continue?"
- [X] T085 [US3.2] Disable approval button if quote expired with "Quote Expired" message in QuoteApprovalCard
- [X] T086 [US3.2] Handle approval success: update UI, show toast, refresh quote status
- [X] T087 [P] [US3.2] Implement approveQuote(id) in frontend/src/services/quoteService.js

**Checkpoint**: Client admins can approve quotes with confirmation, triggering staff notifications

---

## Phase 9: US4.1 - Staff Converts Approved Quote to Work Order (Priority: Must Have)

**Goal**: WPSG staff can convert approved quotes to work orders, pre-populating all quote data, linking bidirectionally

**Independent Test**:
1. Login as WPSG staff
2. Open quote with status "Approved"
3. Verify "Convert to Work Order" button visible
4. Click button → See work order form pre-populated with quote data
5. Edit work order details (supplier, schedule date)
6. Submit → Verify work order created with job number (RBWO######)
7. Verify quote status changes to "Converted"
8. Verify quote.converted_to_work_order_id set
9. Verify work_order.created_from_quote_id set
10. Verify client receives notification
11. Verify photos/documents copied to work order

### Implementation for US4.1

- [X] T088 [P] [US4.1] Implement POST /api/quotes/:id/convert endpoint - convert approved quote to work order in backend/controllers/quote.controller.js
- [X] T089 [US4.1] Validate status is 'Approved' before allowing conversion in convert endpoint
- [X] T090 [US4.1] Generate work order job_no (format: RBWO######) in convert endpoint
- [X] T091 [US4.1] Create work order with quote data: property_name, property_address, contact_person, contact_email, description, scope_of_work, estimated_cost in convert endpoint
- [X] T092 [US4.1] Copy quote attachments to work order photos using existing photo service in convert endpoint
- [X] T093 [US4.1] Create work order note with quote reference: "Created from Quote [quote_number]" in convert endpoint
- [X] T094 [US4.1] Update quote status to 'Converted' and set converted_to_work_order_id, converted_at in convert endpoint
- [X] T095 [US4.1] Update work order with created_from_quote_id and quote_number in convert endpoint
- [X] T096 [US4.1] Use database transaction for atomicity (rollback on any failure) in convert endpoint
- [X] T097 [US4.1] Add middleware authMiddleware.isStaffOrAdmin to convert endpoint
- [X] T098 [US4.1] Implement notifyQuoteConverted() function - send notification to client in backend/services/quoteNotificationService.js
- [X] T099 [P] [US4.1] Add "Convert to Work Order" button on approved quotes in QuoteDetailPage (staff/admin only)
- [X] T100 [US4.1] Create work order conversion confirmation dialog with work order preview (editable fields: supplier, schedule_date) in QuoteDetailPage
- [X] T101 [US4.1] Implement conversion API call with loading state and error handling
- [X] T102 [US4.1] Handle conversion success: show toast "Quote converted to Work Order [job_no]", navigate to work order detail page
- [X] T103 [US4.1] Update quote status badge to "Converted" after successful conversion
- [X] T104 [P] [US4.1] Implement convertToWorkOrder(quoteId, workOrderData) in frontend/src/services/quoteService.js

**Checkpoint**: Staff can convert approved quotes to work orders with all data and attachments transferred

---

## Phase 10: US2.3 - Staff Requests More Information (Priority: Must Have)

**Goal**: WPSG staff can request additional information from clients when quote scope is unclear

**Independent Test**:
1. Login as WPSG staff
2. Open pending quote request
3. Click "Request More Info"
4. Enter message: "Please provide photos of the roof damage"
5. Submit → Verify status changes to "Information Requested"
6. Verify client receives notification
7. Login as client_admin → See status "Information Requested" with staff message
8. Reply with information → Verify status changes back to "Pending"

### Implementation for US2.3

- [X] T105 [P] [US2.3] Implement PATCH /api/quotes/:id/request-info endpoint - staff requests more information in backend/controllers/quote.controller.js
- [X] T106 [US2.3] Validate message field required in request-info endpoint
- [X] T107 [US2.3] Change status from Pending → Information Requested and create QuoteMessage with type='info_requested' in request-info endpoint
- [X] T108 [US2.3] Add middleware authMiddleware.isStaffOrAdmin to request-info endpoint
- [X] T109 [US2.3] Implement notifyInfoRequested() function - send notification to client with staff questions in backend/services/quoteNotificationService.js
- [X] T110 [P] [US2.3] Implement POST /api/quotes/:id/messages endpoint - add message to quote thread in backend/controllers/quote.controller.js
- [X] T111 [P] [US2.3] Implement GET /api/quotes/:id/messages endpoint - list messages for quote in backend/controllers/quote.controller.js
- [X] T112 [US2.3] Add role-based access for messaging (client=own quotes, client_admin=org quotes, staff/admin=all) in messages endpoint
- [X] T113 [US2.3] Trigger notification on new message in messages endpoint
- [X] T114 [US2.3] Change status from Information Requested → Pending when client responds with message
- [X] T115 [P] [US2.3] Add "Request More Info" button in QuoteDetailPage (staff view only)
- [X] T116 [US2.3] Create message dialog for staff to enter information request in QuoteDetailPage
- [X] T117 [P] [US2.3] Create QuoteMessagesThread component with timeline format (newest first) in frontend/src/components/Quotes/QuoteMessagesThread.jsx
- [X] T118 [US2.3] Display messages with author name, timestamp, message_type badge in QuoteMessagesThread
- [X] T119 [US2.3] Implement message input form at bottom with "Send Message" button in QuoteMessagesThread
- [X] T120 [US2.3] Auto-scroll to bottom on new message in QuoteMessagesThread
- [X] T121 [US2.3] Apply mobile-optimized message UI to QuoteMessagesThread
- [X] T122 [US2.3] Integrate QuoteMessagesThread into QuoteDetailPage
- [X] T123 [P] [US2.3] Implement requestInfo(quoteId, message) in frontend/src/services/quoteService.js
- [X] T124 [P] [US2.3] Implement addMessage(quoteId, message) in frontend/src/services/quoteService.js
- [X] T125 [P] [US2.3] Implement getMessages(quoteId) in frontend/src/services/quoteService.js

**Checkpoint**: Staff can request more information, clients can respond via messaging, status updates automatically

---

## Phase 11: US2.4 - Staff Declines Quote Request (Priority: Must Have)

**Goal**: WPSG staff can decline quote requests that are out of scope with reason, maintaining history

**Independent Test**:
1. Login as WPSG staff
2. Open pending quote request
3. Click "Decline"
4. Enter decline reason: "This work requires a licensed electrician, outside our scope"
5. Submit → Verify status changes to "Declined"
6. Verify client receives notification with decline reason
7. Verify declined quote remains in history (not deleted)
8. Verify cannot convert declined quote to work order

### Implementation for US2.4

- [ ] T126 [P] [US2.4] Implement PATCH /api/quotes/:id/decline endpoint - staff declines quote request in backend/controllers/quote.controller.js
- [ ] T127 [US2.4] Validate decline_reason field required (min 10 characters) in decline endpoint
- [ ] T128 [US2.4] Change status to 'Declined' and create QuoteMessage with type='declined_by_staff' and decline_reason in decline endpoint
- [ ] T129 [US2.4] Add middleware authMiddleware.isStaffOrAdmin to decline endpoint
- [ ] T130 [US2.4] Implement notifyQuoteDeclined() function - send notification to client with decline reason in backend/services/quoteNotificationService.js
- [ ] T131 [P] [US2.4] Add "Decline" button in QuoteDetailPage (staff view, Pending status only)
- [ ] T132 [US2.4] Create decline dialog with required reason textarea (min 10 chars) in QuoteDetailPage
- [ ] T133 [US2.4] Handle decline success: update status badge to "Declined", show decline reason in quote detail
- [ ] T134 [P] [US2.4] Implement declineQuoteRequest(quoteId, reason) in frontend/src/services/quoteService.js

**Checkpoint**: Staff can decline out-of-scope quote requests with reason, clients receive notification

---

## Phase 12: US3.3 - Client Admin Declines Quote (Priority: Must Have)

**Goal**: Client admins can decline provided quotes if cost/scope doesn't meet needs with reason

**Independent Test**:
1. Login as client_admin
2. Open quote with status "Quoted"
3. Click "Decline Quote"
4. Enter decline reason: "Cost exceeds our budget for this repair"
5. Submit → Verify status changes to "Declined"
6. Verify WPSG staff receives notification with decline reason
7. Verify quote remains in history
8. Verify cannot convert declined quote to work order

### Implementation for US3.3

- [ ] T135 [P] [US3.3] Implement PATCH /api/quotes/:id/decline-quote endpoint - client admin declines provided quote in backend/controllers/quote.controller.js
- [ ] T136 [US3.3] Validate decline_reason field required (min 10 characters) in decline-quote endpoint
- [ ] T137 [US3.3] Validate only client_admin role can decline (not client role) in decline-quote endpoint
- [ ] T138 [US3.3] Change status from Quoted → Declined and create QuoteMessage with type='declined_by_client' and decline_reason in decline-quote endpoint
- [ ] T139 [US3.3] Add middleware authMiddleware.isClientAdminOrAdmin to decline-quote endpoint
- [ ] T140 [US3.3] Implement notifyQuoteDeclinedByClient() function - send notification to WPSG staff with reason in backend/services/quoteNotificationService.js
- [ ] T141 [P] [US3.3] Add "Decline Quote" button in QuoteApprovalCard (client_admin only, Quoted status)
- [ ] T142 [US3.3] Create decline dialog with required reason textarea (min 10 chars) in QuoteApprovalCard
- [ ] T143 [US3.3] Handle decline success: update status badge, show toast, refresh quote
- [ ] T144 [P] [US3.3] Implement declineQuote(quoteId, reason) in frontend/src/services/quoteService.js

**Checkpoint**: Client admins can decline provided quotes with reason, staff receive notification

---

## Phase 13: US6.1 - System Monitors Quote Expiry (Priority: Must Have)

**Goal**: System automatically tracks quote validity periods, sends reminders, marks expired quotes

**Independent Test**:
1. Create quote and provide quote with validity_date = today + 3 days
2. Wait/simulate 1 day → No action
3. Wait/simulate to 3 days before expiry → Verify reminder email sent to client
4. Wait/simulate to expiry date → Verify status changes to "Expired"
5. Verify "EXPIRED" red badge shows on quote
6. Verify approval button disabled with "Quote Expired" message
7. Verify staff can still renew expired quote

### Implementation for US6.1

- [ ] T145 [P] [US6.1] Create scheduled job for quote expiry monitoring (daily cron) in backend/services/quoteExpiryService.js
- [ ] T146 [US6.1] Implement checkExpiredQuotes() function - find quotes with status='Quoted' and valid_until < now in quoteExpiryService
- [ ] T147 [US6.1] Update expired quotes status to 'Expired' and create QuoteMessage with type='expired' in checkExpiredQuotes()
- [ ] T148 [US6.1] Implement checkExpiringQuotes() function - find quotes expiring in 3 days in quoteExpiryService
- [ ] T149 [US6.1] Send reminder notifications for quotes expiring in 3 days: "Quote expires in 3 days" in checkExpiringQuotes()
- [ ] T150 [US6.1] Register scheduled job in backend server initialization (node-cron or similar)
- [ ] T151 [P] [US6.1] Create QuoteStatusBadge component with status colors (draft=gray, pending=blue, quoted=green, approved=bright-green, declined=red, expired=dark-red, converted=nextgen-green) in frontend/src/components/Quotes/QuoteStatusBadge.jsx
- [ ] T152 [US6.1] Add "EXPIRED" red badge styling with warning icon to QuoteStatusBadge
- [ ] T153 [US6.1] Implement in QuoteListPage, QuoteDetailPage, QuoteSummaryWidget
- [ ] T154 [US6.1] Add urgency badge (red with flame icon) to QuoteStatusBadge

**Checkpoint**: System automatically monitors quote expiry, sends reminders, marks expired quotes

---

## Phase 14: US1.2 - Housing Coordinator Requests Quote (Priority: Should Have)

**Goal**: Housing coordinators (client role) can request quotes for properties they manage (authorized_email match)

**Independent Test**:
1. Login as client (housing coordinator) with authorized_email matching property
2. Navigate to Quotes → New Request
3. Verify can only see properties where authorized_email matches
4. Fill form and submit quote request
5. Verify quote receives reference number
6. Verify quote visible to client_admin for approval
7. Verify client can see only their own submitted quotes (filtered by authorized_email)

### Implementation for US1.2

- [ ] T155 [P] [US1.2] Update POST /api/quotes endpoint to allow client role with authorized_email validation in backend/controllers/quote.controller.js
- [ ] T156 [US1.2] Implement authorized_email matching for property selection (client can only create quotes for properties where email matches) in quote controller
- [ ] T157 [US1.2] Update GET /api/quotes endpoint to filter by authorized_email for client role in backend/controllers/quote.controller.js
- [ ] T158 [US1.2] Update quoteAccess middleware to support client role with email-scoped access in backend/middleware/quoteAccess.middleware.js
- [ ] T159 [P] [US1.2] Update QuoteRequestForm to filter properties by authorized_email for client role
- [ ] T160 [US1.2] Add confirmation message: "Quote request will be visible to your property manager for approval"
- [ ] T161 [US1.2] Update QuoteListPage to show only own quotes for client role (authorized_email filter)
- [ ] T162 [US1.2] Update QuoteSummaryWidget to show only own quotes for client role

**Checkpoint**: Housing coordinators can request quotes for properties they manage, filtered by authorized_email

---

## Phase 15: US1.3 - Save Quote Request as Draft (Priority: Should Have)

**Goal**: Users can save incomplete quote requests as drafts, edit later, with auto-save and expiry warnings

**Independent Test**:
1. Login as client_admin
2. Start creating quote request
3. Fill only property and title
4. Click "Save Draft" → Verify saved without validation errors
5. Navigate away and back → Verify draft visible and editable
6. Wait 30 seconds → Verify auto-save message appears
7. Create draft, simulate 30 days later → Verify expiry warning shows

### Implementation for US1.3

- [ ] T163 [P] [US1.3] Add status='Draft' handling in POST /api/quotes endpoint (skip required field validation for drafts) in backend/controllers/quote.controller.js
- [ ] T164 [US1.3] Add draft_expires_at field calculation (created_at + 30 days) on draft creation
- [ ] T165 [P] [US1.3] Enhance QuoteRequestForm with draft save functionality (separate from submit)
- [ ] T166 [US1.3] Implement auto-save every 30 seconds in QuoteRequestForm (debounced)
- [ ] T167 [US1.3] Add visual indicator for auto-save status: "Saving...", "Saved", "Error saving"
- [ ] T168 [US1.3] Show expiry warning for drafts older than 25 days: "Draft expires in X days"
- [ ] T169 [US1.3] Update QuoteListPage to show "Draft" status with edit action
- [ ] T170 [US1.3] Update GET /api/quotes to include drafts in results (role-based filtering still applies)
- [ ] T171 [US1.3] Implement saveDraft(data) in frontend/src/services/quoteService.js

**Checkpoint**: Users can save drafts, auto-save works, expiry warnings show for old drafts

---

## Phase 16: US3.4 - Negotiate Quote via Messages (Priority: Should Have)

**Goal**: All parties can discuss quote details via in-system messaging to negotiate scope/price

**Independent Test**:
1. Staff provides quote
2. Client_admin adds message: "Can you reduce cost by using standard materials?"
3. Staff responds with message: "Yes, revised quote coming"
4. Verify message thread shows all messages with authors and timestamps
5. Verify both parties receive notifications on new messages
6. Verify status can be "Under Discussion" during negotiation
7. Verify client role can only message on quotes where authorized_email matches

### Implementation for US3.4

- [ ] T172 [P] [US3.4] Add status='Under Discussion' to quote status enum in backend/models/quote.model.js
- [ ] T173 [US3.4] Update PATCH /api/quotes/:id/status endpoint to allow status change to 'Under Discussion' in backend/controllers/quote.controller.js
- [ ] T174 [US3.4] Enhance POST /api/quotes/:id/messages to track message_type: 'comment', 'question', 'response' in backend/controllers/quote.controller.js
- [ ] T175 [US3.4] Add client role validation in POST /api/quotes/:id/messages - only allow if authorized_email matches
- [ ] T176 [US3.4] Implement notifyNewMessage() function - send notification to other party on new message in backend/services/quoteNotificationService.js
- [ ] T177 [US3.4] Preserve complete message history in audit trail (no deletion allowed)
- [ ] T178 [P] [US3.4] Enhance QuoteMessagesThread to show conversation flow with author names and roles
- [ ] T179 [US3.4] Add message type indicator badges (comment, question, response) to messages
- [ ] T180 [US3.4] Add "Mark as Under Discussion" button for client_admin and staff in QuoteDetailPage
- [ ] T181 [US3.4] Implement real-time message updates (polling or WebSocket) in QuoteMessagesThread
- [ ] T182 [US3.4] Add unread message indicator in QuoteListPage

**Checkpoint**: All parties can negotiate via messaging, status can be "Under Discussion", messages preserved

---

## Phase 17: US3.5 - Staff Updates Quote (Priority: Should Have)

**Goal**: WPSG staff can revise quotes based on client feedback, tracking revision history

**Independent Test**:
1. Login as staff
2. Open quote with status "Quoted" or "Under Discussion"
3. Click "Update Quote"
4. Change estimated_cost from 5000 to 4500
5. Change estimated_hours from 20 to 18
6. Update quote_notes
7. Submit → Verify revision history created
8. Verify previous amounts visible: "Quote updated: $5000 → $4500"
9. Verify message auto-added to thread
10. Verify client receives notification of updated quote
11. Verify validity period can be extended

### Implementation for US3.5

- [ ] T183 [P] [US3.5] Add quote_version field to quotes table migration in backend/migrations/
- [ ] T184 [P] [US3.5] Create quote_history table migration to track revisions: id, quote_id, version, previous_cost, previous_hours, previous_notes, changed_at, changed_by in backend/migrations/
- [ ] T185 [P] [US3.5] Implement PATCH /api/quotes/:id/update-quote endpoint - staff updates existing quote in backend/controllers/quote.controller.js
- [ ] T186 [US3.5] Save revision to quote_history before updating in update-quote endpoint
- [ ] T187 [US3.5] Increment quote_version on each update in update-quote endpoint
- [ ] T188 [US3.5] Create QuoteMessage with type='quote_updated' showing cost/hours changes in update-quote endpoint
- [ ] T189 [US3.5] Allow validity period extension in update-quote endpoint
- [ ] T190 [US3.5] Implement notifyQuoteUpdated() function - send notification to client in backend/services/quoteNotificationService.js
- [ ] T191 [P] [US3.5] Implement GET /api/quotes/:id/history endpoint - get revision history in backend/controllers/quote.controller.js
- [ ] T192 [P] [US3.5] Add "Update Quote" button in QuoteDetailPage (staff view, Quoted or Under Discussion status)
- [ ] T193 [US3.5] Create quote update form dialog with editable fields: estimated_cost, estimated_hours, quote_notes, validity_period
- [ ] T194 [US3.5] Display revision history section showing previous versions with timestamps in QuoteDetailPage
- [ ] T195 [US3.5] Show cost/hours changes visually: "Previous: $5000 → Current: $4500"
- [ ] T196 [P] [US3.5] Implement updateQuoteDetails(quoteId, updates) in frontend/src/services/quoteService.js
- [ ] T197 [P] [US3.5] Implement getQuoteHistory(quoteId) in frontend/src/services/quoteService.js

**Checkpoint**: Staff can update quotes, revision history tracked, clients notified of changes

---

## Phase 18: US5.2 - Filter and Search Quotes (Priority: Should Have)

**Goal**: Users can filter quotes by multiple criteria and search by text to find specific quotes quickly

**Independent Test**:
1. Login as client_admin
2. Navigate to quote list
3. Apply filters: Status=Quoted, Urgency=Urgent, Date Range=Last 30 days
4. Verify results show only quoted urgent quotes from last 30 days
5. Search by quote number "QTE-2025-001" → Verify correct quote found
6. Search by property name "123 Main St" → Verify quotes for that property shown
7. Click "Clear Filters" → Verify all quotes shown
8. Navigate away and back → Verify filter state preserved
9. Verify results show count: "Showing 5 of 23 quotes"

### Implementation for US5.2

- [ ] T198 [P] [US5.2] Enhance GET /api/quotes endpoint with advanced filters: status (multi-select), property, date_range (from, to), urgency, client_id (staff only) in backend/controllers/quote.controller.js
- [ ] T199 [US5.2] Implement full-text search across quote_number, property_name, description, scope_of_work in GET /api/quotes endpoint
- [ ] T200 [US5.2] Support filter combination (AND logic) in GET /api/quotes endpoint
- [ ] T201 [US5.2] Return result count metadata: total, filtered_count in GET /api/quotes response
- [ ] T202 [P] [US5.2] Create QuoteFilters component with all filter controls in frontend/src/components/Quotes/QuoteFilters.jsx
- [ ] T203 [US5.2] Implement multi-select status filter (checkboxes) in QuoteFilters
- [ ] T204 [US5.2] Implement date range picker (from, to) in QuoteFilters
- [ ] T205 [US5.2] Implement urgency toggle filter in QuoteFilters
- [ ] T206 [US5.2] Implement client filter dropdown (staff/admin only) in QuoteFilters
- [ ] T207 [US5.2] Add "Clear Filters" button to reset all filters in QuoteFilters
- [ ] T208 [US5.2] Persist filter state in URL query params (browser back/forward support)
- [ ] T209 [US5.2] Display results count: "Showing X of Y quotes" in QuoteListPage
- [ ] T210 [US5.2] Integrate QuoteFilters into QuoteListPage
- [ ] T211 [US5.2] Add debounced search input (500ms delay) in QuoteListPage

**Checkpoint**: Users can filter and search quotes by multiple criteria, state persisted, counts displayed

---

## Phase 19: US5.3 - View Quote History and Timeline (Priority: Should Have)

**Goal**: All users can see complete history of quote with status changes, messages, revisions

**Independent Test**:
1. Open quote with multiple status changes, messages, and revisions
2. Verify timeline shows all events in chronological order
3. Verify timeline shows status changes with timestamps and user names
4. Verify timeline shows all messages/communications
5. Verify timeline shows quote revisions with cost changes
6. Verify color-coded events: blue=action, green=approval, red=decline, gray=system
7. Expand/collapse timeline sections
8. Click "Export Timeline as PDF" → Verify PDF downloads

### Implementation for US5.3

- [ ] T212 [P] [US5.3] Implement GET /api/quotes/:id/timeline endpoint - get complete quote history in backend/controllers/quote.controller.js
- [ ] T213 [US5.3] Aggregate data from quote status changes, quote_messages, quote_history in timeline endpoint
- [ ] T214 [US5.3] Include user full names for all actions in timeline response
- [ ] T215 [US5.3] Order timeline events by timestamp descending (newest first) in timeline endpoint
- [ ] T216 [P] [US5.3] Implement POST /api/quotes/:id/export-timeline endpoint - generate PDF in backend/controllers/quote.controller.js
- [ ] T217 [US5.3] Use PDF library (pdfkit or similar) to generate timeline PDF for audit purposes
- [ ] T218 [P] [US5.3] Create QuoteTimeline component with event cards in frontend/src/components/Quotes/QuoteTimeline.jsx
- [ ] T219 [US5.3] Display all status changes with timestamps, user names, and status badges in QuoteTimeline
- [ ] T220 [US5.3] Display all messages in timeline with author and content in QuoteTimeline
- [ ] T221 [US5.3] Display quote revisions with cost/hours changes highlighted in QuoteTimeline
- [ ] T222 [US5.3] Apply color coding: blue=action, green=approval, red=decline, gray=system event
- [ ] T223 [US5.3] Implement expand/collapse functionality for timeline sections
- [ ] T224 [US5.3] Add "Export as PDF" button to download timeline for audit
- [ ] T225 [US5.3] Integrate QuoteTimeline into QuoteDetailPage
- [ ] T226 [P] [US5.3] Implement getTimeline(quoteId) in frontend/src/services/quoteService.js
- [ ] T227 [P] [US5.3] Implement exportTimelinePDF(quoteId) in frontend/src/services/quoteService.js

**Checkpoint**: Complete quote history visible with timeline, color-coded, exportable to PDF

---

## Phase 20: US4.2 - View Linked Work Order from Quote (Priority: Should Have)

**Goal**: Users can see work order created from approved quote and navigate between them

**Independent Test**:
1. Login as client_admin
2. Open converted quote (status="Converted")
3. Verify "View Work Order" button visible
4. Click button → Navigate to work order detail page
5. Verify work order shows "Created from Quote QTE-2025-001" badge
6. Verify quote history accessible from work order detail page
7. Verify estimated cost from quote shown as reference in work order
8. Verify client role can only view if authorized_email matches

### Implementation for US4.2

- [ ] T228 [P] [US4.2] Add "View Work Order" button on converted quotes in QuoteDetailPage
- [ ] T229 [US4.2] Link button to work order detail page using converted_to_work_order_id
- [ ] T230 [P] [US4.2] Update work order detail page to show "Created from Quote [quote_number]" badge when created_from_quote_id exists
- [ ] T231 [US4.2] Add "View Original Quote" button in work order detail page when created_from_quote_id exists
- [ ] T232 [US4.2] Display quote estimated_cost as reference field in work order detail: "Quoted Amount: $X (Reference)"
- [ ] T233 [US4.2] Add quote history link/section in work order detail page
- [ ] T234 [US4.2] Implement role-based access: client role can only view work order if authorized_email matches
- [ ] T235 [US4.2] Implement role-based access: client_admin can view all organization work orders

**Checkpoint**: Bidirectional navigation between quotes and work orders, quote reference visible in work order

---

## Phase 21: US5.4 - Export Quotes Report (Priority: Could Have)

**Goal**: Client admins and admins can export quote data to CSV for external analysis

**Independent Test**:
1. Login as client_admin
2. Navigate to quote list
3. Apply filters: Status=Approved, Date Range=Last quarter
4. Click "Export to CSV" button
5. Verify CSV downloads immediately (no email)
6. Verify filename format: "quotes_export_YYYY-MM-DD.csv"
7. Verify CSV includes: Quote number, Property, Status, Submitted date, Quoted date, Amount, Approved date
8. Verify CSV respects current filters (only approved quotes from last quarter exported)

### Implementation for US5.4

- [ ] T236 [P] [US5.4] Implement GET /api/quotes/export endpoint - generate CSV with current filters in backend/controllers/quote.controller.js
- [ ] T237 [US5.4] Use csv library to generate CSV from quote data
- [ ] T238 [US5.4] Include columns: quote_number, property_name, property_address, status, created_at, submitted_at, quoted_at, estimated_cost, estimated_hours, approved_at, declined_at in CSV
- [ ] T239 [US5.4] Apply same filters as current quote list view (respect user filters)
- [ ] T240 [US5.4] Set response headers for CSV download: Content-Type, Content-Disposition with filename
- [ ] T241 [US5.4] Add middleware authMiddleware.isClientAdminOrAdmin to export endpoint
- [ ] T242 [P] [US5.4] Add "Export to CSV" button in QuoteListPage (client_admin, admin only)
- [ ] T243 [US5.4] Generate filename: "quotes_export_YYYY-MM-DD.csv" with current date
- [ ] T244 [US5.4] Trigger immediate download on button click (no email notification)
- [ ] T245 [US5.4] Show loading indicator during export generation
- [ ] T246 [P] [US5.4] Implement exportQuotesCSV(filters) in frontend/src/services/quoteService.js

**Checkpoint**: Users can export filtered quote data to CSV for analysis

---

## Phase 22: US6.2 - Staff Renews Expired Quote (Priority: Should Have)

**Goal**: WPSG staff can renew expired quotes with updated validity period and cost/scope

**Independent Test**:
1. Login as staff
2. Open quote with status "Expired"
3. Click "Renew Quote"
4. Update cost/scope if needed
5. Set new validity period (default +30 days)
6. Submit → Verify status changes from "Expired" → "Quoted"
7. Verify message added: "Quote renewed and extended until [date]"
8. Verify client receives notification of renewed quote
9. Verify history shows quote was renewed

### Implementation for US6.2

- [ ] T247 [P] [US6.2] Implement PATCH /api/quotes/:id/renew endpoint - staff renews expired quote in backend/controllers/quote.controller.js
- [ ] T248 [US6.2] Validate status is 'Expired' before allowing renewal in renew endpoint
- [ ] T249 [US6.2] Allow updating estimated_cost, estimated_hours, quote_notes, quote_valid_until in renew endpoint
- [ ] T250 [US6.2] Change status from 'Expired' → 'Quoted' in renew endpoint
- [ ] T251 [US6.2] Set new validity period: default quote_valid_until = now + 30 days (editable) in renew endpoint
- [ ] T252 [US6.2] Create QuoteMessage with type='renewed' and message: "Quote renewed and extended until [date]" in renew endpoint
- [ ] T253 [US6.2] Track renewal in quote_history table
- [ ] T254 [US6.2] Add middleware authMiddleware.isStaffOrAdmin to renew endpoint
- [ ] T255 [US6.2] Implement notifyQuoteRenewed() function - send notification to client in backend/services/quoteNotificationService.js
- [ ] T256 [P] [US6.2] Add "Renew Quote" button on expired quotes in QuoteDetailPage (staff only)
- [ ] T257 [US6.2] Create renewal dialog with editable fields: estimated_cost, estimated_hours, quote_notes, validity_period
- [ ] T258 [US6.2] Pre-fill dialog with current quote values
- [ ] T259 [US6.2] Handle renewal success: update status badge, show toast, refresh quote
- [ ] T260 [P] [US6.2] Implement renewQuote(quoteId, updates) in frontend/src/services/quoteService.js

**Checkpoint**: Staff can renew expired quotes with updated details, clients notified

---

## Phase 23: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, documentation, and final touches

- [ ] T261 [P] Add comprehensive API documentation for all quote endpoints in api-doc.md with request/response examples
- [ ] T262 [P] Create user guide for creating quote requests (client_admin) with screenshots
- [ ] T263 [P] Create user guide for providing quotes (staff) with screenshots
- [ ] T264 [P] Create user guide for approving quotes (client_admin) with screenshots
- [ ] T265 [P] Document quote status meanings and workflow in user documentation
- [ ] T266 [P] Add troubleshooting section to user documentation
- [ ] T267 [P] Update CLAUDE.md with quote system technologies and structure
- [ ] T268 Code cleanup: Remove console.logs, unused imports, dead code across all quote files
- [ ] T269 Performance optimization: Add database query indexes if not already added in setup phase
- [ ] T270 Performance optimization: Implement pagination optimization for large quote lists
- [ ] T271 [P] Security review: Validate all user inputs sanitized and SQL injection prevented
- [ ] T272 [P] Security review: Ensure role-based access control enforced on all endpoints
- [ ] T273 [P] Accessibility audit: Verify WCAG AA compliance for all quote pages (keyboard navigation, screen reader, color contrast)
- [ ] T274 Mobile UX refinement: Test on iOS and Android, fix any responsive issues
- [ ] T275 Browser compatibility testing: Test on Chrome, Safari, Firefox, Edge
- [ ] T276 [P] Add error logging and monitoring for quote operations (Sentry or similar)
- [ ] T277 [P] Create analytics dashboard queries for quote metrics (response time, approval rate, conversion rate)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-22)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in Must Have → Should Have → Could Have priority order
- **Polish (Phase 23)**: Depends on all desired user stories being complete

### User Story Dependencies

**Epic 1 (Quote Request Creation)**:
- **US1.1** (Phase 3): Can start after Foundational - No dependencies - 🎯 MVP
- **US1.2** (Phase 14): Depends on US1.1 completion (extends client role access)
- **US1.3** (Phase 15): Depends on US1.1 completion (adds draft functionality)

**Epic 2 (Quote Review and Provision)**:
- **US2.1** (Phase 4): Can start after Foundational - No dependencies on other stories
- **US2.2** (Phase 6): Depends on US2.1 completion (staff needs to view before providing)
- **US2.3** (Phase 10): Depends on US2.1 completion (staff needs to view before requesting info)
- **US2.4** (Phase 11): Depends on US2.1 completion (staff needs to view before declining)

**Epic 3 (Quote Approval and Negotiation)**:
- **US3.1** (Phase 7): Depends on US2.2 completion (client reviews provided quotes)
- **US3.2** (Phase 8): Depends on US3.1 completion (client approves reviewed quotes)
- **US3.3** (Phase 12): Depends on US3.1 completion (client declines reviewed quotes)
- **US3.4** (Phase 16): Depends on US2.3 completion (messaging extends info request)
- **US3.5** (Phase 17): Depends on US2.2 and US3.4 completion (staff updates during negotiation)

**Epic 4 (Quote to Work Order Conversion)**:
- **US4.1** (Phase 9): Depends on US3.2 completion (converts approved quotes)
- **US4.2** (Phase 20): Depends on US4.1 completion (views linked work orders)

**Epic 5 (Quote Management and Visibility)**:
- **US5.1** (Phase 5): Can start after Foundational - Integrates with US1.1 and US2.1
- **US5.2** (Phase 18): Depends on US2.1 completion (enhances quote list)
- **US5.3** (Phase 19): Depends on US3.5 completion (shows revision history)
- **US5.4** (Phase 21): Depends on US2.1 completion (exports quote list data)

**Epic 6 (Quote Expiry and Renewal)**:
- **US6.1** (Phase 13): Depends on US2.2 completion (monitors provided quotes)
- **US6.2** (Phase 22): Depends on US6.1 completion (renews expired quotes)

### Within Each User Story

- Models before services
- Services before controllers
- Controllers before routes
- Backend endpoints before frontend components
- Core implementation before UI integration
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**:
```bash
# T005, T006, T007 can run in parallel (different model files)
```

**Foundational Phase (Phase 2)**:
```bash
# T010, T011, T012 can run in parallel (different service/middleware files)
```

**Within Each User Story Phase**:
- All tasks marked [P] can run in parallel (different files, no dependencies)
- Backend [P] tasks can run parallel to frontend [P] tasks if no endpoint dependency
- Example US1.1: T014, T015, T016 (backend endpoints) can be done while T020, T026, T027, T028 (frontend) are in progress

---

## Implementation Strategy

### MVP First (US1.1, US2.1, US2.2, US3.1, US3.2, US4.1, US5.1 - Core Workflow)

**Phase 1 MVP Scope**:
1. Complete Phase 1: Setup (database schema, models)
2. Complete Phase 2: Foundational (routes, middleware, services)
3. Complete Phase 3: US1.1 (Client creates quote request)
4. Complete Phase 4: US2.1 (Staff views pending quotes)
5. Complete Phase 5: US5.1 (Dashboard widget)
6. Complete Phase 6: US2.2 (Staff provides quote)
7. Complete Phase 7: US3.1 (Client reviews quote)
8. Complete Phase 8: US3.2 (Client approves quote)
9. Complete Phase 9: US4.1 (Staff converts to work order)
10. **STOP and VALIDATE**: Test complete workflow end-to-end
11. Deploy/demo MVP

**MVP delivers**: Basic quote request → provide → approve → convert workflow (as defined in spec.md Phase 1)

### Incremental Delivery (Phase 2 features)

After MVP validated:
1. Add Phase 10: US2.3 (Request more info)
2. Add Phase 11: US2.4 (Staff decline)
3. Add Phase 12: US3.3 (Client decline)
4. Add Phase 13: US6.1 (Quote expiry monitoring)
5. Test independently → Deploy/Demo Phase 2

### Enhanced Features (Phase 3 features)

1. Add Phase 14: US1.2 (Housing coordinator access)
2. Add Phase 15: US1.3 (Draft functionality)
3. Add Phase 16: US3.4 (Messaging)
4. Add Phase 17: US3.5 (Quote updates/revisions)
5. Add Phase 18: US5.2 (Advanced filtering)
6. Add Phase 19: US5.3 (Timeline/history)
7. Add Phase 22: US6.2 (Quote renewal)
8. Test independently → Deploy/Demo Phase 3

### Polish & Optional Features

1. Add Phase 20: US4.2 (Work order linking)
2. Add Phase 21: US5.4 (CSV export - Could Have)
3. Complete Phase 23: Polish (documentation, optimization, security)

### Parallel Team Strategy

With 2 developers:
1. Both complete Setup + Foundational together (Phase 1-2)
2. Once Foundational done:
   - **Developer A**: Backend for US1.1, US2.1, US2.2 (Phases 3, 4, 6 backend)
   - **Developer B**: Frontend for US1.1, US2.1, US2.2 (Phases 3, 4, 6 frontend)
3. Both work on US3.1, US3.2, US4.1 integration (Phases 7-9)
4. Continue pattern for remaining phases

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability (e.g., [US1.1], [US2.2])
- **Each user story**: Should be independently completable and testable
- **Commit**: After each task or logical group of related tasks
- **Checkpoints**: Stop at each checkpoint to validate story works independently
- **Must Have stories**: Should be prioritized for MVP (US1.1, US2.1, US2.2, US3.1, US3.2, US4.1, US5.1, US2.3, US2.4, US3.3, US6.1)
- **Should Have stories**: Add after MVP validated (US1.2, US1.3, US3.4, US3.5, US5.2, US5.3, US6.2, US4.2)
- **Could Have stories**: Optional enhancements (US5.4)
- **Tests**: Not included per template default - add if explicitly requested in spec

---

## Total Task Count

- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (US1.1)**: 16 tasks
- **Phase 4 (US2.1)**: 14 tasks
- **Phase 5 (US5.1)**: 8 tasks
- **Phase 6 (US2.2)**: 14 tasks
- **Phase 7 (US3.1)**: 10 tasks
- **Phase 8 (US3.2)**: 12 tasks
- **Phase 9 (US4.1)**: 17 tasks
- **Phase 10 (US2.3)**: 21 tasks
- **Phase 11 (US2.4)**: 9 tasks
- **Phase 12 (US3.3)**: 10 tasks
- **Phase 13 (US6.1)**: 10 tasks
- **Phase 14 (US1.2)**: 8 tasks
- **Phase 15 (US1.3)**: 9 tasks
- **Phase 16 (US3.4)**: 11 tasks
- **Phase 17 (US3.5)**: 15 tasks
- **Phase 18 (US5.2)**: 14 tasks
- **Phase 19 (US5.3)**: 16 tasks
- **Phase 20 (US4.2)**: 8 tasks
- **Phase 21 (US5.4)**: 11 tasks
- **Phase 22 (US6.2)**: 14 tasks
- **Phase 23 (Polish)**: 17 tasks

**Total**: 277 tasks

**MVP Task Count** (Phases 1-9): 109 tasks
**Phase 2 Task Count** (Phases 10-13): 50 tasks
**Phase 3 Task Count** (Phases 14-22): 101 tasks
**Polish Task Count** (Phase 23): 17 tasks

---

## Suggested MVP Scope

**Recommended MVP**: Complete Phases 1-9 (US1.1, US2.1, US5.1, US2.2, US3.1, US3.2, US4.1)

This delivers the complete core quote workflow:
- Client admins request quotes
- Staff view and provide quotes
- Client admins approve quotes
- Staff convert to work orders
- Dashboard visibility

This aligns with spec.md Phase 1 (MVP) implementation plan.
