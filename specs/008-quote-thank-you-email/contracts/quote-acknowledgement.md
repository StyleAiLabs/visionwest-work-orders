# Quote Thank-You Email — API Contract

No new API endpoints are introduced by this feature.

## Modified Endpoint Behavior

### POST /api/quotes/:id/submit

**Existing behavior** (unchanged):
- Validates quote is in `Draft` status
- Generates quote number
- Updates status to `Submitted`
- Sends notification to WPSG staff via `notifyQuoteSubmitted()` (Brevo Template #17)
- Returns `200` with updated quote data

**New behavior** (added):
- After `notifyQuoteSubmitted()`, also calls `notifyQuoteRequesterAcknowledgement(quote)`
- Sends acknowledgement email to `quote.contact_email` via Brevo Template #27
- Email failure does not affect response status or data

**Response**: No change to response schema.

## Corrected Behavior — Template #17 (US3 Amendment)

The `submitQuote()` query now includes the `Client` model to provide `client_name`:

```javascript
include: [
    { model: User, as: 'creator', attributes: ['id', 'full_name', 'email', 'role'] },
    { model: Client, as: 'client', attributes: ['id', 'name', 'code'] }  // Added for US3
]
```

`notifyQuoteSubmitted()` params corrected to match Brevo Template #17 expectations:
- `submitted_by` → `submitted_by_name`
- Added `recipient_name` (joined staff names)
- Added `client_name` (from `quote.client.name`)

WPSG staff lookup changed from hardcoded `client_id: 8` to dynamic `Client.findOne({ where: { code: 'WPSG' } })`.

## Brevo Template #27 Parameters

```yaml
templateId: 27
to:
  - email: "{quote.contact_email}"
    name: "{quote.contact_person}"
params:
  contact_person: string   # Greeting name
  quote_number: string     # e.g., "QTE-2026-003"
  property_name: string    # Property identifier
  property_address: string # Property address
  description: string      # Work description
```
