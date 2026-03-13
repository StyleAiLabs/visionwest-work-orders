# Tasks: Quote SMS Notifications

**Input**: Design documents from `/specs/009-quote-sms-notifications/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. All 6 stories modify the same file (`quoteNotificationService.js`) but target independent functions, so stories can be implemented sequentially within a single phase or grouped by priority.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add shared SMS infrastructure to the notification service

- [x] T001 Add `ADMIN_SMS_NUMBERS` env var to `backend/.env.example` with comment documenting comma-separated NZ mobile format
- [ ] T002 [P] Add `ADMIN_SMS_NUMBERS` to local `backend/.env` with test phone number(s)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared helper functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story SMS can work until these helpers are in place

- [x] T003 Import `smsService` at top of `backend/services/quoteNotificationService.js` — add `const smsService = require('./smsService');`
- [x] T004 Add `getAdminSMSNumbers()` helper function to `backend/services/quoteNotificationService.js` — reads `process.env.ADMIN_SMS_NUMBERS`, returns empty array with log if unset, splits by comma, trims whitespace, filters empty strings
- [x] T005 Add `sendAdminQuoteSMS(message, quoteMetadata)` helper function to `backend/services/quoteNotificationService.js` — calls `getAdminSMSNumbers()`, constructs full message with `FRONTEND_URL/quotes/{quoteId}` link, loops over numbers calling `smsService.sendSMS()` with per-number try/catch, logs success/failure per number

**Checkpoint**: Helpers ready — user story SMS calls can now be added

---

## Phase 3: User Story 1 — SMS Alert on Quote Submission (Priority: P1) 🎯 MVP

**Goal**: WPSG admins receive SMS when a client submits a new quote request

**Independent Test**: Submit a quote as a client user → verify configured admin number(s) receive SMS with format `Quote QTE-XXXX-XXX submitted. View: {FRONTEND_URL}/quotes/{id}`

### Implementation

- [x] T006 [US1] Add `sendAdminQuoteSMS()` call inside `exports.notifyQuoteSubmitted()` in `backend/services/quoteNotificationService.js` — message: `Quote {quote_number} submitted.`, metadata: `{ quoteId: quote.id, quote_number: quote.quote_number }`. Place after existing email/notification logic, inside try/catch

**Checkpoint**: MVP complete — quote submission SMS working end-to-end

---

## Phase 4: User Story 2 — SMS Alert on Quote Provided (Priority: P1)

**Goal**: WPSG admins receive SMS when a staff member provides a quote with pricing

**Independent Test**: Provide a quote with estimated cost as staff → verify admin receives SMS with format `Quote QTE-XXXX-XXX quoted ($X,XXX.XX). View: {url}`

### Implementation

- [x] T007 [US2] Add `sendAdminQuoteSMS()` call inside `exports.notifyQuoteProvided()` in `backend/services/quoteNotificationService.js` — message: `Quote {quote_number} quoted (${estimated_cost}).`, metadata: `{ quoteId: quote.id, quote_number: quote.quote_number }`

**Checkpoint**: Quote submission + provided SMS both working

---

## Phase 5: User Story 3 — SMS Alert on Quote Approved (Priority: P1)

**Goal**: WPSG admins receive SMS when a client approves a quote

**Independent Test**: Approve a quote as a client → verify admin receives SMS with format `Quote QTE-XXXX-XXX approved. View: {url}`

### Implementation

- [x] T008 [US3] Add `sendAdminQuoteSMS()` call inside `exports.notifyQuoteApproved()` in `backend/services/quoteNotificationService.js` — message: `Quote {quote_number} approved.`, metadata: `{ quoteId: quote.id, quote_number: quote.quote_number }`

**Checkpoint**: All P1 stories (submit, provide, approve) SMS working

---

## Phase 6: User Story 4 — SMS Alert on Quote Declined (Priority: P2)

**Goal**: WPSG admins receive SMS when a client declines a quote

**Independent Test**: Decline a quote as client → verify admin receives SMS with format `Quote QTE-XXXX-XXX declined. View: {url}`

### Implementation

- [x] T009 [US4] Add `sendAdminQuoteSMS()` call inside `exports.notifyQuoteDeclinedByClient()` in `backend/services/quoteNotificationService.js` — message: `Quote {quote_number} declined.`, metadata: `{ quoteId: quote.id, quote_number: quote.quote_number }`. Note: do NOT add SMS to `notifyQuoteDeclinedByStaff()` per research decision R6

**Checkpoint**: Declined SMS working

---

## Phase 7: User Story 5 — SMS Alert on Quote Converted to Work Order (Priority: P2)

**Goal**: WPSG admins receive SMS when a quote is converted into a work order

**Independent Test**: Convert an approved quote to work order → verify admin receives SMS with format `Quote QTE-XXXX-XXX converted to WO {job_no}. View: {url}`

### Implementation

- [x] T010 [US5] Add `sendAdminQuoteSMS()` call inside `exports.notifyQuoteConverted()` in `backend/services/quoteNotificationService.js` — message: `Quote {quote_number} converted to WO {workOrder.job_no}.`, metadata: `{ quoteId: quote.id, quote_number: quote.quote_number }`

**Checkpoint**: Converted SMS working with both quote and WO references

---

## Phase 8: User Story 6 — SMS Alert on Information Requested (Priority: P2)

**Goal**: WPSG admins receive SMS when staff requests more information on a quote

**Independent Test**: Request info on a quote as staff → verify admin receives SMS with format `Quote QTE-XXXX-XXX - info requested. View: {url}`

### Implementation

- [x] T011 [US6] Add `sendAdminQuoteSMS()` call inside `exports.notifyInfoRequested()` in `backend/services/quoteNotificationService.js` — message: `Quote {quote_number} - info requested.`, metadata: `{ quoteId: quote.id, quote_number: quote.quote_number }`

**Checkpoint**: All 6 SMS notification events implemented

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and release prep

- [x] T012 [P] Verify all 6 SMS message templates are under 160 characters with realistic data (longest URL + longest quote number) in `backend/services/quoteNotificationService.js`
- [x] T013 [P] Verify no SMS is triggered for non-specified events (Draft, Under Discussion, Expired, Expiring Soon) — confirm `notifyQuoteExpiringSoon()`, `notifyQuoteExpired()`, `notifyQuoteRenewed()`, `notifyNewMessage()`, `notifyQuoteUpdated()` have NO `sendAdminQuoteSMS()` calls
- [ ] T014 Run quickstart.md verification checklist — test all 12 scenarios listed in `specs/009-quote-sms-notifications/quickstart.md`
- [x] T015 [P] Update version number and prepare release notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (env var exists) — BLOCKS all user stories
- **User Stories (Phases 3–8)**: All depend on Phase 2 completion (T003–T005)
  - Within each story: single task, no sub-dependencies
  - Stories can be implemented sequentially (recommended — same file) or in any priority order
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 — no dependencies on other stories
- **US2 (P1)**: Depends only on Phase 2 — independent of US1
- **US3 (P1)**: Depends only on Phase 2 — independent of US1/US2
- **US4 (P2)**: Depends only on Phase 2 — independent (note: decline route may not be implemented yet, but notification function exists)
- **US5 (P2)**: Depends only on Phase 2 — independent
- **US6 (P2)**: Depends only on Phase 2 — independent

### Within Each User Story

- Single task per story (add SMS call to existing function)
- No model/service/endpoint layering needed — all infrastructure exists

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003, T004, T005 are sequential (same file, each builds on prior)
- T006–T011 are sequential (same file) but logically independent
- T012 and T013 can run in parallel (read-only validation)

---

## Parallel Example: Setup Phase

```bash
# Launch env var tasks together:
Task T001: "Add ADMIN_SMS_NUMBERS to backend/.env.example"
Task T002: "Add ADMIN_SMS_NUMBERS to backend/.env"
```

## Parallel Example: Polish Phase

```bash
# Launch validation tasks together:
Task T012: "Verify SMS message lengths"
Task T013: "Verify no SMS on non-specified events"
Task T015: "Update version and release notes"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T005)
3. Complete Phase 3: User Story 1 (T006)
4. **STOP and VALIDATE**: Submit a quote, verify SMS received
5. Deploy/demo if ready — single event SMS proves the pattern

### Incremental Delivery

1. Setup + Foundational → SMS infrastructure ready
2. Add US1 (submitted) → Test → Deploy (MVP!)
3. Add US2 (quoted) + US3 (approved) → Test → Deploy (all P1 complete)
4. Add US4 (declined) + US5 (converted) + US6 (info requested) → Test → Deploy (all P2 complete)
5. Polish → Final validation and release

### Single-Developer Strategy (Recommended)

Since all user story tasks modify the same file (`quoteNotificationService.js`):

1. Complete Setup + Foundational (T001–T005)
2. Implement all 6 SMS calls sequentially (T006–T011) — fastest approach
3. Validate all at once with quickstart checklist (T014)
4. Polish and release (T012–T015)

---

## Notes

- All 6 user story tasks modify the same file — sequential implementation recommended
- No database changes, no new files, no frontend changes, no new routes
- SMS failures are non-blocking by design (try/catch in `sendAdminQuoteSMS` helper)
- `sendSMS()` already handles SMS_ENABLED toggle — no additional check needed
- Decline SMS goes to `notifyQuoteDeclinedByClient()` only, not `notifyQuoteDeclinedByStaff()` (per R6)
- The decline route is not yet implemented but the notification function exists — SMS will activate when the route is added
