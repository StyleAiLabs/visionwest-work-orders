# Research: Quote SMS Notifications

**Feature**: 009-quote-sms-notifications  
**Date**: 2026-03-13

## R1: Existing SMS Service Pattern

**Decision**: Reuse `smsService.sendSMS(phoneNumber, message, metadata)` directly  
**Rationale**: The `sendSMS` method in `backend/services/smsService.js` already handles:
- Phone number cleaning/formatting to NZ format (`cleanPhoneNumber()`)
- SMS_ENABLED toggle check (returns early if disabled)
- Webhook payload construction and HTTP POST to n8n
- Error handling with non-throwing failure responses
- Timeout handling (15 second webhook timeout)

**Alternatives considered**:
- Creating a new `sendQuoteSMS()` wrapper method on the SMS service class — rejected because `sendSMS()` is already generic enough. The method accepts arbitrary `workOrderData` metadata which works for quote data too.
- Sending SMS from the controller layer instead of the notification service — rejected because the notification service is the established pattern for all quote notifications (email + in-app), and adding SMS there keeps all notification logic co-located.

## R2: Admin Phone Number Configuration

**Decision**: Read `ADMIN_SMS_NUMBERS` from `process.env`, split by comma, trim each number  
**Rationale**: This matches the pattern described in the feature spec (FR-010). Simple env var approach avoids database changes and allows per-environment configuration.

**Alternatives considered**:
- Storing admin phone numbers in the database (users table) — rejected because this would require schema changes, admin UI for phone number management, and the user story explicitly calls for env var configuration.
- Hardcoding phone numbers — rejected for obvious configuration flexibility reasons.

**Implementation detail**: Create a `getAdminSMSNumbers()` helper function that:
1. Reads `process.env.ADMIN_SMS_NUMBERS`
2. Returns empty array if unset/empty (with log warning)
3. Splits by comma and trims whitespace
4. Filters out empty strings

## R3: SMS Message Format

**Decision**: Format as `Quote {quote_number} {event}. View: {FRONTEND_URL}/quotes/{quoteId}`  
**Rationale**: Must stay under 160 characters per FR-008. Property name explicitly omitted per spec clarification.

**Message templates** (all under 160 chars with typical data):
| Event | Template | Example (chars) |
|-------|----------|-----------------|
| Submitted | `Quote QTE-2026-003 submitted. View: https://app.example.com/quotes/123` | ~72 |
| Quoted | `Quote QTE-2026-003 quoted ($1,500.00). View: https://app.example.com/quotes/123` | ~80 |
| Approved | `Quote QTE-2026-003 approved. View: https://app.example.com/quotes/123` | ~71 |
| Declined | `Quote QTE-2026-003 declined. View: https://app.example.com/quotes/123` | ~71 |
| Converted | `Quote QTE-2026-003 converted to WO WO-2026-050. View: https://app.example.com/quotes/123` | ~92 |
| Info Requested | `Quote QTE-2026-003 - info requested. View: https://app.example.com/quotes/123` | ~78 |

**Alternatives considered**:
- Including property name — rejected per spec clarification to keep messages concise.
- Including recipient greeting ("Hi Admin,") — rejected to save characters and keep messages uniform.
- Truncating messages at 157 + "..." — not needed since all templates are well under 160 chars.

## R4: Integration Point — Where to Add SMS Calls

**Decision**: Add SMS calls inside each of the 6 existing notification functions in `quoteNotificationService.js`  
**Rationale**: Each notification function is already the single place where email + in-app notifications fire for that event. Adding SMS there maintains the single-responsibility-per-event pattern.

**The 6 functions to modify**:
1. `notifyQuoteSubmitted()` — called from `quote.controller.js:submitQuote` (line ~323)
2. `notifyQuoteProvided()` — called from `quote.controller.js:provideQuote` (line ~740)
3. `notifyQuoteApproved()` — called from `quote.controller.js:approveQuote` (line ~877)
4. `notifyQuoteDeclinedByClient()` — called from `quote.controller.js` (decline route - future phase, but notification function exists)
5. `notifyQuoteConverted()` — called from `quote.controller.js:convertToWorkOrder` (line ~1100)
6. `notifyInfoRequested()` — called from `quote.controller.js:requestInfo` (line ~1383)

**Note on decline**: The `notifyQuoteDeclinedByClient()` function exists in the notification service but the decline route is not yet implemented (listed as future Phase 11-12 in routes). Adding SMS to the notification function means it will work automatically when the decline route is implemented.

**Alternatives considered**:
- Adding SMS calls in the controller after each notification call — rejected because it would scatter SMS logic across the controller and duplicate the admin number retrieval pattern.
- Creating a separate `quoteSmsService.js` — rejected as over-engineering; the SMS calls are simple one-liners that fit naturally inside the existing notification functions.

## R5: Error Handling Pattern

**Decision**: Wrap SMS calls in try/catch inside each notification function, log failures, never throw  
**Rationale**: Matches constitution principle VII (Integration Resilience) and the existing pattern in `workOrder.controller.js` where SMS failures are logged but don't block the operation.

**Pattern**:
```javascript
// Send SMS to admin numbers (non-blocking)
try {
    const adminNumbers = getAdminSMSNumbers();
    for (const phone of adminNumbers) {
        await smsService.sendSMS(phone, message, { quote_number: quote.quote_number });
    }
} catch (smsError) {
    console.error('SMS notification failed:', smsError.message);
}
```

**Note**: The `sendSMS` method itself already handles webhook failures gracefully (returns `{ success: false }` rather than throwing), but we wrap in try/catch as defense-in-depth.

## R6: Decline Function — Which One Gets SMS?

**Decision**: Add SMS to `notifyQuoteDeclinedByClient()` only (not `notifyQuoteDeclinedByStaff()`)  
**Rationale**: The spec says "SMS Alert on Quote Declined" (User Story 4) refers to when a *client* declines a quote — the admin needs to know. When *staff* declines, the notification goes to client users (not admin). The SMS feature is specifically for alerting WPSG admins of quote lifecycle events.

**Alternatives considered**:
- Adding SMS to both decline functions — rejected because `notifyQuoteDeclinedByStaff()` notifies client users, and the spec explicitly targets WPSG admin SMS notifications only.
