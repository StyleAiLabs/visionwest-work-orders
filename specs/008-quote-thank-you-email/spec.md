# Feature Specification: Quote Request Thank-You Email

**Feature Branch**: `008-quote-thank-you-email`  
**Created**: 2026-03-12  
**Status**: Draft (Amended)  
**Input**: User description: "Add an email trigger. When a quote is created, send a simple 'Thank you' email to the requester's email address."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Requester Receives Thank-You Email on Quote Submission (Priority: P1)

As a quote requester, I receive a thank-you acknowledgement email at my contact email address immediately after my quote request is submitted, so I have confirmation that my request was received and is being processed.

**Why this priority**: Without an acknowledgement, requesters have no confirmation their quote was received, which leads to uncertainty, duplicate submissions, and unnecessary follow-up calls.

**Independent Test**: Can be tested by submitting a quote request and verifying that a thank-you email is delivered to the contact email address on the quote within a reasonable timeframe.

**Acceptance Scenarios**:

1. **Given** a completed quote request with a valid contact email, **When** the quote is submitted (status changes to "Submitted"), **Then** a thank-you email is sent to the contact email address on the quote.
2. **Given** a submitted quote, **When** the thank-you email is delivered, **Then** it contains the quote reference number, property name, and a message confirming the request is being reviewed.
3. **Given** a submitted quote, **When** the email service is temporarily unavailable, **Then** the quote submission still succeeds and the email failure is logged without affecting the user experience.

---

### User Story 2 - Thank-You Email Contains Useful Context (Priority: P2)

As a quote requester, the thank-you email I receive includes key details of my submission (quote number, property, and description summary), so I have a reference record without needing to log into the system.

**Why this priority**: Including submission details in the acknowledgement email reduces follow-up inquiries and provides the requester with a convenient reference.

**Independent Test**: Can be tested by reading the delivered email content and confirming it contains the quote reference number, property name, and description summary.

**Acceptance Scenarios**:

1. **Given** a delivered thank-you email, **When** the requester reads it, **Then** it includes the quote reference number, property name, property address, and a summary of the work description.
2. **Given** a delivered thank-you email, **When** the requester reads it, **Then** it includes a brief note on expected next steps (e.g., "Our team will review your request and provide a quote").

---

### User Story 3 - WPSG Staff/Admin Receive Notification on Quote Submission (Priority: P1)

As a WPSG (Williams Property Services Group) staff or admin user, I receive an email notification when any quote request is submitted across the system, so I am promptly informed of new incoming work and can begin reviewing and actioning the request.

**Why this priority**: WPSG staff and admins are responsible for reviewing and responding to all quote requests. Without timely notification, requests may sit unactioned, delaying service delivery to clients.

**Independent Test**: Can be tested by submitting a quote request and verifying that all active WPSG staff and admin users receive a notification email containing the quote details.

**Acceptance Scenarios**:

1. **Given** a quote request is submitted, **When** the submission is processed, **Then** all active WPSG users with role 'staff' or 'admin' receive a notification email.
2. **Given** a notification email is delivered to a WPSG user, **When** the recipient reads it, **Then** it contains the quote number, submitter name, property details, and contact information.
3. **Given** a quote request is submitted, **When** the notification email service fails, **Then** the quote submission still succeeds and the email failure is logged without affecting the user experience.
4. **Given** a quote request is submitted, **When** WPSG users are looked up for notification, **Then** the system identifies WPSG users dynamically by the client code 'WPSG' (not by a hardcoded client ID).

---

### Edge Cases

- Contact email on the quote is invalid or unreachable: email send fails silently; quote submission is not affected.
- Quote is saved as "Draft" only (not submitted): no thank-you email is sent. The email triggers only on submission.
- Multiple quotes submitted in quick succession by the same requester: each submission triggers its own independent thank-you email.
- No WPSG staff/admin users exist in the database: notification is skipped silently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send a thank-you acknowledgement email to the quote's contact email address when a quote request is submitted (status transitions to "Submitted").
- **FR-002**: The thank-you email MUST include the quote reference number, property name, property address, and a summary of the work description.
- **FR-003**: The thank-you email MUST include a brief message confirming the request is being reviewed and outlining expected next steps.
- **FR-004**: The email MUST only be triggered on quote submission (not on draft creation or subsequent status changes).
- **FR-005**: If email delivery fails, the quote submission MUST still succeed. The failure MUST be logged for operational visibility.
- **FR-006**: The thank-you email MUST be branded consistently with existing system emails (NextGen WOM branding).
- **FR-007**: System MUST send a notification email to all active WPSG staff and admin users when a quote request is submitted.
- **FR-008**: The admin notification email MUST include the quote number, submitter name, property details, and contact information.
- **FR-009**: WPSG users MUST be identified dynamically by client code 'WPSG' (not by a hardcoded client ID).

### Key Entities

- **Quote**: Existing entity. The contact email address (`contact_email`) on the quote is the recipient of the thank-you email.
- **Thank-You Email**: Outbound email triggered by quote submission, sent to the quote's `contact_email`, containing quote reference details and next-step guidance.

## Clarifications

### Session 2026-03-12

- Q: Which email delivery method should be used — Brevo template or inline HTML? → A: Brevo template (consistent with other quote notification emails using template IDs).
- Q: What level of detail should the thank-you email contain? → A: Standard — thank-you message, quote number, property name, brief description summary, and next steps note.
- Q: What is the Brevo template ID for the quote acknowledgement email? → A: Template #27.

## Assumptions

- The "requester's email address" refers to the `contact_email` field on the quote, not the logged-in user's email.
- The thank-you email is a simple informational notification — no action or response is required from the recipient.
- The Brevo email template for the thank-you email is Template #27 (existing quote notification templates: #17 for submission, #18 for quote provided).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully submitted quote requests trigger a thank-you email send attempt to the quote's contact email.
- **SC-002**: The thank-you email contains the quote reference number, property name, and description summary in every delivery.
- **SC-003**: Quote submission success rate is unaffected by email delivery failures (0% submission failures caused by email errors).
- **SC-004**: All active WPSG staff/admin users receive a notification email for every submitted quote.
