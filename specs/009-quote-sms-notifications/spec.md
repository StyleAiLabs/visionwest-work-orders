# Feature Specification: Quote SMS Notifications

**Feature Branch**: `009-quote-sms-notifications`  
**Created**: 2025-03-13  
**Status**: Draft  
**Input**: User description: "Send SMS notifications to WPSG Admin users at all stages of the quote journey. Keep the SMS content minimal and include a message to login to the app to view updates, providing the app link."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SMS Alert on Quote Submission (Priority: P1)

As a WPSG admin user, I receive an SMS on my mobile when a client submits a new quote request, so I can promptly review it without needing to constantly check the app.

**Why this priority**: This is the entry point of the quote lifecycle. Fast awareness of new requests directly impacts response time and client satisfaction.

**Independent Test**: Can be fully tested by having a client user submit a quote request and verifying that the configured admin mobile number(s) receive an SMS with the quote number, event description, and app link.

**Acceptance Scenarios**:

1. **Given** a client submits a quote request, **When** the quote status changes to "Submitted", **Then** all configured admin mobile numbers receive an SMS containing the quote number, event description, and a link to view the quote in the app.
2. **Given** the SMS service is disabled (SMS_ENABLED=false), **When** a quote is submitted, **Then** no SMS is sent and the system logs that SMS is disabled.
3. **Given** no admin mobile numbers are configured (ADMIN_SMS_NUMBERS is empty or unset), **When** a quote is submitted, **Then** no SMS is sent and the system logs that no admin numbers are configured.

---

### User Story 2 - SMS Alert on Quote Provided (Priority: P1)

As a WPSG admin user, I receive an SMS when a staff member provides a quote (with pricing) back to the client, so I stay informed about quoting activity.

**Why this priority**: Knowing when quotes are sent to clients is critical for admin oversight of the quoting pipeline.

**Independent Test**: Can be tested by having a staff member provide a quote with estimated cost, and verifying the admin receives an SMS with the quote number, event description, and app link.

**Acceptance Scenarios**:

1. **Given** a staff member provides a quote, **When** the quote status changes to "Quoted", **Then** all configured admin mobile numbers receive an SMS with the quote number, event description, and app link.

---

### User Story 3 - SMS Alert on Quote Approved (Priority: P1)

As a WPSG admin user, I receive an SMS when a client approves a quote, so I know work can proceed.

**Why this priority**: Approved quotes are a key business event that may require immediate action (scheduling work, resource allocation).

**Independent Test**: Can be tested by having a client approve a quote and verifying the admin receives an SMS.

**Acceptance Scenarios**:

1. **Given** a client approves a quote, **When** the quote status changes to "Approved", **Then** all configured admin mobile numbers receive an SMS with the quote number, property name, and app link.

---

### User Story 4 - SMS Alert on Quote Declined (Priority: P2)

As a WPSG admin user, I receive an SMS when a client declines a quote, so I am aware and can follow up if needed.

**Why this priority**: Declined quotes are important for pipeline tracking but less time-sensitive than approvals.

**Independent Test**: Can be tested by having a client decline a quote and verifying the admin receives an SMS.

**Acceptance Scenarios**:

1. **Given** a client declines a quote, **When** the quote status changes to "Declined", **Then** all configured admin mobile numbers receive an SMS with the quote number, property name, and app link.

---

### User Story 5 - SMS Alert on Quote Converted to Work Order (Priority: P2)

As a WPSG admin user, I receive an SMS when a quote is converted into a work order, so I know the job is in progress.

**Why this priority**: Conversion is the final success event of the quote lifecycle and confirms business has been won.

**Independent Test**: Can be tested by converting an approved quote to a work order and verifying the admin receives an SMS referencing both the quote number and new work order number.

**Acceptance Scenarios**:

1. **Given** a staff member converts a quote to a work order, **When** the conversion completes, **Then** all configured admin mobile numbers receive an SMS with the quote number, work order number, and app link.

---

### User Story 6 - SMS Alert on Information Requested (Priority: P2)

As a WPSG admin user, I receive an SMS when a staff member requests more information from a client regarding a quote, so I have visibility into quotes that are stalled or need attention.

**Why this priority**: Information requests can stall the pipeline; admin awareness helps ensure follow-up happens.

**Independent Test**: Can be tested by having a staff member request more information on a quote and verifying the admin receives an SMS.

**Acceptance Scenarios**:

1. **Given** a staff member requests more information for a quote, **When** the quote status changes to "Information Requested", **Then** all configured admin mobile numbers receive an SMS with the quote number, event description, and app link.

---

### Edge Cases

- What happens when ADMIN_SMS_NUMBERS contains multiple numbers? Each number should receive the SMS independently.
- What happens when ADMIN_SMS_NUMBERS contains invalid or malformed phone numbers? The system should skip invalid numbers, log a warning, and continue sending to valid numbers.
- What happens when the SMS webhook is unreachable? The system should log the failure and not block the quote workflow. SMS is a non-critical notification.
- What happens when a quote has no property name? Not applicable — SMS content uses quote number and event description only; property name is intentionally omitted for brevity.
- What happens during Draft saves, Under Discussion, Expired, or Expiring Soon events? No SMS is sent for these events.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send an SMS to all configured admin mobile numbers when a quote is submitted.
- **FR-002**: System MUST send an SMS to all configured admin mobile numbers when a quote is provided (priced).
- **FR-003**: System MUST send an SMS to all configured admin mobile numbers when a quote is approved by a client.
- **FR-004**: System MUST send an SMS to all configured admin mobile numbers when a quote is declined by a client.
- **FR-005**: System MUST send an SMS to all configured admin mobile numbers when a quote is converted to a work order.
- **FR-006**: System MUST send an SMS to all configured admin mobile numbers when more information is requested on a quote.
- **FR-007**: System MUST NOT send SMS for Draft saves, Under Discussion status changes, Expired status changes, or Expiring Soon reminders.
- **FR-008**: Each SMS MUST be under 160 characters and include the quote number and a brief event description, followed by a direct link to view the quote in the app. Property name SHOULD be omitted to keep messages concise. Example format: `Quote QTE-2026-003 submitted. View details: {FRONTEND_URL}/quotes/{quoteId}`.
- **FR-009**: The app link in the SMS MUST be constructed using the FRONTEND_URL environment variable (e.g., `{FRONTEND_URL}/quotes/{quoteId}`).
- **FR-010**: Admin mobile numbers MUST be read from the ADMIN_SMS_NUMBERS environment variable, supporting multiple comma-separated numbers.
- **FR-011**: System MUST respect the existing SMS_ENABLED toggle — when disabled, no quote SMS notifications are sent.
- **FR-012**: SMS sending failures MUST NOT block or disrupt the quote workflow. Failures should be logged and the quote operation should complete normally.
- **FR-013**: System MUST log each SMS send attempt (success or failure) for operational visibility.

### Key Entities

- **Admin SMS Recipients**: One or more mobile phone numbers configured via environment variable (ADMIN_SMS_NUMBERS), representing WPSG admin users who should receive quote lifecycle notifications.
- **Quote**: The existing quote entity with its lifecycle statuses (Draft, Submitted, Information Requested, Quoted, Under Discussion, Approved, Declined, Expired, Converted).
- **SMS Message**: A short text message (≤160 characters) containing quote number, brief event description (e.g., "submitted", "approved"), and app link. Property name is intentionally omitted for brevity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: WPSG admin users receive an SMS within 30 seconds of a quote status change for all six specified stages (Submitted, Quoted, Approved, Declined, Converted, Information Requested).
- **SC-002**: 100% of SMS messages are under 160 characters in length.
- **SC-003**: Every SMS contains a working link that takes the admin directly to the relevant quote in the app.
- **SC-004**: SMS delivery failures do not impact quote processing time — quotes complete their status transitions regardless of SMS outcome.
- **SC-005**: No SMS messages are sent for Draft, Under Discussion, Expired, or Expiring Soon events.
- **SC-006**: The system supports multiple admin recipients without requiring code changes (configuration only via ADMIN_SMS_NUMBERS).

## Assumptions

- The existing SMS webhook service (n8n via SMS_WEBHOOK_URL) is reliable and available.
- The FRONTEND_URL environment variable is already configured in the backend deployment.
- The `sendSMS(phoneNumber, message, metadata)` function in the existing SMS service handles phone number formatting and webhook communication.
- SMS costs are acceptable for the volume of quote notifications (approx. 6 SMS per quote lifecycle × number of admin recipients).
- NZ mobile numbers are the expected format for ADMIN_SMS_NUMBERS.

## Clarifications

### Session 2026-03-13

- Q: Should the "Under Discussion" status trigger an SMS notification? → A: No. This status has no controller action implemented yet. Only the 6 specified events trigger SMS (Submitted, Quoted, Approved, Declined, Converted, Information Requested).
- Q: How should the 160-character SMS limit be handled when property names are long? → A: Keep SMS minimal. Include quote number and short event description only. Property name is omitted. Example format: "Quote QTE-2026-003 submitted. View details: https://app.example.com/quotes/123".
