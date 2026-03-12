# Data Model: Quote Request Thank-You Email

## Entities

### Quote (existing — no changes)

The thank-you email uses existing fields from the `quotes` table. No schema changes required.

**Fields used by this feature**:

| Field | Type | Purpose |
|-------|------|---------|
| `contact_email` | STRING(255) | Email recipient for the thank-you |
| `contact_person` | STRING(255) | Personalization in email greeting |
| `quote_number` | STRING(20) | Reference number in email body |
| `property_name` | STRING(255) | Property context in email body |
| `description` | TEXT | Work description summary in email body |

### Notification Function (new)

**Function**: `notifyQuoteRequesterAcknowledgement(quote)`

**Input**: Quote object (with fields above populated — guaranteed by `submitQuote` validation)

**Output**: None (void, fire-and-forget)

**Side effect**: Sends Brevo Template #27 email to `quote.contact_email`

**Template params passed**:

| Param | Source | Example |
|-------|--------|---------|
| `contact_person` | `quote.contact_person` | "Jane Smith" |
| `quote_number` | `quote.quote_number` | "QTE-2026-003" |
| `property_name` | `quote.property_name` | "14 Blythe Place" |
| `property_address` | `quote.property_address` | "14 Blythe Place, Henderson" |
| `description` | `quote.description` | "Repair leaking bathroom tap..." |

## State Transitions

No new state transitions. The email is triggered by the existing `Draft → Submitted` transition in `submitQuote()`. The email does not alter any quote state.

## Validation Rules

No new validation. The `submitQuote` controller already validates that `contact_email` and `contact_person` are present before allowing submission (FR-004 from spec).
