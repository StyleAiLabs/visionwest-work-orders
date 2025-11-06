# Brevo Email Notifications - Quote Management System

## Overview

This document describes the email notification implementation for the quote management system using Brevo transactional email templates.

## Implementation Date

November 5, 2025

## Templates Implemented

The following Brevo email templates have been integrated into the quote notification service:

| Template ID | Event | Recipient | Description |
|-------------|-------|-----------|-------------|
| #17 | Quote Submitted | WPSG Staff | Notifies staff when a new quote request is submitted |
| #18 | Quote Provided | Client Admin | Notifies client when a quote has been provided |
| #19 | Quote Approved | WPSG Staff | Notifies staff when a quote has been approved |
| #20 | Quote Declined by Client | WPSG Staff | Notifies staff when client declines a quote |
| #21 | More Information Requested | Client Admin | Notifies client when staff needs more information |
| #22 | Quote Converted | Client Admin | Notifies client when quote is converted to work order |
| #23 | Quote Expiring Soon | Client Admin | Notifies client 3 days before quote expiration |
| #24 | Quote Expired | Client Admin | Notifies client when a quote has expired |

## Templates Excluded (Phase 3)

As specified in the requirements, the following templates were NOT implemented:

- Quote Updated - Notify Client Admin (Phase 3)
- Quote Renewed - Notify Client Admin (Phase 3)

## Architecture

### Files Modified

1. **backend/utils/emailService.js**
   - Added `sendBrevoTemplateEmail()` function
   - Centralized Brevo template email sending logic
   - Non-blocking error handling

2. **backend/services/quoteNotificationService.js**
   - Updated all 8 notification functions to send Brevo emails
   - Maintained existing in-app notification functionality
   - Added email service integration

3. **backend/controllers/quote.controller.js**
   - Fixed `requestInfo()` function to properly pass user object to notification service

### Function: `sendBrevoTemplateEmail()`

```javascript
exports.sendBrevoTemplateEmail = async ({ templateId, to, params = {}, subject = '' }) => {
  // Sends email using Brevo transactional template
  // Parameters:
  //   - templateId: Brevo template ID (number)
  //   - to: Array of recipients [{ email, name }]
  //   - params: Object with template variables
  //   - subject: Optional subject (if not in template)
}
```

### Error Handling

- All email sending is **non-blocking**
- Errors are logged but don't fail business operations
- If Brevo API is not initialized, emails are skipped with warning
- Graceful fallback ensures quote operations continue even if email fails

## Template Parameters

Each template receives the following parameters (varies by template):

### Common Parameters
- `quote_number`: Quote reference number (e.g., "QTE-2025-001")
- `property_name`: Property name
- `property_address`: Property address
- `description`: Quote description
- `estimated_cost`: Formatted cost (e.g., "1000.00")

### Template-Specific Parameters

#### Template #17 (Quote Submitted)
```javascript
{
  quote_number,
  submitted_by,
  property_name,
  property_address,
  description,
  is_urgent,
  contact_person,
  contact_email,
  contact_phone,
  required_by_date
}
```

#### Template #18 (Quote Provided)
```javascript
{
  quote_number,
  property_name,
  property_address,
  estimated_cost,
  estimated_hours,
  quote_notes,
  quote_valid_until,
  description
}
```

#### Template #19 (Quote Approved)
```javascript
{
  quote_number,
  approved_by,
  property_name,
  property_address,
  estimated_cost,
  estimated_hours,
  description
}
```

#### Template #20 (Quote Declined by Client)
```javascript
{
  quote_number,
  declined_by,
  decline_reason,
  property_name,
  property_address,
  estimated_cost,
  description
}
```

#### Template #21 (More Information Requested)
```javascript
{
  quote_number,
  property_name,
  property_address,
  requested_by,
  request_message,
  description
}
```

#### Template #22 (Quote Converted)
```javascript
{
  quote_number,
  work_order_number,
  property_name,
  property_address,
  estimated_cost,
  description,
  converted_by
}
```

#### Template #23 (Quote Expiring Soon)
```javascript
{
  quote_number,
  property_name,
  property_address,
  estimated_cost,
  quote_valid_until,
  days_until_expiry,
  description
}
```

#### Template #24 (Quote Expired)
```javascript
{
  quote_number,
  property_name,
  property_address,
  estimated_cost,
  expired_date,
  description
}
```

## Configuration

### Environment Variables

The following environment variable is required:

```bash
BREVO_API_KEY=your-brevo-api-key
```

Optional:
```bash
EMAIL_USER=noreply@nextgenwom.com  # Default sender email
```

### Testing

1. **Local Development**: Set `BREVO_API_KEY` in `.env` file
2. **Staging**: Configure in Render environment variables
3. **Production**: Configure in Render environment variables

### Verification

To verify emails are being sent:

1. Check application logs for:
   - `✅ Brevo template email sent (template #XX) to...`
   - `⚠️  Brevo API not initialized` (if key missing)
   - `❌ Failed to send Brevo template email` (if error occurs)

2. Check Brevo dashboard:
   - Transactional > Logs
   - View sent emails and delivery status

## Notification Flow

### Example: Quote Submission Flow

1. Client admin submits quote via API: `POST /api/quotes/:id/submit`
2. Quote status changes: `Draft` → `Submitted`
3. `notifyQuoteSubmitted()` is called
4. For each WPSG staff member:
   - In-app notification created
   - Email sent via Brevo Template #17
5. Staff members receive:
   - In-app notification (bell icon)
   - Email notification (inbox)

### Example: Quote Provided Flow

1. Staff provides quote via API: `PATCH /api/quotes/:id/provide-quote`
2. Quote status changes: `Submitted` → `Quoted`
3. `notifyQuoteProvided()` is called
4. For each client user (client and client_admin):
   - In-app notification created
   - Email sent via Brevo Template #18
5. Client users receive:
   - In-app notification
   - Email with quote details

## Troubleshooting

### Emails Not Being Sent

1. **Check BREVO_API_KEY**: Verify environment variable is set
2. **Check Logs**: Look for Brevo initialization message on startup
3. **Check Brevo Dashboard**: Verify API key is valid and has credits
4. **Check Template IDs**: Ensure templates #17-24 exist in Brevo account

### Common Errors

- `Brevo API not initialized`: BREVO_API_KEY not set
- `No recipients provided`: User query returned empty array
- `Template not found`: Template ID doesn't exist in Brevo account

## Future Enhancements (Phase 3)

The following notifications will be added in Phase 3:

1. **Quote Updated**: Template ID TBD
   - Triggered when staff updates cost/hours on existing quote
   - Notifies client admins of changes

2. **Quote Renewed**: Template ID TBD
   - Triggered when staff renews an expired quote
   - Notifies client admins of renewed validity period

## Related Documentation

- [Quote Request System Spec](../specs/005-quote-request-system/spec.md)
- [Quote Request System Tasks](../specs/005-quote-request-system/tasks.md)
- [Brevo API Documentation](https://developers.brevo.com/)

## Support

For issues or questions:
- Technical: Check logs in backend console
- Brevo Issues: Contact Brevo support
- Business Logic: Review notification service code in `backend/services/quoteNotificationService.js`
