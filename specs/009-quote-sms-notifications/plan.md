# Implementation Plan: Quote SMS Notifications

**Branch**: `009-quote-sms-notifications` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-quote-sms-notifications/spec.md`

## Summary

Add SMS notifications to WPSG admin users at 6 key stages of the quote lifecycle (Submitted, Quoted, Approved, Declined, Converted, Information Requested). SMS messages are brief (≤160 chars) with quote number, event description, and app link. Implementation adds a helper to read admin numbers from `ADMIN_SMS_NUMBERS` env var and calls the existing `smsService.sendSMS()` from within each notification function in `quoteNotificationService.js`. No new routes, database changes, or frontend changes required.

## Technical Context

**Language/Version**: Node.js 18.x  
**Primary Dependencies**: Express 4.x, existing `smsService.js` (webhook-based SMS via n8n)  
**Storage**: N/A — no database changes  
**Testing**: Manual testing via quote lifecycle actions; verify SMS delivery to configured numbers  
**Target Platform**: Linux server (Render deployment)  
**Project Type**: Web application (backend only for this feature)  
**Performance Goals**: SMS sent within 30 seconds of quote status change (non-blocking)  
**Constraints**: SMS ≤160 characters; SMS failures must not block quote workflows  
**Scale/Scope**: ~6 SMS per quote lifecycle × number of admin recipients (low volume)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Mobile-First Design**: N/A — backend-only, no UI changes. SMS received on mobile devices by nature.
- [x] **Multi-Client Data Isolation**: N/A — SMS sent to configured admin numbers, not client-specific data queries.
- [x] **Role-Based Access**: N/A — no new API routes. SMS triggered from existing role-protected endpoints.
- [x] **Brand Consistency**: N/A — no UI changes.
- [x] **Environment Parity**: SMS sending controlled by `SMS_ENABLED` env var; same code across all environments. `ADMIN_SMS_NUMBERS` configured per environment.
- [ ] **Release Documentation**: Version bump and release notes to be prepared during implementation.
- [x] **Integration Resilience**: SMS calls are fire-and-forget within try/catch blocks, matching existing pattern in `workOrder.controller.js` where SMS failures log but don't block.

## Project Structure

### Documentation (this feature)

```
specs/009-quote-sms-notifications/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (files modified)

```
backend/
├── services/
│   ├── smsService.js                # Existing — no changes needed
│   └── quoteNotificationService.js  # Modified — add SMS calls to 6 notification functions
├── .env.example                     # Modified — add ADMIN_SMS_NUMBERS
└── .env                             # Modified — add ADMIN_SMS_NUMBERS (local dev)
```

**Structure Decision**: Backend-only modification. Single file change (`quoteNotificationService.js`) plus env var documentation. No new files, routes, models, or frontend changes.

## Complexity Tracking

*No constitution violations. Feature is straightforward backend enhancement.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

