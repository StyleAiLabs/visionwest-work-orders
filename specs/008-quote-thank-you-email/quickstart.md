# Quickstart: Quote Request Thank-You Email

## Prerequisites

- Backend running (`npm run dev` or `npx -y node@18 node_modules/nodemon/bin/nodemon.js server.js`)
- Frontend running (`npm --prefix frontend run dev`)
- Brevo API key configured in environment
- Brevo Template #27 created with params: `contact_person`, `quote_number`, `property_name`, `description`

## Test Flow

### 1. Login as client_admin

Use a client_admin account (e.g., VisionWest housing admin).

### 2. Create a quote request

Navigate to Quotes → New Quote Request. Fill in:
- Property name and address
- Title and description (20+ characters)
- Contact person name
- Contact email (use a real email you can check)

Save as draft.

### 3. Submit the quote

Click "Submit" on the draft quote. This triggers:
1. Quote status changes to "Submitted"
2. Quote number is generated (e.g., QTE-2026-003)
3. WPSG staff notification email sent (Template #17) — existing
4. **Requester acknowledgement email sent (Template #27) — new**

### 4. Verify

- Check the contact email inbox for the thank-you email
- Confirm it contains: quote number, property name, description summary
- Confirm the quote submission response was `200` regardless of email delivery
- Check backend console logs for `✅ Brevo template email sent (template #27)` or error

### 5. Failure test

- Temporarily set an invalid Brevo API key
- Submit another quote
- Confirm submission still succeeds (200 response)
- Confirm error is logged: `❌ Failed to send Brevo template email (template #27)`
