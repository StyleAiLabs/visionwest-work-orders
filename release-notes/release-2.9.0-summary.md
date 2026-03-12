# Release 2.9.0 - Quote Request Thank-You Email

**Release Date:** March 12, 2026
**Type:** Minor Version Update

## Summary
Version 2.9.0 adds an automatic acknowledgement email sent to quote requesters when their quote request is submitted. This provides immediate confirmation that the request has been received and is being processed, reducing uncertainty and follow-up inquiries.

## New Features

### 📧 Quote Requester Acknowledgement Email
- **Automatic Trigger**: When a quote request is submitted (status changes to "Submitted"), a thank-you email is sent to the contact email address on the quote
- **Brevo Template #27**: Uses a branded Brevo template consistent with existing quote notification emails
- **Key Details Included**: Quote reference number, property name, work description summary, and next-steps guidance
- **Non-Blocking**: Email delivery failures do not affect quote submission — the submission always succeeds and any email errors are logged silently

### Email Content
The acknowledgement email includes:
- Personalized greeting using the contact person name
- Quote reference number (e.g., QTE-2026-003)
- Property name
- Description of the requested work
- Next steps message confirming the request is under review

## Technical Details

### Files Modified
| File | Change |
|------|--------|
| `backend/services/quoteNotificationService.js` | Added `notifyQuoteRequesterAcknowledgement()` function |
| `backend/controllers/quote.controller.js` | Added call to new function in `submitQuote()` flow |

### Integration Pattern
- Follows the same failure-tolerant pattern as existing `notifyQuoteSubmitted()` (Template #17)
- Wrapped in independent try/catch — email failure never blocks quote submission
- Sends to `quote.contact_email` (the requester), not the logged-in user

### No Breaking Changes
- No database migrations required
- No API response changes
- No frontend changes
- Existing quote submission behavior unchanged
