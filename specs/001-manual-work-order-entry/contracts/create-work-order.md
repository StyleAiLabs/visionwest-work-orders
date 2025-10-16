# API Contract: Create Manual Work Order

**Endpoint**: `POST /api/work-orders`
**Feature**: Manual Work Order Entry (P1 - MVP)
**User Story**: P1 - Create Work Order Manually
**Authentication**: Required (JWT)
**Authorization**: `client_admin` role only

## Purpose

Allows tenancy managers (users with `client_admin` role) to manually create work orders directly in the system. This provides an alternative entry point to the n8n email automation workflow for urgent requests, phone-in orders, and other non-email scenarios.

## Request

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "job_no": "WO-2025-0050",
  "date": "2025-10-17",
  "supplier_name": "ABC Plumbing Services",
  "supplier_phone": "555-0123",
  "supplier_email": "contact@abcplumbing.com",
  "property_name": "Sunset Apartments - Unit 4B",
  "property_address": "123 Main Street, Auckland",
  "property_phone": "555-0456",
  "description": "Leaking pipe under kitchen sink requires urgent repair",
  "po_number": "PO-2025-789",
  "authorized_by": "Jane Manager",
  "authorized_contact": "555-0789",
  "authorized_email": "jane@visionwest.co.nz"
}
```

### Field Definitions

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `job_no` | string | **Yes** | Unique, max 255 chars | External job number (must be unique) |
| `date` | string (ISO date) | No | YYYY-MM-DD format | Work order date (defaults to today if omitted) |
| `supplier_name` | string | **Yes** | Max 255 chars | Contractor/supplier name |
| `supplier_phone` | string | No | Max 255 chars | Supplier contact phone |
| `supplier_email` | string | No | Valid email format | Supplier contact email |
| `property_name` | string | **Yes** | Max 255 chars | Property identifier |
| `property_address` | string | No | Text field | Full property address |
| `property_phone` | string | No | Max 255 chars | Property contact phone |
| `description` | string | **Yes** | Text field, max 65535 chars | Detailed work description |
| `po_number` | string | No | Max 255 chars | Purchase order number |
| `authorized_by` | string | No | Max 255 chars | Name of authorizer |
| `authorized_contact` | string | No | Max 255 chars | Authorizer contact info |
| `authorized_email` | string | No | Valid email format | Authorizer email |

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Work order created successfully",
  "data": {
    "id": 157,
    "job_no": "WO-2025-0050",
    "status": "pending",
    "work_order_type": "manual",
    "created_by": 12,
    "createdAt": "2025-10-16T10:30:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful creation |
| `message` | string | Human-readable success message |
| `data.id` | integer | Database ID of created work order |
| `data.job_no` | string | Job number (echoed from request) |
| `data.status` | string | Always `"pending"` for new work orders |
| `data.work_order_type` | string | Always `"manual"` for this endpoint |
| `data.created_by` | integer | User ID of the authenticated user who created the work order |
| `data.createdAt` | string (ISO timestamp) | When the work order was created |

## Error Responses

### 400 Bad Request - Missing Required Fields

```json
{
  "success": false,
  "message": "Missing required fields. Please provide job number, supplier name, property name, and description."
}
```

**Trigger**: Any of the required fields (`job_no`, `supplier_name`, `property_name`, `description`) are missing or empty.

### 400 Bad Request - Duplicate Job Number

```json
{
  "success": false,
  "message": "Work order with job number WO-2025-0050 already exists."
}
```

**Trigger**: A work order with the same `job_no` already exists in the database (duplicate prevention per FR-004).

### 400 Bad Request - Invalid Email Format

```json
{
  "success": false,
  "message": "Invalid email format for supplier_email."
}
```

**Trigger**: `supplier_email` or `authorized_email` provided but not in valid email format.

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
  "message": "Forbidden: Only tenancy managers (client_admin role) can create manual work orders"
}
```

**Trigger**: Authenticated user does not have `client_admin` role.

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "An error occurred while creating the work order.",
  "error": "Database connection failed"
}
```

**Trigger**: Unexpected server error (database failure, etc.).

## Behavior Notes

1. **Automatic Field Population**:
   - `work_order_type` automatically set to `"manual"`
   - `created_by` automatically set to authenticated user's ID
   - `status` automatically set to `"pending"`
   - `date` defaults to current date if not provided
   - `createdAt` and `updatedAt` automatically set to current timestamp

2. **Notifications** (FR-008):
   - All active `staff`, `admin`, and `client` users receive in-app notifications
   - Notification message: "A new work order has been manually created by [user.full_name]"
   - Email notification sent to mark@williamspropertyservices.co.nz with work order details
   - Email sending is asynchronous; failure does not block work order creation

3. **Audit Trail**:
   - Creation itself is logged via `created_by` field
   - Optional: System note created: "Work order manually created by [user.full_name]"

4. **Validation Order**:
   1. Authentication check
   2. Role authorization check (`client_admin`)
   3. Required field validation
   4. Email format validation
   5. Duplicate job number check
   6. Create work order
   7. Send in-app notifications
   8. Send email notification to mark@williamspropertyservices.co.nz (asynchronous)

## Example Usage

### curl Example

```bash
curl -X POST https://api.visionwest.com/api/work-orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -H "Content-Type: application/json" \
  -d '{
    "job_no": "WO-2025-0050",
    "supplier_name": "ABC Plumbing",
    "property_name": "Sunset Apartments",
    "description": "Fix leaking pipe"
  }'
```

### JavaScript (Frontend) Example

```javascript
// Using fetch API
const createWorkOrder = async (formData) => {
  const response = await fetch('/api/work-orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
};
```

## Related Endpoints

- **GET `/api/work-orders`** - List all work orders (existing)
- **GET `/api/work-orders/:id`** - Get work order details (existing)
- **PUT `/api/work-orders/:id`** - Edit work order (P2 - see edit-work-order.md)
- **POST `/api/webhook/work-orders`** - n8n webhook creation (existing, unchanged)

## Implementation Reference

**Backend File**: `backend/controllers/workOrder.controller.js`
**Route**: `backend/routes/workOrder.routes.js`
**Middleware**: `backend/middleware/auth.middleware.js` (role check)
