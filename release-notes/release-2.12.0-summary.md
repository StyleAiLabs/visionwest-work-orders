# Release 2.12.0 — Auto Reminders for Information Requests & Email Fixes

**Date:** 12 August 2026
**Type:** Minor (new feature + bug fixes)

## Summary

Adds automated follow-up reminders for the "Information Requested" quote state, and fixes Brevo email template issues where params were not being substituted in client and staff notifications.

## New Features

### Auto-Reminder System for Information Requests
When WPSG marks a quote as "Information Requested", the system now automatically schedules two follow-up reminder emails to the client:
- **1st reminder** — 4 hours after the initial info request
- **2nd reminder** — 24 hours after the initial info request

Reminders are automatically cancelled if:
- The client responds (adds a message to the quote)
- WPSG provides a quote (quote moves to Quoted)
- A new info request is raised (previous reminders cancelled, new ones scheduled)

Reminder emails use Template #21 with a clear `[1st/2nd reminder]` prefix in the request message and an overridden subject: `REMINDER: Quote XXX - Additional Information Still Needed`.

## Bug Fixes

### Brevo Template #17 — Quote Submitted (WPSG Staff notification)
- **Problem:** All `{{ params.xxx }}` placeholders appeared unsubstituted in subject and body; WPSG staff emails were also blocked by Brevo's suppression list.
- **Root cause:** Template was saved in Brevo's drag-and-drop design editor mode, which doesn't process transactional params. Two WPSG email addresses were on the suppression list.
- **Fix:** Template re-saved via Brevo API (converting to HTML mode where param substitution works). Suppression list entries removed for both WPSG staff addresses.

### Brevo Template #21 — Additional Information Needed (Client notification)
- **Problem:** Clients received an email saying only "Hi ," with no property details and no information about what was requested.
- **Root cause 1:** `recipient_name` was not included in the params sent by `notifyInfoRequested`.
- **Root cause 2:** Template body only contained `recipient_name` and `requested_by_name` — all other params were sent but not displayed.
- **Fix:** Backend now sends `recipient_name` (joined list of client user names). Template updated to include quote number, property name, address, and the actual `request_message`.

## Technical Implementation

| Component | Change |
|---|---|
| `migrations/20260812000001-create-quote-reminders.js` | New `quote_reminders` table |
| `models/quoteReminder.model.js` | Sequelize model for quote reminders |
| `models/index.js` | Model registration + associations |
| `services/reminderService.js` | Core reminder logic — schedule, cancel, cron processor |
| `services/quoteNotificationService.js` | `notifyInfoRequested` now schedules reminders; imports reminderService |
| `controllers/quote.controller.js` | Cancel reminders on `provideQuote`; cancel on client `addMessage` response |
| `server.js` | Starts reminder cron job on boot |
| `backend/package.json` | Added `node-cron` dependency |

## Upgrade Instructions

Migration runs automatically on deploy (`npm run build` → `npm run migrate`). No manual steps required.
