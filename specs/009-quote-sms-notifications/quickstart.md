# Quickstart: Quote SMS Notifications

**Feature**: 009-quote-sms-notifications  
**Date**: 2026-03-13

## Prerequisites

- Backend running locally (`cd backend && npm run dev`)
- `SMS_ENABLED=true` in `backend/.env`
- `SMS_WEBHOOK_URL` configured in `backend/.env` (n8n webhook endpoint)
- `FRONTEND_URL` configured in `backend/.env` (e.g., `http://localhost:5173`)

## Setup

Add to `backend/.env`:

```env
ADMIN_SMS_NUMBERS=021123456,0274567890
```

Replace with actual NZ mobile numbers for testing.

## Implementation Steps

### 1. Add helper function and SMS import to quoteNotificationService.js

At the top of `backend/services/quoteNotificationService.js`:

```javascript
const smsService = require('./smsService');

const getAdminSMSNumbers = () => {
    const numbersStr = process.env.ADMIN_SMS_NUMBERS || '';
    if (!numbersStr.trim()) {
        console.log('⚠ ADMIN_SMS_NUMBERS not configured - skipping admin SMS');
        return [];
    }
    return numbersStr.split(',').map(n => n.trim()).filter(n => n.length > 0);
};

const sendAdminQuoteSMS = async (message, quoteMetadata) => {
    const adminNumbers = getAdminSMSNumbers();
    if (adminNumbers.length === 0) return;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fullMessage = `${message} View: ${frontendUrl}/quotes/${quoteMetadata.quoteId}`;

    for (const phone of adminNumbers) {
        try {
            const result = await smsService.sendSMS(phone, fullMessage, quoteMetadata);
            if (result.success) {
                console.log(`✓ Quote SMS sent to ${phone}`);
            } else {
                console.log(`⚠ Quote SMS failed for ${phone}: ${result.reason || result.error}`);
            }
        } catch (err) {
            console.error(`✗ Quote SMS error for ${phone}:`, err.message);
        }
    }
};
```

### 2. Add SMS call to each notification function

Add `await sendAdminQuoteSMS(...)` inside the try block of each of the 6 functions, after existing email/notification logic.

### 3. Update .env.example

Add `ADMIN_SMS_NUMBERS=` to `backend/.env.example`.

## Testing

1. Configure `ADMIN_SMS_NUMBERS` with your test phone number
2. Submit a quote via the app (as client_admin)
3. Verify SMS received with format: `Quote QTE-XXXX-XXX submitted. View: {url}`
4. Test with `SMS_ENABLED=false` — verify no SMS sent, logged as disabled
5. Test with `ADMIN_SMS_NUMBERS` empty — verify no SMS sent, logged as not configured
6. Repeat for: provide quote, approve, decline, convert, request info

## Verification Checklist

- [ ] SMS received for submitted event
- [ ] SMS received for quoted event (includes cost)
- [ ] SMS received for approved event
- [ ] SMS received for declined event
- [ ] SMS received for converted event (includes WO number)
- [ ] SMS received for info requested event
- [ ] No SMS for draft saves, expired, expiring soon events
- [ ] All SMS under 160 characters
- [ ] App link in SMS navigates to correct quote
- [ ] SMS disabled when SMS_ENABLED=false
- [ ] No SMS when ADMIN_SMS_NUMBERS is empty
- [ ] Quote workflow completes normally even if SMS webhook fails
