# Research: Quote Request Thank-You Email

## Decision 1: Email Delivery Method

**Decision**: Use Brevo template email via `sendBrevoTemplateEmail()` with Template #27.

**Rationale**: All existing quote notification emails use Brevo templates (Template #17 for submission to staff, Template #18 for quote provided to client). Using a template maintains consistency and allows non-developer editing of email content via the Brevo dashboard.

**Alternatives considered**:
- Inline HTML email via `sendSmtpEmail()` — Used by password reset and welcome emails. Rejected because quote emails consistently use Brevo templates, and inline HTML would create a mixed pattern.

## Decision 2: Notification Integration Point

**Decision**: Add a new function `notifyQuoteRequesterAcknowledgement()` in `quoteNotificationService.js` and call it from `submitQuote()` in `quote.controller.js`, immediately after the existing `notifyQuoteSubmitted()` call.

**Rationale**: The `submitQuote` controller already calls `quoteNotificationService.notifyQuoteSubmitted()` to notify WPSG staff. Adding the requester acknowledgement in the same try/catch block follows the established pattern and keeps all submission-triggered notifications co-located.

**Alternatives considered**:
- Adding the email send directly in the controller — Rejected to maintain separation of concerns (controller delegates to notification service).
- Creating a separate middleware — Over-engineering for a single email send.

## Decision 3: Recipient Resolution

**Decision**: Send the thank-you email to `quote.contact_email` (the contact email on the quote form), not the logged-in user's email.

**Rationale**: The `contact_email` field represents the person requesting the work. The logged-in user (client_admin/admin) may be submitting on someone else's behalf. The contact person is the one who needs the acknowledgement.

**Alternatives considered**:
- Sending to the logged-in user's email — Rejected because the requester may differ from the submitter.
- Sending to both — Over-scoped for a simple acknowledgement.

## Decision 4: Template Parameters

**Decision**: Pass `contact_person`, `quote_number`, `property_name`, and `description` as template params. These match the "Standard" content level decided during clarification.

**Rationale**: These four fields provide enough context for the requester to identify their submission and serve as a receipt, without overwhelming the email with unnecessary detail.

**Alternatives considered**:
- Including all fields (address, phone, urgency, required-by date) — Rejected as "Detailed" level was not chosen.
- Only quote number — Rejected as "Minimal" level was not chosen.

## Decision 5: Failure Handling Pattern

**Decision**: Wrap the email send in a try/catch that logs errors but does not propagate. Same pattern as `notifyQuoteSubmitted()`.

**Rationale**: Constitution Principle VII (Integration Resilience) requires external service calls to be failure-tolerant. The existing `notifyQuoteSubmitted` call already follows this pattern in `submitQuote()`.

**Alternatives considered**:
- Retrying on failure — Over-engineering for a simple acknowledgement email.
- Throwing errors — Violates integration resilience principle.
