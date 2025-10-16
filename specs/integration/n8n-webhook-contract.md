# n8n Webhook Integration Contract

**Version**: 1.0.0
**Last Updated**: 2025-10-16
**Status**: Active - Protected by Constitution Principle III (Integration Integrity)

## Overview

This document defines the API contract between the VisionWest Work Order Management System and the n8n workflow automation platform. The n8n workflow processes incoming email work orders, extracts data from PDF attachments using AI (OpenAI), and creates or updates work orders in the system via webhook endpoints.

**CRITICAL**: This integration contract is protected by **Constitution Principle III: Integration Integrity**. Breaking changes to these endpoints require explicit migration plans and stakeholder approval before implementation.

## Architecture

```
Email Inbox → n8n Workflow → OpenAI Extraction → Webhook API → VisionWest System
                   ↓
              SMS Notifications
```

### Workflow Steps
1. n8n monitors email inbox for new work orders
2. Extracts PDF attachments from emails
3. Uses OpenAI to structure work order information
4. Sends work order data via webhook to VisionWest API
5. Triggers SMS notifications to relevant personnel

## Authentication

### Method: API Key Authentication

All protected webhook endpoints require an API key to be passed in the request header.

**Header Name**: `x-api-key`
**Header Value**: Value of `WEBHOOK_API_KEY` environment variable

### Example Request Header

```
x-api-key: your-webhook-api-key-here
Content-Type: application/json
```

### Security Requirements

- API key MUST be stored securely in environment variables
- API key MUST NOT be committed to version control
- API key MUST be rotated periodically
- Failed authentication returns 401 Unauthorized

## Endpoints

### Base URL

**Production**: `https://api.visionwest.com/api/webhook` (example)
**Staging**: `https://staging-api.visionwest.com/api/webhook` (example)
**Development**: `http://localhost:3001/api/webhook`

---

## 1. Webhook Verification Endpoint

### `GET /verify`

**Purpose**: Health check endpoint for n8n to verify the API is online and responsive.

**Authentication**: None (public endpoint)

**Request**: No body required

**Response**:

```json
{
  "success": true,
  "message": "Webhook endpoint is active",
  "timestamp": "2025-10-16T12:34:56.789Z"
}
```

**Status Codes**:
- `200 OK` - Webhook service is active

**Usage**: n8n can call this endpoint periodically to monitor API health.

---

## 2. Create Work Order from Email

### `POST /work-orders`

**Purpose**: Create a new work order from email-extracted data. Includes intelligent duplicate detection - if a work order with the same `job_no` already exists, it will update the existing work order instead of creating a duplicate.

**Authentication**: Required (API key)

**Request Body**:

```json
{
  "job_no": "WO-2025-0001",
  "date": "2025-10-16",
  "supplier_name": "ABC Plumbing Services",
  "supplier_phone": "555-0123",
  "supplier_email": "contact@abcplumbing.com",
  "property_name": "Sunset Apartments",
  "property_address": "123 Main Street, Auckland",
  "property_phone": "555-0456",
  "description": "Leaking pipe in unit 4B requires urgent repair",
  "po_number": "PO-12345",
  "authorized_by": "Jane Manager",
  "authorized_contact": "555-0789",
  "authorized_email": "jane@visionwest.co.nz",
  "email_subject": "Work Order - WO-2025-0001",
  "email_sender": "system@contractor.com",
  "email_received_date": "2025-10-16T08:30:00.000Z",
  "attachment_data": null
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `job_no` | string | **Yes** | Unique job number identifier (used for duplicate detection) |
| `date` | string (ISO date) | No | Work order date (defaults to current date if omitted) |
| `supplier_name` | string | **Yes** | Name of the contractor/supplier |
| `supplier_phone` | string | No | Contact phone for supplier |
| `supplier_email` | string | No | Contact email for supplier |
| `property_name` | string | **Yes** | Name/identifier of the property |
| `property_address` | string | No | Full property address |
| `property_phone` | string | No | Property contact phone |
| `description` | string | **Yes** | Detailed description of work required |
| `po_number` | string | No | Purchase order number |
| `authorized_by` | string | No | Name of person who authorized the work |
| `authorized_contact` | string | No | Contact info for authorizer |
| `authorized_email` | string | No | Email for authorizer |
| `email_subject` | string | No | Original email subject (stored in metadata) |
| `email_sender` | string | No | Original email sender (stored in metadata) |
| `email_received_date` | string (ISO 8601) | No | When email was received (stored in metadata) |
| `attachment_data` | object/null | No | Reserved for future PDF attachment handling |

### Response - New Work Order Created

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Work order created successfully from email!",
  "data": {
    "id": 42,
    "jobNo": "WO-2025-0001",
    "status": "pending"
  }
}
```

### Response - Existing Work Order Updated (Duplicate Detected)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Work order updated successfully from email!",
  "data": {
    "id": 42,
    "jobNo": "WO-2025-0001",
    "status": "pending",
    "updated": true
  }
}
```

### Error Responses

**400 Bad Request** - Missing required fields:

```json
{
  "success": false,
  "message": "Missing required fields. Please provide job number, supplier name, property name, and description."
}
```

**401 Unauthorized** - Invalid or missing API key:

```json
{
  "success": false,
  "message": "Unauthorized: Invalid API key"
}
```

**500 Internal Server Error** - Server error:

```json
{
  "success": false,
  "message": "An error occurred while creating the work order from email.",
  "error": "Detailed error message"
}
```

### Behavior Notes

1. **Duplicate Detection**: The endpoint checks if a work order with the same `job_no` already exists
2. **Automatic Update**: If duplicate found, updates existing work order instead of creating new one
3. **Audit Trail**: Creates a system note documenting the email webhook update
4. **Notifications**: Automatically notifies all active staff, admin, and client users
5. **Metadata Tracking**: Stores email metadata (subject, sender, received date) for audit purposes
6. **Creator Assignment**: Work orders created via webhook are assigned to the first admin user found

---

## 3. Update Work Order from Email

### `PUT /work-orders`

**Purpose**: Explicitly update an existing work order. Unlike POST which auto-detects duplicates, this endpoint is specifically for updates and returns 404 if work order doesn't exist.

**Authentication**: Required (API key)

**Request Body**:

```json
{
  "job_no": "WO-2025-0001",
  "date": "2025-10-16",
  "supplier_name": "ABC Plumbing Services",
  "supplier_phone": "555-0123",
  "supplier_email": "contact@abcplumbing.com",
  "property_name": "Sunset Apartments",
  "property_address": "123 Main Street, Auckland",
  "property_phone": "555-0456",
  "description": "Updated: Leaking pipe in unit 4B - URGENT",
  "po_number": "PO-12345",
  "authorized_by": "Jane Manager",
  "authorized_contact": "555-0789",
  "authorized_email": "jane@visionwest.co.nz",
  "status": "in_progress",
  "email_subject": "Work Order Update - WO-2025-0001",
  "email_sender": "system@contractor.com",
  "email_received_date": "2025-10-16T10:15:00.000Z"
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `job_no` | string | **Yes** | Job number to identify work order to update |
| `status` | string | No | Update work order status (pending, in_progress, completed) |
| All other fields | various | No | Same as POST endpoint - only provided fields are updated |

**Update Behavior**: Only fields that are provided in the request body will be updated. Omitted fields remain unchanged.

### Response - Success

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Work order updated successfully from email!",
  "data": {
    "id": 42,
    "jobNo": "WO-2025-0001",
    "status": "in_progress",
    "updatedFields": ["description", "status", "supplier_phone"]
  }
}
```

### Error Responses

**400 Bad Request** - Missing job number:

```json
{
  "success": false,
  "message": "Job number is required for work order updates."
}
```

**404 Not Found** - Work order doesn't exist:

```json
{
  "success": false,
  "message": "Work order with job number WO-2025-0001 not found."
}
```

**401 Unauthorized** - Invalid or missing API key:

```json
{
  "success": false,
  "message": "Unauthorized: Invalid API key"
}
```

**500 Internal Server Error** - Server error:

```json
{
  "success": false,
  "message": "An error occurred while updating the work order from email.",
  "error": "Detailed error message"
}
```

### Behavior Notes

1. **Partial Updates**: Only provided fields are updated (other fields remain unchanged)
2. **Audit Trail**: Creates a system note listing all updated fields
3. **Metadata Tracking**: Updates metadata with `last_updated_via: 'n8n_update_webhook'`
4. **Notifications**: Notifies all active users about the work order update
5. **No Auto-Creation**: Unlike POST, this endpoint will NOT create a new work order if job_no doesn't exist

---

## 4. Add Note to Work Order

### `POST /work-orders/notes`

**Purpose**: Add a text note to an existing work order using the job number.

**Authentication**: Required (API key)

**Request Body**:

```json
{
  "job_no": "WO-2025-0001",
  "note_content": "Contractor confirmed arrival time for 2pm today"
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `job_no` | string | **Yes** | Job number to identify work order |
| `note_content` | string | **Yes** | The note text to add |

### Response - Success

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "id": 78,
    "workOrderId": 42,
    "jobNo": "WO-2025-0001",
    "note": "Contractor confirmed arrival time for 2pm today",
    "createdBy": 1
  }
}
```

### Error Responses

**404 Not Found** - Work order doesn't exist:

```json
{
  "success": false,
  "message": "Work order not found: WO-2025-0001"
}
```

**401 Unauthorized** - Invalid or missing API key:

```json
{
  "success": false,
  "message": "Unauthorized: Invalid API key"
}
```

**500 Internal Server Error** - Server error:

```json
{
  "success": false,
  "message": "An error occurred while adding the note.",
  "error": "Detailed error message"
}
```

### Behavior Notes

1. **System User**: Notes created via webhook are assigned to system user (ID: 1)
2. **Notifications**: Automatically notifies staff, admin, and VisionWest client users
3. **Timestamped**: Notes include automatic creation timestamp

---

## Data Models

### Work Order Status Values

| Status | Description |
|--------|-------------|
| `pending` | Work order created, awaiting assignment |
| `in_progress` | Work is currently being performed |
| `completed` | Work has been finished |
| `on_hold` | Work temporarily paused |
| `cancelled` | Work order cancelled |

### User Roles (for notification context)

| Role | Description |
|------|-------------|
| `admin` | System administrators with full access |
| `staff` | Contractor/maintenance staff performing work |
| `client` | VisionWest users (property managers) |
| `client_admin` | VisionWest administrators |

### Metadata Structure

Work orders store additional metadata from email processing:

```json
{
  "email_subject": "Work Order - WO-2025-0001",
  "email_sender": "system@contractor.com",
  "email_received_date": "2025-10-16T08:30:00.000Z",
  "created_via": "n8n_workflow",
  "last_updated_via": "n8n_update_webhook",
  "last_updated_at": "2025-10-16T10:15:00.000Z"
}
```

---

## Implementation References

### Backend Files

- **Routes**: `/backend/routes/webhook.routes.js:11-17`
- **Controller**: `/backend/controllers/webhook.controller.js:12-470`
- **Authentication**: `/backend/middleware/webhook-auth.middleware.js:1-13`
- **Test Script**: `/backend/scripts/test-webhook-duplicates.js:1-165`

### Environment Variables

```bash
# Required in backend/.env or environment configuration
WEBHOOK_API_KEY=your-secure-api-key-here
```

---

## Testing

### Test Script

A comprehensive test script is available at `/backend/scripts/test-webhook-duplicates.js`

**Run test against local server**:
```bash
cd backend
WEBHOOK_API_KEY=your-key node scripts/test-webhook-duplicates.js
```

**Run offline logic test**:
```bash
node scripts/test-webhook-duplicates.js --offline
```

### Manual Testing with curl

**Verify webhook is active**:
```bash
curl -X GET http://localhost:3001/api/webhook/verify
```

**Create work order**:
```bash
curl -X POST http://localhost:3001/api/webhook/work-orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-webhook-api-key" \
  -d '{
    "job_no": "TEST-001",
    "supplier_name": "Test Supplier",
    "property_name": "Test Property",
    "description": "Test work order"
  }'
```

**Update work order**:
```bash
curl -X PUT http://localhost:3001/api/webhook/work-orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-webhook-api-key" \
  -d '{
    "job_no": "TEST-001",
    "status": "in_progress",
    "description": "Updated description"
  }'
```

**Add note**:
```bash
curl -X POST http://localhost:3001/api/webhook/work-orders/notes \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-webhook-api-key" \
  -d '{
    "job_no": "TEST-001",
    "note_content": "Test note from webhook"
  }'
```

---

## Breaking Change Policy

Per **Constitution Principle III: Integration Integrity**, the following changes are considered **BREAKING** and require stakeholder approval + migration plan:

### Breaking Changes

- Removing any endpoint
- Renaming endpoint paths
- Changing HTTP methods (GET, POST, PUT)
- Removing required fields
- Changing field data types
- Changing authentication mechanism
- Modifying response structure for successful responses
- Changing status code semantics

### Non-Breaking Changes

- Adding optional fields to request body
- Adding fields to response body
- Adding new endpoints
- Improving error messages
- Adding query parameters (optional)
- Performance optimizations
- Bug fixes that don't change contract

### Change Process

1. Document proposed change in `/specs/integration/` directory
2. Create migration plan if breaking change
3. Get approval from:
   - n8n workflow maintainer
   - VisionWest technical lead
   - Project stakeholders
4. Implement with backward compatibility or versioning
5. Test thoroughly with existing n8n workflow
6. Deploy with monitoring
7. Update this contract document

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-10-16 | Initial contract documentation | VisionWest Dev Team |

---

## Support & Contact

For questions about this webhook integration:
- Review the constitution at `.specify/memory/constitution.md`
- Check implementation at `/backend/controllers/webhook.controller.js`
- Run test suite at `/backend/scripts/test-webhook-duplicates.js`
- Consult this contract before making API changes

**Remember**: This integration is mission-critical. Breaking it halts incoming work order creation.
