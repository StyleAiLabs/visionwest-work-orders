# Implementation Plan: Quote Request Thank-You Email

**Branch**: `008-quote-thank-you-email` | **Date**: 2026-03-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-quote-thank-you-email/spec.md`

## Summary

Add an acknowledgement email notification sent to the quote requester's contact email when a quote request is submitted. The email uses Brevo Template #27 and includes the quote number, property name, description summary, and next-step guidance. This integrates into the existing `submitQuote` flow in `quoteNotificationService.js`, following the same async, failure-tolerant pattern used by `notifyQuoteSubmitted` (Template #17).

**Amendment (US3)**: Fix the existing WPSG staff notification (Template #17) to use correct Brevo param names (`recipient_name`, `submitted_by_name`, `client_name`), replace hardcoded `client_id: 8` with dynamic WPSG lookup by `code`, and add `Client` model include to the `submitQuote()` query.

## Technical Context

**Language/Version**: Node.js 18.x (backend)
**Primary Dependencies**: Express 4.x, Sequelize 6.x, @getbrevo/brevo (Brevo SDK)
**Storage**: PostgreSQL (no schema changes — uses existing `quotes` table)
**Testing**: Manual testing via quote submission flow
**Target Platform**: Linux server (Render)
**Project Type**: Web application (backend-only change)
**Performance Goals**: N/A — single async email send per quote submission
**Constraints**: Email send must not block quote submission response
**Scale/Scope**: One new notification function, one call site addition

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Mobile-First Design**: No UI changes required; email is server-side only
- [x] **Multi-Client Data Isolation**: Email uses data from the quote being submitted; no cross-client query
- [x] **Role-Based Access**: No new API routes; uses existing `submitQuote` endpoint with existing middleware
- [x] **Brand Consistency**: Email content managed in Brevo Template #27 (external to codebase)
- [x] **Environment Parity**: Uses same `sendBrevoTemplateEmail` utility across all environments
- [x] **Release Documentation**: Version bump and release notes to be prepared
- [x] **Integration Resilience**: Follows existing pattern — try/catch with console.error, does not block submission

## Project Structure

### Documentation (this feature)

```
specs/008-quote-thank-you-email/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```
backend/
├── services/
│   └── quoteNotificationService.js  # ADD: notifyQuoteRequesterAcknowledgement()
│                                     # FIX: getWPSGStaffUsers() dynamic lookup
│                                     # FIX: notifyQuoteSubmitted() Template #17 params
└── controllers/
    └── quote.controller.js          # MODIFY: call new notification in submitQuote()
│                                     # MODIFY: add Client include to submitQuote() query
```

**Structure Decision**: Backend-only change. No frontend, migration, or new route needed. Two files modified (3 changes total: 1 new function, 2 bug fixes).

## Complexity Tracking

*No constitution violations — table not needed.*

