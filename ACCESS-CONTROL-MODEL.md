# Multi-Client Access Control Model

## Overview
After implementing multi-client support and creating the WPSG client for Williams Property Services Group, the system enforces the following access control model:

## User Roles & Access

### 1. **Client** (`client`)
**Example:** Tenants from VisionWest (`tenant@visionwest.org.nz`)

**Access:**
- ✅ View only work orders where `authorized_email` matches their email
- ✅ Request cancellation of their own work orders (status → `cancelled`)
- ✅ Add notes to their own work orders
- ❌ Cannot change status to anything other than `cancelled`
- ❌ Cannot see other tenants' work orders
- ❌ Cannot access work orders from other clients

**Client Filter:** Scoped to their assigned `client_id` only

---

### 2. **Client Admin** (`client_admin`)
**Example:** VisionWest housing managers (`housing@visionwest.org.nz`)

**Access:**
- ✅ View ALL work orders for their client organization
- ✅ Create manual work orders for their client
- ✅ Update any status (pending, in-progress, completed, cancelled)
- ✅ Add notes to any work order in their organization
- ✅ Update work order details (property info, description, etc.)
- ❌ Cannot access work orders from other clients
- ❌ Cannot delete work orders

**Client Filter:** Scoped to their assigned `client_id` only

---

### 3. **Staff** (`staff`)
**Example:** Williams Property staff (`staff@williamspropertyservices.co.nz`)

**Access:**
- ✅ View ALL work orders across ALL clients (VisionWest, WPSG, Emerge, etc.)
- ✅ Update work order status (except cannot cancel - only admin can)
- ✅ Add notes to any work order from any client
- ✅ Update work order details across all clients
- ✅ Dashboard shows totals for all clients combined
- ❌ Cannot cancel work orders (security measure)
- ❌ Cannot delete work orders
- ❌ Cannot create manual work orders (client_admin only)

**Client Filter:** **NO CLIENT FILTER** - Full cross-client access

---

### 4. **Admin** (`admin`)
**Example:** Williams Property admins (`admin@williamspropertyservices.co.nz`)

**Access:**
- ✅ View ALL work orders across ALL clients
- ✅ Update any work order from any client
- ✅ Update status to any value (including cancellation)
- ✅ Add/delete notes on any work order
- ✅ Delete work orders
- ✅ Full CRUD operations across all clients
- ✅ Dashboard shows totals for all clients combined

**Client Filter:** **NO CLIENT FILTER** - Full cross-client access

---

## Implementation Details

### Client-Scoped Operations
The following use `clientScoping.applyClientFilter()`:

**For `client` and `client_admin` roles:**
```javascript
whereClause.client_id = req.clientId; // From JWT token
```

**For `staff` and `admin` roles:**
```javascript
// No client filter - see all work orders across all clients
// Unless X-Client-Context header is provided for explicit filtering
```

### Role-Based Middleware

**Authentication & Authorization Flow:**
1. `authMiddleware.verifyToken` - Validates JWT, extracts `userId`, `userRole`, `clientId`
2. `clientScoping.addClientScope` - Adds client context to request
3. Role-specific middleware:
   - `isAnyValidRole` - Any authenticated user
   - `isClient` - Client users only
   - `isClientAdmin` - Client admins only
   - `isStaffOrAdmin` - Staff or Admin only
   - `isAdmin` - Admin only
   - `handleWorkOrderStatusUpdate` - Special status update rules

### Status Update Rules

| Role | Can Update Status? | Restrictions |
|------|-------------------|--------------|
| `client` | ✅ Yes | Only to `cancelled` |
| `client_admin` | ✅ Yes | All statuses |
| `staff` | ✅ Yes | All except `cancelled` |
| `admin` | ✅ Yes | All statuses |

**Special Rules:**
- Cancellation ALWAYS requires a note/reason
- Cancelled work orders cannot be reactivated
- Client cancellations create an audit trail

---

## Williams Property (WPSG) Cross-Client Access

### Why WPSG Exists in the Clients Table

**IMPORTANT:** Williams Property Services Group (WPSG) is **NOT a client organization** - it's the **supplier/service provider company**. However, it exists in the `clients` table for a technical reason:

- **Purpose**: To manage Williams Property staff user accounts (`admin@williamspropertyservices.co.nz`, etc.)
- **User Assignment**: All Williams Property employees have `client_id = 8` (WPSG)
- **Work Orders**: WPSG does NOT have work orders assigned to it
- **Filters**: WPSG is **excluded** from client filter dropdowns in the UI

### Actual Client Organizations

The real client organizations that Williams Property services are:
- **VisionWest** (`client_id: 1`) - Social housing provider
- **Emerge** (`client_id: 7`) - Another client organization
- *(Future clients as they are added)*

### Why WPSG Users Need Cross-Client Access

Williams Property Services Group manages work orders for multiple client organizations:
- **VisionWest** - Social housing provider
- **Emerge** - Another client
- **WPSG Internal** - Williams Property's own properties

**WPSG admin/staff users MUST be able to:**
1. View work orders from all client organizations
2. Update status of any work order regardless of client
3. Add notes to work orders from any client
4. See combined dashboard statistics

### How It Works

When a WPSG admin/staff logs in:

```javascript
// JWT Token contains:
{
  id: 2,
  email: "admin@williamspropertyservices.co.nz",
  role: "admin",
  clientId: 8,        // WPSG client ID
  clientCode: "WPSG"
}
```

**In Controllers:**
```javascript
// For client/client_admin: filter by their client
if (['client', 'client_admin'].includes(userRole)) {
    whereClause.client_id = req.clientId;  // Scoped
}

// For staff/admin: NO client filter
else if (['staff', 'admin'].includes(userRole)) {
    // No filter - see everything
}
```

**Result:**
- ✅ WPSG admin sees all VisionWest work orders
- ✅ WPSG staff can update Emerge work orders
- ✅ Dashboard shows: VisionWest (100) + WPSG (20) + Emerge (15) = 135 total

---

## Context Switching (Optional)

WPSG users can optionally filter by a specific client using the `X-Client-Context` header:

```javascript
GET /api/work-orders
Headers:
  Authorization: Bearer <token>
  X-Client-Context: 1  // Filter to VisionWest only
```

This is useful for:
- Viewing only VisionWest work orders
- Client-specific reports
- Focused dashboards

---

## Security Considerations

### ✅ Secure
- Client users can only see their own work orders (email matching)
- Client admins cannot access other clients' data
- Staff cannot cancel work orders (admin-only protection)
- Cancelled work orders cannot be reactivated
- All status changes require authentication

### ⚠️ Important Notes
- WPSG admin/staff client_id = 8 (WPSG)
- But they manage work orders with client_id = 1, 7, 8, etc.
- Work orders belong to the CLIENT organization (VisionWest, Emerge)
- Users belong to their EMPLOYER organization (WPSG, VisionWest)
- This is by design - WPSG is the SERVICE PROVIDER for multiple clients

---

## Testing Cross-Client Access

Run the test script:

```bash
cd backend
npm start  # Start server on port 5002
node scripts/test-cross-client-access.js
```

Expected output:
```
✅ Williams Property Admin can login and access WPSG client
✅ Williams Property Staff can login and access WPSG client
✅ Admin can view all work orders across all clients
✅ Admin can add notes to work orders from other clients
✅ Staff can update status of work orders from other clients
✅ Dashboard summary shows all work orders across all clients
```

---

### Database Structure

### Clients Table
```sql
| id | name                                 | code       | Purpose                    |
|----|--------------------------------------|------------|----------------------------|
| 1  | Visionwest                          | VISIONWEST | Client Organization        |
| 7  | Emerge                              | EMERGE     | Client Organization        |
| 8  | Williams Property Services Group    | WPSG       | Supplier (User Management) |
```

**Note:** WPSG is excluded from client filters. It only exists to manage Williams Property staff accounts.

### Users Table (Relevant Records)
```sql
| id | email                                   | role         | client_id |
|----|-----------------------------------------|--------------|-----------|
| 1  | cameron@visionwest.org.nz              | admin        | 1         |
| 2  | admin@williamspropertyservices.co.nz   | admin        | 8         |
| 3  | staff@williamspropertyservices.co.nz   | staff        | 8         |
| 4  | housing@visionwest.org.nz              | client_admin | 1         |
```

### Work Orders Table (Example)
```sql
| id | job_no | client_id | status      | authorized_email              |
|----|--------|-----------|-------------|-------------------------------|
| 1  | W1001  | 1         | pending     | tenant1@visionwest.org.nz    |
| 2  | W1002  | 1         | in-progress | tenant2@visionwest.org.nz    |
| 3  | W1003  | 7         | completed   | user@emerge.co.nz            |
```

**Key Point:** 
- User `admin@williamspropertyservices.co.nz` has `client_id=8` (WPSG)
- But can update work order with `client_id=1` (VisionWest)
- This is correct - they're the service provider managing client work orders

---

## Version
- Implemented in: v2.8.0
- Date: October 20, 2025
- Related: WPSG Client Setup, Multi-Client Work Orders
