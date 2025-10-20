# Data Model: Manual Work Order Entry

**Feature**: Manual Work Order Entry
**Date**: 2025-10-16
**Phase**: 1 - Design

## Overview

This feature reuses the existing `work_orders` table with minimal changes. The primary data model extension is the use of the existing `work_order_type` field to distinguish manually created work orders from email-automated work orders.

## Entities

### WorkOrder (Existing - No Schema Changes Required)

**Table**: `work_orders`
**Model File**: `backend/models/workOrder.model.js`

| Field | Type | Nullable | Default | Validation/Constraints | Description |
|-------|------|----------|---------|------------------------|-------------|
| `id` | INTEGER | NO | AUTO_INCREMENT | PRIMARY KEY | Unique work order identifier |
| `job_no` | STRING | NO | - | UNIQUE | External job number (must be unique across all work orders) |
| `date` | DATEONLY | NO | NOW | - | Work order date |
| `status` | STRING | NO | 'pending' | ENUM: pending, in-progress, completed, cancelled | Current work order status |
| `work_order_type` | STRING | YES | NULL | - | **KEY FIELD**: 'email' (n8n), 'manual' (this feature), or NULL (legacy) |
| `supplier_name` | STRING | NO | - | - | Name of contractor/supplier performing work |
| `supplier_phone` | STRING | YES | - | - | Supplier contact phone |
| `supplier_email` | STRING | YES | - | VALID EMAIL | Supplier contact email |
| `property_name` | STRING | NO | - | - | Name/identifier of the property requiring work |
| `property_address` | TEXT | YES | - | - | Full property address |
| `property_phone` | STRING | YES | - | - | Property contact phone |
| `description` | TEXT | NO | - | - | Detailed description of work required |
| `po_number` | STRING | YES | - | - | Purchase order number |
| `authorized_by` | STRING | YES | - | - | Name of person who authorized the work |
| `authorized_contact` | STRING | YES | - | - | Contact info for authorizer |
| `authorized_email` | STRING | YES | - | - | Email for authorizer |
| `created_by` | INTEGER | YES | - | FOREIGN KEY → users.id | User who created this work order |
| `client_id` | INTEGER | YES | - | FOREIGN KEY → users.id | Associated client user |
| `createdAt` | DATE | NO | NOW | - | Timestamp when work order was created |
| `updatedAt` | DATE | NO | NOW | - | Timestamp when work order was last modified |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE constraint on `job_no`
- Recommended: Add index on `work_order_type` for efficient filtering
- Existing: Foreign key indexes on `created_by` and `client_id`

### User (Existing - No Changes)

**Table**: `users`
**Model File**: `backend/models/user.model.js`

Relevant fields for this feature:

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | User identifier |
| `username` | STRING | Unique username |
| `email` | STRING | User email address |
| `role` | ENUM | One of: client, client_admin, staff, admin |
| `full_name` | STRING | User's full name (for audit trail) |
| `is_active` | BOOLEAN | Whether user account is active |

**Role Mapping for this Feature**:
- `client_admin` → Tenancy Manager (can create and edit manual work orders)
- All other roles → View-only for manual work orders

### WorkOrderNote (Existing - Used for Audit Trail)

**Table**: `work_order_notes`
**Model File**: `backend/models/workOrderNote.model.js`

Used to create audit trail entries when work orders are edited (FR-011).

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Note identifier |
| `note` | TEXT | Note content (system-generated for edits) |
| `work_order_id` | INTEGER | FOREIGN KEY → work_orders.id |
| `created_by` | INTEGER | FOREIGN KEY → users.id (editor's user ID) |
| `createdAt` | DATE | Timestamp |

**Example System-Generated Notes**:
- "Work order manually created by Jane Manager"
- "Work order updated by John Admin. Changed: description, po_number, supplier_phone"

## Data Flow

### Manual Work Order Creation (P1)

```
[Frontend Form]
    ↓ (form data)
POST /api/work-orders
    ↓
[Backend Controller]
    ↓
1. Validate required fields (job_no, supplier_name, property_name, description)
2. Check if job_no already exists (duplicate prevention)
3. Verify user role is client_admin
4. Create work order record:
   - work_order_type = 'manual'
   - created_by = authenticated user ID
   - status = 'pending'
5. Save to database
6. Trigger notifications (reuse existing helper)
    ↓
[Database: work_orders table]
    ↓
[Response: { success: true, data: { id, job_no, status } }]
```

### Manual Work Order Editing (P2)

```
[Frontend Edit Form]
    ↓ (updated fields)
PUT /api/work-orders/:id
    ↓
[Backend Controller]
    ↓
1. Verify user role is client_admin
2. Fetch existing work order
3. Compare old vs. new values
4. Update work order fields
5. Create system note documenting changes
6. Save to database
7. Trigger update notifications
    ↓
[Database: work_orders table + work_order_notes table]
    ↓
[Response: { success: true, data: { id, updated_fields: [...] } }]
```

## Validation Rules

### Required Fields (FR-002)

- `job_no` - Must be unique across all work orders
- `supplier_name` - Cannot be empty
- `property_name` - Cannot be empty
- `description` - Cannot be empty

### Optional Fields (FR-003)

- `date` - Defaults to current date if not provided
- `supplier_phone`
- `supplier_email` - Must be valid email format if provided
- `property_address`
- `property_phone`
- `po_number`
- `authorized_by`
- `authorized_contact`
- `authorized_email`

### Field Length Limits

- `job_no`: VARCHAR(255)
- `supplier_name`: VARCHAR(255)
- `property_name`: VARCHAR(255)
- `description`: TEXT (65,535 characters in MySQL)
- `property_address`: TEXT
- All other STRING fields: VARCHAR(255)

### Business Rules

1. **Duplicate Prevention** (FR-004): `job_no` must be unique. Database enforces via UNIQUE constraint.
2. **Status Validation**: Status must be one of: `pending`, `in-progress`, `completed`, `cancelled`
3. **Email Format**: `supplier_email` and `authorized_email` must be valid email format
4. **Type Discriminator** (FR-005): Manual work orders must have `work_order_type = 'manual'`
5. **Creator Tracking** (FR-006): `created_by` must be set to the authenticated user's ID
6. **Initial Status** (FR-007): Manual work orders must start with `status = 'pending'`

## State Transitions

Work orders can transition between statuses:

```
pending → in-progress → completed
   ↓           ↓
cancelled   cancelled
```

**Note**: Manual work orders follow the same state transition rules as email work orders. This feature does not change status transition logic.

## Database Migration Required

**Migration**: None required - `work_order_type` field already exists.

**Optional Optimization** (recommended for performance):

```sql
-- Add index on work_order_type for efficient filtering
CREATE INDEX idx_work_orders_type ON work_orders(work_order_type);
```

This index will improve query performance when filtering work orders by type (e.g., "show only manual work orders" or "show only email work orders").

## Related Models Not Modified

The following existing models are used but not modified by this feature:

- **Notification**: Used to notify users about new manual work orders
- **Alert**: Notification alias (used in some parts of codebase)
- **Photos**: Work order photos can be attached via existing photo upload endpoints

## Summary

- **No schema changes required** - existing `work_order_type` field supports this feature
- **Reuses existing data model** - minimal impact, high compatibility
- **Adds one new value** for `work_order_type`: `'manual'`
- **Leverages existing relationships** - User, WorkOrderNote, Notification models
- **Recommended optimization** - Add database index on `work_order_type`

---

## Addendum: Work Order Cancellation Data Model (2025-10-20)

### Cancellation Status Flow

**No schema changes required**. The existing `status` ENUM field already includes `'cancelled'` as a valid value.

**Status State Machine**:
```
pending ────────────────┐
   ↓                    │
in-progress ────────────┤
   ↓                    │
completed               │
                        ↓
                   cancelled (TERMINAL STATE)
```

**Termination Rules**:
- Once status = 'cancelled', NO transitions allowed (FR-032)
- Backend enforces via updateWorkOrderStatus validation
- Frontend disables status controls when status = 'cancelled'

### Cancellation Audit Trail

Uses existing `work_order_notes` table with new system-generated note pattern:

**Example Note**:
```
Work order cancelled by Jane Manager
```

**Creation Logic**:
```javascript
// In workOrder.controller.js updateWorkOrderStatus()
if (status === 'cancelled') {
  await WorkOrderNote.create({
    work_order_id: workOrder.id,
    note: `Work order cancelled by ${req.user.full_name}`,
    created_by: req.userId,
    client_id: workOrder.client_id // Multi-tenant compliance
  });
}
```

### Cancellation Permission Matrix

Extends existing role-based access control:

| Role | Can Cancel? | Implementation |
|------|-------------|----------------|
| `client` | ✅ Yes | handleWorkOrderStatusUpdate allows if status === 'cancelled' |
| `client_admin` | ✅ Yes | handleWorkOrderStatusUpdate allows all status changes |
| `staff` | ❌ No | NEW: Reject if status === 'cancelled' with error message |
| `admin` | ✅ Yes | handleWorkOrderStatusUpdate allows all status changes |

**Middleware Update Required** in `backend/middleware/auth.middleware.js`:
```javascript
exports.handleWorkOrderStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  
  if (req.userRole === 'client') {
    if (status === 'cancelled') return next();
    return res.status(403).json({ message: 'Clients can only request cancellation.' });
  }
  
  // NEW: Staff cannot cancel
  if (req.userRole === 'staff') {
    if (status === 'cancelled') {
      return res.status(403).json({ 
        message: 'Staff users cannot cancel work orders. Contact an administrator.' 
      });
    }
    return next();
  }
  
  if (['admin', 'client_admin'].includes(req.userRole)) {
    return next();
  }
  
  return res.status(403).json({ message: 'Unauthorized to update work order status.' });
};
```

### Data Integrity Rules

**Cancellation Constraints**:
1. **Uniqueness**: Work orders maintain unique job_no even after cancellation (no reuse of cancelled job numbers)
2. **Immutability**: Once cancelled, work order data remains intact for historical reference
3. **Audit Trail**: Cancellation action MUST create WorkOrderNote (FR-030)
4. **Multi-Client Isolation**: Cancelled work orders respect client_id filtering (constitution compliance)
5. **Dashboard Visibility**: Cancelled count included in summary statistics (not hidden)

**Query Patterns**:
```sql
-- Get all cancelled work orders for dashboard count
SELECT COUNT(*) FROM work_orders 
WHERE status = 'cancelled' AND client_id = ?;

-- Prevent reactivation (backend validation)
SELECT status FROM work_orders WHERE id = ?;
-- If status = 'cancelled', reject UPDATE with error

-- Audit trail for cancelled work order
SELECT * FROM work_order_notes 
WHERE work_order_id = ? 
AND note LIKE '%cancelled by%'
ORDER BY created_at DESC;
```

**No database migrations required**. Feature uses existing schema and indexes.
