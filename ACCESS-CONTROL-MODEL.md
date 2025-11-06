# Multi-Client Access Control Model

## Overview
After implementing multi-client support and creating the WPSG client for Williams Property Services Group, the system enforces the following access control model:

## User Roles & Access

### 1. **Client** (`client`)
**Definition:** Organization users who create and track work orders for their client organization.

**Example:** Housing coordinators from VisionWest (`coordinator@visionwest.org.nz`)

**Access:**
- ✅ View only work orders where `authorized_email` matches their email address
- ✅ Request cancellation of their own work orders (status → `cancelled`)
- ✅ Add notes to their own work orders
- ✅ Create new work orders for properties they manage
- ❌ Cannot change status to anything other than `cancelled`
- ❌ Cannot see other users' work orders within the organization
- ❌ Cannot access work orders from other client organizations

**Client Filter:** Scoped to their assigned `client_id` only

**Use Case:** Individual staff members within a housing organization who raise maintenance requests for specific properties they're responsible for.

---

### 2. **Client Admin** (`client_admin`)
**Definition:** Organization administrators with full management access to all work orders within their client organization.

**Example:** VisionWest property management managers (`manager@visionwest.org.nz`)

**Access:**
- ✅ View ALL work orders for their client organization (not limited by email)
- ✅ Create manual work orders for any property in their organization
- ✅ Update any status (pending, in-progress, completed, cancelled)
- ✅ Add notes to any work order in their organization
- ✅ Update work order details (property info, description, urgency, etc.)
- ✅ Manage organization-wide work order operations
- ❌ Cannot access work orders from other client organizations
- ❌ Cannot delete work orders (admin-only capability)

**Client Filter:** Scoped to their assigned `client_id` only

**Use Case:** Senior managers or property management leads who need visibility and control over all maintenance activities within their organization.

---

### 3. **Staff** (`staff`)
**Definition:** Service provider staff who coordinate maintenance work across all client organizations.

**Example:** Williams Property maintenance coordinators (`coordinator@williamspropertyservices.co.nz`)

**Access:**
- ✅ View ALL work orders across ALL clients (VisionWest, WPSG, Emerge, etc.)
- ✅ Update work order status (except cannot cancel - only admin can)
- ✅ Add notes to any work order from any client organization
- ✅ Update work order details across all clients
- ✅ Dashboard shows totals for all clients combined
- ✅ Assign contractors and schedule work
- ❌ Cannot cancel work orders (security measure - admin-only)
- ❌ Cannot delete work orders
- ❌ Cannot create manual work orders (client_admin only)

**Client Filter:** **NO CLIENT FILTER** - Full cross-client access

**Use Case:** Maintenance coordinators and field staff who need to view and update work orders across all client organizations they service.

---

### 4. **Admin** (`admin`)
**Definition:** System administrators with unrestricted access to all platform features and data across all client organizations.

**Example:** Williams Property system administrators (`admin@williamspropertyservices.co.nz`)

**Access:**
- ✅ View ALL work orders across ALL clients
- ✅ Create, update, and delete any work order from any client
- ✅ Update status to any value (including cancellation)
- ✅ Add/delete notes on any work order
- ✅ Delete work orders (permanent removal)
- ✅ Full CRUD operations across all clients and users
- ✅ Dashboard shows totals for all clients combined
- ✅ User management across all organizations
- ✅ System configuration and settings

**Client Filter:** **NO CLIENT FILTER** - Full cross-client access

**Use Case:** IT administrators and senior management who need complete platform control for system maintenance, troubleshooting, and oversight.

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
- **Client users** can only see work orders where their email matches `authorized_email` (email-based filtering)
- **Client admins** see all work orders for their organization but cannot access other clients' data
- **Staff** cannot cancel work orders (admin-only protection against accidental cancellations)
- **Cancelled work orders** cannot be reactivated (audit trail integrity)
- All status changes require authentication and create audit trail entries
- Multi-tenant isolation prevents cross-client data leakage

### ⚠️ Important Notes
- **Role Clarification:**
  - `client` = Organization users who raise work orders (email-scoped access)
  - `client_admin` = Organization administrators (full org access)
  - `staff` = Service provider coordinators (cross-client access)
  - `admin` = System administrators (unrestricted access)
- **User vs Work Order Assignment:**
  - WPSG admin/staff have `client_id = 8` (WPSG - their employer)
  - But they manage work orders with `client_id = 1, 7, etc.` (client organizations)
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
| id | email                                   | role         | client_id | Description                           |
|----|-----------------------------------------|--------------|-----------|---------------------------------------|
| 1  | cameron@visionwest.org.nz              | admin        | 1         | VisionWest system admin               |
| 2  | admin@williamspropertyservices.co.nz   | admin        | 8         | Williams Property system admin        |
| 3  | staff@williamspropertyservices.co.nz   | staff        | 8         | Williams Property coordinator         |
| 4  | housing@visionwest.org.nz              | client_admin | 1         | VisionWest property manager (full)    |
| 5  | coordinator@visionwest.org.nz          | client       | 1         | VisionWest housing coordinator        |
```

### Work Orders Table (Example)
```sql
| id | job_no | client_id | status      | authorized_email              | Description                        |
|----|--------|-----------|-------------|-------------------------------|------------------------------------|
| 1  | W1001  | 1         | pending     | coordinator@visionwest.org.nz| Created by VisionWest coordinator  |
| 2  | W1002  | 1         | in-progress | coordinator@visionwest.org.nz| Visible to coordinator & admins    |
| 3  | W1003  | 7         | completed   | manager@emerge.co.nz         | Emerge organization work order     |
```

**Key Points:** 
- User `coordinator@visionwest.org.nz` (role: `client`) can only see work orders where `authorized_email` matches their email
- User `housing@visionwest.org.nz` (role: `client_admin`) can see ALL work orders with `client_id=1`
- User `staff@williamspropertyservices.co.nz` (role: `staff`) has `client_id=8` (WPSG) but can view/update work orders with `client_id=1, 7, 8` (all clients)
- This is correct - WPSG is the service provider managing work orders for multiple client organizations

---

## Version
- Implemented in: v2.8.0
- Date: October 20, 2025
- Related: WPSG Client Setup, Multi-Client Work Orders
