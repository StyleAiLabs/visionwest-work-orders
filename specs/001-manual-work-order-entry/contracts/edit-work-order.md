# API Contract: Edit Manual Work Order

**Endpoint**: `PUT /api/work-orders/:id`
**Feature**: Manual Work Order Entry (P2)
**User Story**: P2 - Edit Work Order Fields
**Authentication**: Required (JWT)
**Authorization**: `client_admin` role only

## Purpose

Allows tenancy managers (users with `client_admin` role) to edit work order details after initial creation. This enables updating work orders as more information becomes available (e.g., adding PO numbers, updating descriptions, correcting contact details).

## Request

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Database ID of the work order to edit |

### Request Body

**Note**: Only fields that need to be updated should be included. Omitted fields remain unchanged.

```json
{
  "supplier_phone": "555-9999",
  "property_address": "123 Main Street, Unit 4B, Auckland 1010",
  "po_number": "PO-2025-NEW-789",
  "description": "Updated: Leaking pipe under kitchen sink - URGENT, tenant reports water damage"
}
```

### Editable Fields

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| `date` | string (ISO date) | ✅ Yes | Work order date |
| `supplier_name` | string | ✅ Yes | Creates audit trail note |
| `supplier_phone` | string | ✅ Yes | |
| `supplier_email` | string | ✅ Yes | Must be valid email if provided |
| `property_name` | string | ✅ Yes | Creates audit trail note |
| `property_address` | string | ✅ Yes | |
| `property_phone` | string | ✅ Yes | |
| `description` | string | ✅ Yes | Creates audit trail note |
| `po_number` | string | ✅ Yes | |
| `authorized_by` | string | ✅ Yes | |
| `authorized_contact` | string | ✅ Yes | |
| `authorized_email` | string | ✅ Yes | Must be valid email if provided |

### Non-Editable Fields

| Field | Reason |
|-------|--------|
| `id` | System-assigned primary key |
| `job_no` | Used as unique identifier, changing creates confusion |
| `status` | Should be changed via dedicated status update endpoint |
| `work_order_type` | Immutable discriminator field |
| `created_by` | Historical record, immutable |
| `createdAt` | Historical timestamp, immutable |
| Email metadata fields (`email_subject`, `email_sender`, `email_received_date`) | Only present for email work orders, preserved per FR-012 |

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Work order updated successfully",
  "data": {
    "id": 157,
    "job_no": "WO-2025-0050",
    "status": "pending",
    "updated_fields": ["supplier_phone", "property_address", "po_number", "description"],
    "updatedAt": "2025-10-16T11:45:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful update |
| `message` | string | Human-readable success message |
| `data.id` | integer | Database ID of updated work order |
| `data.job_no` | string | Job number (unchanged) |
| `data.status` | string | Current status (unchanged by this endpoint) |
| `data.updated_fields` | array | List of field names that were changed |
| `data.updatedAt` | string (ISO timestamp) | When the work order was last updated |

## Error Responses

### 400 Bad Request - Invalid Email Format

```json
{
  "success": false,
  "message": "Invalid email format for supplier_email."
}
```

**Trigger**: Updated `supplier_email` or `authorized_email` is not in valid email format.

### 401 Unauthorized - Missing or Invalid Token

```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing authentication token"
}
```

**Trigger**: JWT token is missing, expired, or invalid.

### 403 Forbidden - Insufficient Permissions

```json
{
  "success": false,
  "message": "Forbidden: Only tenancy managers (client_admin role) can edit work orders"
}
```

**Trigger**: Authenticated user does not have `client_admin` role.

### 404 Not Found

```json
{
  "success": false,
  "message": "Work order with ID 157 not found."
}
```

**Trigger**: Work order with the specified ID does not exist in the database.

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "An error occurred while updating the work order.",
  "error": "Database connection failed"
}
```

**Trigger**: Unexpected server error (database failure, etc.).

## Behavior Notes

1. **Partial Updates**:
   - Only fields included in the request body are updated
   - Omitted fields remain unchanged
   - Sending `null` for a field clears it (sets to NULL)

2. **Audit Trail** (FR-011):
   - System creates a `WorkOrderNote` entry documenting the change
   - Note format: "Work order updated by [user.full_name]. Changed: [field1, field2, field3]"
   - Note includes `created_by` = editor's user ID
   - Timestamp automatically recorded

3. **Notifications**:
   - All active `staff`, `admin`, and `client` users receive notifications
   - Notification message: "Work order #[job_no] has been updated by [user.full_name]"

4. **Email Metadata Preservation** (FR-012):
   - If work order has `work_order_type = 'email'`, email metadata fields are read-only
   - Attempting to edit `email_subject`, `email_sender`, or `email_received_date` is silently ignored
   - This prevents corruption of historical email automation data

5. **Validation Order**:
   1. Authentication check
   2. Role authorization check (`client_admin`)
   3. Work order existence check
   4. Email format validation (if email fields updated)
   5. Fetch existing work order
   6. Compare old vs. new values
   7. Update work order
   8. Create audit trail note
   9. Send notifications

## Example Usage

### curl Example

```bash
curl -X PUT https://api.visionwest.com/api/work-orders/157 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -H "Content-Type: application/json" \
  -d '{
    "po_number": "PO-2025-NEW-789",
    "supplier_phone": "555-9999"
  }'
```

### JavaScript (Frontend) Example

```javascript
// Using fetch API
const editWorkOrder = async (workOrderId, updates) => {
  const response = await fetch(`/api/work-orders/${workOrderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
};

// Example usage
await editWorkOrder(157, {
  po_number: 'PO-2025-789',
  description: 'Updated description with more details'
});
```

## Audit Trail Example

After editing a work order, a system note is automatically created:

**Work Order Note**:
```json
{
  "id": 892,
  "note": "Work order updated by Jane Manager. Changed: po_number, supplier_phone, description",
  "work_order_id": 157,
  "created_by": 12,
  "createdAt": "2025-10-16T11:45:00.000Z"
}
```

This note is visible to all users viewing the work order and provides a complete audit trail of all modifications.

## Related Endpoints

- **POST `/api/work-orders`** - Create manual work order (P1 - see create-work-order.md)
- **GET `/api/work-orders/:id`** - Get work order details (existing)
- **PUT `/api/work-orders/:id/status`** - Update work order status (existing, separate from this endpoint)
- **PUT `/api/webhook/work-orders`** - n8n webhook update (existing, unchanged)

## Implementation Reference

**Backend File**: `backend/controllers/workOrder.controller.js`
**Route**: `backend/routes/workOrder.routes.js`
**Middleware**: `backend/middleware/auth.middleware.js` (role check)
**Audit Trail**: `backend/models/workOrderNote.model.js`
