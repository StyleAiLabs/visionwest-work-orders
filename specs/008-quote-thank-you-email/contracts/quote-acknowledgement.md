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
