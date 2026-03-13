# Data Model: Quote SMS Notifications

**Feature**: 009-quote-sms-notifications  
**Date**: 2026-03-13

## Database Changes

**None required.** This feature adds SMS sending logic to existing notification functions. No new tables, columns, or relationships.

## Environment Variables

### New Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ADMIN_SMS_NUMBERS` | string | No | `""` (empty) | Comma-separated NZ mobile phone numbers for WPSG admin SMS recipients. Example: `021123456,0274567890` |

### Existing Variables (already configured)

| Variable | Used For |
|----------|----------|
| `SMS_ENABLED` | Global SMS toggle (`true`/`false`). When `false`, all SMS is suppressed. |
| `SMS_WEBHOOK_URL` | n8n webhook endpoint for SMS delivery |
| `FRONTEND_URL` | Base URL for app links in SMS messages (e.g., `https://app.nextgenwom.co.nz`) |

## Entities Referenced (no changes)

### Quote (existing)
Fields used in SMS messages:
- `id` — used to construct app link (`{FRONTEND_URL}/quotes/{id}`)
- `quote_number` — displayed in SMS (e.g., `QTE-2026-003`)
- `estimated_cost` — included in "quoted" SMS message
- `converted_to_work_order_id` — used to look up work order number for "converted" SMS

### Work Order (existing, for conversion SMS only)
- `job_no` — displayed in conversion SMS (e.g., `WO-2026-050`)

## State Transitions Triggering SMS

```
Draft ──> Submitted ──────> [SMS: submitted]
              │
              ▼
      Information Requested ──> [SMS: info requested]
              │
              ▼
          Quoted ──────────> [SMS: quoted]
              │
         ┌────┴────┐
         ▼         ▼
     Approved   Declined
  [SMS: approved] [SMS: declined]
         │
         ▼
     Converted ────────> [SMS: converted]
```

**Events that do NOT trigger SMS**: Draft saves, Under Discussion, Expired, Expiring Soon, Renewed, Quote Updated, New Message.
