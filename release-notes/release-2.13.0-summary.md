# Release 2.13.0 — Indicative Budget Allocation

**Date:** August 20, 2026

## Summary

Adds an optional "Indicative Budget Allocation (NZD)" field to the quote request form. When provided, the budget is shown in the portal detail view for both VisionWest and WPSG users, and is included in the email notification sent to WPSG staff.

## Changes

### Frontend
- `QuoteRequestForm.jsx` — Optional numeric input (type=number, step=0.01) with $ prefix, placed after Required By Date, before Special Instructions
- `QuoteDetailPage.jsx` — Displays budget in quote info section when present, formatted as NZD with 2 decimal places

### Backend
- `backend/migrations/20260812000002-add-indicative-budget-to-quotes.js` — Adds `indicative_budget DECIMAL(10,2) NULL` column to quotes table
- `backend/models/quote.model.js` — Added `indicative_budget` Sequelize field
- `backend/controllers/quote.controller.js` — `createQuote` and `updateQuote` accept and persist the field
- `backend/services/quoteNotificationService.js` — Template #17 params include `indicative_budget` formatted as "NZD X,XXX.XX" or "Not specified"

### Brevo Template #17
- Added `<strong>Indicative Budget:</strong> {{ params.indicative_budget }}` line after "Required by" in the email body
