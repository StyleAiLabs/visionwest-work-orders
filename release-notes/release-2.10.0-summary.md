# Release 2.10.0 - Quote SMS Notifications

**Release Date:** March 13, 2026
**Type:** Minor Version Update

## Summary
Version 2.10.0 adds SMS notifications to WPSG admin users at 6 key stages of the quote lifecycle. Admins receive a brief SMS with the quote number, event description, and a direct link to view the quote in the app. This ensures admins are immediately aware of quote activity without needing to be logged in.

## New Features

### 📱 Quote Lifecycle SMS Alerts
- **Quote Submitted**: SMS sent when a client submits a new quote request
- **Quote Quoted**: SMS sent when staff provides pricing (includes estimated cost)
- **Quote Approved**: SMS sent when a client approves a quote
- **Quote Declined**: SMS sent when a client declines a quote
- **Quote Converted**: SMS sent when a quote is converted to a work order (includes WO number)
- **Information Requested**: SMS sent when staff requests more information on a quote

### SMS Format
All messages follow a concise format under 160 characters:
```
Quote QTE-2026-003 submitted. View: https://nextgen-wom.netlify.app/quotes/123
```

### Configuration
- `ADMIN_SMS_NUMBERS` environment variable: comma-separated NZ mobile numbers
- Uses existing `SMS_ENABLED` toggle — set to `false` to disable all SMS
- Multiple admin recipients supported

## Technical Details

### Files Modified
| File | Change |
|------|--------|
| `backend/services/quoteNotificationService.js` | Added smsService import, `getAdminSMSNumbers()` helper, `sendAdminQuoteSMS()` helper, SMS calls in 6 notification functions |
| `backend/.env.example` | Added `ADMIN_SMS_NUMBERS` env var documentation |

### Integration Pattern
- Reuses existing `smsService.sendSMS(phone, message, metadata)` webhook integration
- SMS calls placed after existing email/notification logic in each function
- Per-number try/catch — one failed number doesn't block others
- Non-blocking — SMS failures logged but never block quote workflows

### Events Excluded from SMS (by design)
- Draft saves
- Quote expired
- Quote expiring soon
- Quote renewed
- New messages
- Quote updated
- Staff-initiated declines

### No Breaking Changes
- No database migrations required
- No API response changes
- No frontend changes (except version bump and release notes entry)
- Existing notification behavior unchanged
