# API Contract: Cancel Work Order

**Feature**: Work Order Cancellation
**Endpoint**: `PATCH /api/work-orders/:id/status`
**Date**: 2025-10-20

## Overview

This endpoint allows authorized users (client, client_admin, admin) to cancel work orders by changing the status to 'cancelled'. Cancellation is permanent and creates an audit trail note.

**Note**: This reuses the existing status update endpoint. The cancellation-specific behavior is:
1. Permission check (staff users rejected for cancellation)
2. Immutability check (prevent reactivation of cancelled work orders)
3. Automatic audit trail creation

## Request

### HTTP Method
`PATCH`

### URL
```
/api/work-orders/:id/status
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Work order ID to cancel |

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Client-Context: <client_id> (optional, for staff/admin cross-client operations)
```

### Request Body
```json
{
  "status": "cancelled"
}
```

**Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `status` | string | Yes | Must be "cancelled" | New status value |

### Permissions

| Role | Allowed? | Notes |
|------|----------|-------|
| `client` | ✅ Yes | Can only cancel work orders where authorized_email matches their email |
| `client_admin` | ✅ Yes | Can cancel any work order for their client |
| `staff` | ❌ **No** | **Rejected with 403 error** - must contact admin |
| `admin` | ✅ Yes | Can cancel any work order across all clients |

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Work order status updated successfully",
  "data": {
    "id": 28,
    "job_no": "WO-2025-001",
    "status": "cancelled",
    "work_order_type": "manual",
    "supplier_name": "Williams Property Service",
    "property_name": "123 Main St",
    "property_address": "Auckland, NZ",
    "description": "Fix leaking tap",
    "is_urgent": false,
    "authorized_by": "Jane Manager",
    "authorized_email": "jane@visionwest.org.nz",
    "client_id": 1,
    "created_by": 45,
    "createdAt": "2025-10-20T02:45:15.629Z",
    "updatedAt": "2025-10-20T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Work Order Already Cancelled (Reactivation Attempt)
```json
{
  "success": false,
  "message": "Cancelled work orders cannot be reactivated. Please create a new work order if needed."
}
```

#### 403 Forbidden - Staff User Attempting Cancellation
```json
{
  "success": false,
  "message": "Staff users cannot cancel work orders. Contact an administrator."
}
```

#### 403 Forbidden - Client User Attempting to Cancel Another User's Work Order
```json
{
  "success": false,
  "message": "You do not have permission to update this work order."
}
```

#### 404 Not Found - Work Order Does Not Exist
```json
{
  "success": false,
  "message": "Work order not found"
}
```

#### 401 Unauthorized - Missing or Invalid JWT Token
```json
{
  "success": false,
  "message": "No token provided!" 
}
```

## Side Effects

### 1. Audit Trail Creation

When status successfully changes to 'cancelled', a new record is created in `work_order_notes`:

```sql
INSERT INTO work_order_notes (work_order_id, note, created_by, client_id, createdAt, updatedAt)
VALUES (28, 'Work order cancelled by Jane Manager', 45, 1, NOW(), NOW());
```

### 2. Notification (Future Enhancement)

Currently, cancellation does NOT trigger notifications. This is consistent with other status changes. Future versions may add:
- Email notification to authorized_email
- SMS notification if urgent work order cancelled
- Notification to staff/admin users

### 3. Dashboard Statistics Update

Cancelled work orders are immediately reflected in dashboard counts:
- `/api/work-orders/summary` endpoint returns `cancelled: <count>`
- Cancelled work orders excluded from pending/in-progress counts
- Visible in list when "Cancelled" filter applied

## Frontend Integration

### Example: Cancel Work Order from Detail Page

```javascript
// In WorkOrderDetailPage.jsx
const handleCancelWorkOrder = async () => {
  // 1. Show confirmation dialog
  setShowCancelDialog(true);
};

const handleConfirmCancel = async () => {
  try {
    // 2. Call API with status = 'cancelled'
    const response = await workOrderService.updateWorkOrderStatus(
      workOrder.id,
      'cancelled'
    );
    
    // 3. Update local state (optimistic UI)
    setWorkOrder(prev => ({ ...prev, status: 'cancelled' }));
    
    // 4. Close dialog and show success message
    setShowCancelDialog(false);
    toast.success('Work order cancelled successfully');
    
  } catch (error) {
    // 5. Handle errors (403, 400, etc.)
    toast.error(error.response?.data?.message || 'Failed to cancel work order');
  }
};
```

### Service Layer

```javascript
// In workOrderService.js
export const updateWorkOrderStatus = async (workOrderId, status) => {
  const response = await api.patch(`/work-orders/${workOrderId}/status`, { status });
  return response.data;
};
```

## Validation Rules

### Backend Validation (Controller)

1. **Work order exists**: Query database for work order by ID
2. **User has permission**: Check role and ownership (middleware handles this)
3. **Current status is not 'cancelled'**: Prevent reactivation
4. **Status value is valid**: Must be one of: pending, in-progress, completed, cancelled

```javascript
// In workOrder.controller.js updateWorkOrderStatus()
const workOrder = await WorkOrder.findByPk(id);
if (!workOrder) {
  return res.status(404).json({ success: false, message: 'Work order not found' });
}

// Prevent reactivation
if (workOrder.status === 'cancelled') {
  return res.status(400).json({
    success: false,
    message: 'Cancelled work orders cannot be reactivated. Please create a new work order if needed.'
  });
}

// Update status
workOrder.status = status;
await workOrder.save();

// Create audit trail
if (status === 'cancelled') {
  await WorkOrderNote.create({
    work_order_id: workOrder.id,
    note: `Work order cancelled by ${req.user.full_name}`,
    created_by: req.userId,
    client_id: workOrder.client_id
  });
}
```

### Frontend Validation

1. **Role check**: Only show cancel button if user role is client/client_admin/admin
2. **Status check**: Hide cancel button if status is already 'cancelled'
3. **Confirmation required**: Always show confirmation dialog (FR-029)

```jsx
{canCancel && workOrder.status !== 'cancelled' && (
  <button onClick={handleCancelWorkOrder} className="...">
    Cancel Work Order
  </button>
)}
```

## Testing Scenarios

### Success Cases

1. **Client cancels own work order**: 
   - User role: client, authorized_email matches JWT email
   - Expected: 200 OK, audit trail created
   
2. **Client_admin cancels any work order**:
   - User role: client_admin, any work order in their client
   - Expected: 200 OK, audit trail created
   
3. **Admin cancels cross-client work order**:
   - User role: admin, work order from different client
   - Expected: 200 OK, audit trail created

### Failure Cases

1. **Staff user attempts cancellation**:
   - User role: staff
   - Expected: 403 Forbidden with message about contacting admin
   
2. **Client cancels another user's work order**:
   - User role: client, authorized_email does not match
   - Expected: 403 Forbidden
   
3. **Attempt to reactivate cancelled work order**:
   - Current status: cancelled, new status: pending
   - Expected: 400 Bad Request with reactivation error message
   
4. **Invalid work order ID**:
   - ID: 99999 (non-existent)
   - Expected: 404 Not Found

## Performance Considerations

**Database Queries**:
- 1x SELECT (findByPk to check existence and current status)
- 1x UPDATE (work_orders.status)
- 1x INSERT (work_order_notes for audit trail)
- **Total**: 3 queries per cancellation

**Expected Latency**: ~200-300ms (database roundtrip + audit trail creation)

**Meets Success Criteria**:
- ✅ SC-014: Status update visible < 2 seconds
- ✅ SC-015: Audit trail visible < 2 seconds

## Related Endpoints

- `GET /api/work-orders/:id` - Retrieve work order (shows cancelled status)
- `GET /api/work-orders?status=cancelled` - List cancelled work orders
- `GET /api/work-orders/summary` - Dashboard counts (includes cancelled count)

## Changelog

- **2025-10-20**: Initial contract for work order cancellation feature
