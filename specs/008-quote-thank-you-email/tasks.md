# Tasks: Quote Request Thank-You Email

**Input**: Design documents from `/specs/008-quote-thank-you-email/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: No project setup required — existing project, existing branch (`008-quote-thank-you-email`)

*No tasks — project structure, dependencies, and configuration already in place.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify external dependency (Brevo Template #27) exists before implementing code

- [x] T001 Confirm Brevo Template #27 exists in Brevo dashboard with params: `contact_person`, `quote_number`, `property_name`, `description`

**Checkpoint**: Template verified — implementation can proceed

---

## Phase 3: User Story 1 — Requester Receives Thank-You Email (Priority: P1) 🎯 MVP

**Goal**: Send a thank-you acknowledgement email to the quote's `contact_email` when a quote is submitted

**Independent Test**: Submit a quote request and verify an email is delivered to the contact email address

### Implementation for User Story 1

- [x] T002 [US1] Add `notifyQuoteRequesterAcknowledgement(quote)` function in `backend/services/quoteNotificationService.js` — sends Brevo Template #27 to `quote.contact_email` with params `contact_person`, `quote_number`, `property_name`, `description`
- [x] T003 [US1] Call `notifyQuoteRequesterAcknowledgement(quote)` from `submitQuote()` in `backend/controllers/quote.controller.js` — place after existing `notifyQuoteSubmitted(quote)` call, in its own try/catch block
- [ ] T004 [US1] Manual test: submit a quote and verify thank-you email is received at the contact email address with correct quote number

**Checkpoint**: Quote submission triggers acknowledgement email to requester. Email failure does not block submission.

---

## Phase 4: User Story 2 — Email Contains Useful Context (Priority: P2)

**Goal**: Ensure the thank-you email includes quote number, property name, description summary, and next steps

**Independent Test**: Read the delivered email and confirm all expected fields are present

### Implementation for User Story 2

*Note: US2 content is delivered by the Brevo Template #27 layout. The params are already passed in T002. This phase verifies template content.*

- [ ] T005 [US2] Verify Brevo Template #27 renders `contact_person`, `quote_number`, `property_name`, `description`, and includes a next-steps message (e.g., "Our team will review your request and provide a quote")
- [ ] T006 [US2] Manual test: read delivered email and confirm it contains quote reference number, property name, description summary, and next-steps guidance

**Checkpoint**: Email content matches spec requirements (FR-002, FR-003)

---

## Phase 4b: User Story 3 — WPSG Staff/Admin Notification Fix (Priority: P1)

**Goal**: Ensure WPSG staff/admin receive correctly formatted notification emails on quote submission, with dynamic WPSG identification

**Independent Test**: Submit a quote and verify all active WPSG staff/admin users receive a notification email with correct submitter name, client name, and quote details

### Implementation for User Story 3

- [x] T010 [US3] Fix `getWPSGStaffUsers()` in `backend/services/quoteNotificationService.js` — replace hardcoded `client_id: 8` with dynamic `Client.findOne({ where: { code: 'WPSG' } })` lookup (FR-009)
- [x] T011 [US3] Fix `notifyQuoteSubmitted()` Template #17 params in `backend/services/quoteNotificationService.js` — rename `submitted_by` → `submitted_by_name`, add `recipient_name` and `client_name` params. Add `Client` model include to `submitQuote()` query in `backend/controllers/quote.controller.js` (FR-007, FR-008)
- [ ] T012 [US3] Manual test: submit a quote and verify WPSG staff receive notification email with correct recipient name, submitter name, and client name

**Checkpoint**: WPSG staff/admin receive notification emails with correct param values. Dynamic WPSG lookup works across all environments.

---

## Phase 5: Polish & Release

**Purpose**: Version bump and release documentation

- [x] T007 [P] Bump version in `frontend/package.json` to 2.9.0
- [x] T008 [P] Create release notes in `release-notes/release-2.9.0-summary.md`
- [ ] T009 Run quickstart.md validation (full test flow from `specs/008-quote-thank-you-email/quickstart.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: N/A — no tasks
- **Phase 2 (Foundational)**: Verify Brevo template — BLOCKS Phase 3
- **Phase 3 (US1 - P1)**: Depends on Phase 2. Core implementation (2 files).
- **Phase 4b (US3 - P1)**: Independent of Phase 4. Fixes existing `notifyQuoteSubmitted()` flow.
- **Phase 4 (US2 - P2)**: Depends on Phase 3. Template content verification.
- **Phase 5 (Polish)**: Depends on Phase 3 completion. T007 and T008 can run in parallel.

### Within Phase 3

- T002 (service function) before T003 (controller call) — controller depends on new function
- T004 (manual test) after T003 — requires both code changes

### Parallel Opportunities

- T007 and T008 can run in parallel (different files, no dependencies)
- T005 and T006 are sequential (verify template, then test delivery)
