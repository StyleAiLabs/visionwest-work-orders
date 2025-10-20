# WPSG Client Clarification

## Overview
Williams Property Services Group (WPSG) appears in the `clients` table but is **NOT a client organization** - it is the **supplier/service provider company**.

## Why WPSG Exists in the Clients Table

### Technical Reason
The multi-client architecture requires all users to belong to a `client_id` for proper access control and data scoping. Since Williams Property staff members need user accounts in the system, we created WPSG as their organizational container.

### Purpose
- **User Management**: Houses Williams Property employee accounts
- **Access Control**: Enables role-based permissions for staff and admin
- **Not a Service Recipient**: WPSG does not receive work order services

## Implementation Details

### Database Structure
```sql
-- WPSG in clients table
INSERT INTO clients (id, name, code, status) VALUES
(8, 'Williams Property Services Group', 'WPSG', 'active');

-- Williams Property staff assigned to WPSG
UPDATE users 
SET client_id = 8 
WHERE email LIKE '%@williamspropertyservices.co.nz';
```

### Users Assigned to WPSG
```sql
| Email                                   | Role  | Client ID | Client Code |
|-----------------------------------------|-------|-----------|-------------|
| admin@williamspropertyservices.co.nz   | admin | 8         | WPSG        |
| staff@williamspropertyservices.co.nz   | staff | 8         | WPSG        |
```

### Work Orders
```sql
-- Work orders belong to ACTUAL clients (not WPSG)
SELECT client_id, COUNT(*) FROM work_orders GROUP BY client_id;

| client_id | count |
|-----------|-------|
| 1         | 100   |  -- VisionWest
| 7         | 15    |  -- Emerge
| 8         | 0     |  -- WPSG (none - it's the supplier!)
```

## Key Rules

### ✅ DO:
- Keep WPSG in the clients table for user management
- Assign Williams Property staff to `client_id = 8`
- Allow WPSG staff to access ALL client work orders
- Protect WPSG from accidental deletion

### ❌ DON'T:
- Show WPSG in client filter dropdowns
- Assign work orders to `client_id = 8`
- Treat WPSG as a service recipient
- Delete or archive WPSG

## Code Implementation

### Client List Endpoint (Excludes WPSG)
```javascript
// backend/controllers/client.controller.js
exports.getClients = async (req, res) => {
    const clients = await Client.findAll({
        where: { 
            status: 'active',
            code: { [Op.ne]: 'WPSG' } // EXCLUDE WPSG from dropdown
        },
        order: [['name', 'ASC']]
    });
    // Returns: VisionWest, Emerge (NOT WPSG)
};
```

### Delete Protection
```javascript
// Prevent deletion of WPSG
if (client.code === 'WPSG') {
    return res.status(403).json({
        success: false,
        message: 'Cannot delete WPSG - supplier company for user management'
    });
}
```

### Work Order Access (WPSG Staff See All)
```javascript
// WPSG staff/admin see ALL work orders across ALL clients
if (['staff', 'admin'].includes(userRole)) {
    // NO client filter - see everything
    whereClause = {}; // VisionWest + Emerge + all other clients
}
```

## UI/UX Considerations

### Client Filter Dropdown
**Shows:**
- ✅ VisionWest
- ✅ Emerge
- ✅ Future client organizations

**Hides:**
- ❌ WPSG (excluded from API response)

### Client Management Page (Admin Only)
**Shows all clients including WPSG:**
- VisionWest (client) - 24 users, 100 work orders
- Emerge (client) - 6 users, 15 work orders
- WPSG (supplier) - 4 users, 0 work orders ⚠️

**Visual Indicator:**
Add a badge or label: "Supplier" for WPSG to distinguish it from client organizations.

## Business Logic

### Who is Who?
```
┌─────────────────────────────────────────┐
│  Williams Property Services Group (WPSG)│
│  Role: Supplier/Service Provider         │
│  Staff: admin@williamspropertyservices   │
│         staff@williamspropertyservices   │
└─────────────────────────────────────────┘
                  │
                  │ Provides Services To
                  ▼
┌──────────────────────────────────────────┐
│  Client Organizations                     │
│  - VisionWest (social housing)           │
│  - Emerge (client)                       │
│  - Future clients...                     │
└──────────────────────────────────────────┘
```

### Work Order Flow
1. **VisionWest tenant** reports maintenance issue
2. **VisionWest client_admin** creates work order
3. Work order assigned to `client_id = 1` (VisionWest)
4. **WPSG staff** receives notification
5. **WPSG staff** updates status, adds notes
6. **Williams Property** performs the work
7. Work order completed

**Key Point:** Work order belongs to VisionWest (`client_id=1`), NOT WPSG (`client_id=8`)

## Migration Considerations

### If We Ever Need to Separate WPSG

If business requirements change and we need to completely separate WPSG from the clients table:

**Option 1: Create `suppliers` table**
```sql
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(50),
    ...
);

ALTER TABLE users ADD COLUMN supplier_id INTEGER;
```

**Option 2: Add `organization_type` field**
```sql
ALTER TABLE clients ADD COLUMN organization_type VARCHAR(20);
-- 'client' or 'supplier'

UPDATE clients SET organization_type = 'supplier' WHERE code = 'WPSG';
UPDATE clients SET organization_type = 'client' WHERE code != 'WPSG';
```

For now, the current approach (WPSG in clients table, excluded from filters) works well.

## Testing

### Verify WPSG is Hidden from Filters
```bash
# As WPSG admin/staff
curl -H "Authorization: Bearer <token>" \
  http://localhost:5002/api/clients/list

# Expected response (WPSG excluded):
{
  "success": true,
  "clients": [
    { "id": 7, "name": "Emerge", "code": "EMERGE" },
    { "id": 1, "name": "Visionwest", "code": "VISIONWEST" }
  ]
}
```

### Verify WPSG Cannot Be Deleted
```bash
curl -X DELETE \
  "http://localhost:5002/api/clients/8?confirm=true" \
  -H "Authorization: Bearer <admin_token>"

# Expected response:
{
  "success": false,
  "message": "Cannot delete WPSG - supplier company for user management"
}
```

### Verify WPSG Staff See All Work Orders
```bash
# Login as WPSG admin
# Fetch work orders
# Should see VisionWest + Emerge work orders combined
```

## Related Files
- `backend/controllers/client.controller.js` - WPSG exclusion logic
- `backend/scripts/create-wpsg-client.js` - WPSG setup script
- `ACCESS-CONTROL-MODEL.md` - Full access control documentation
- `WPSG-IMPLEMENTATION-SUMMARY.md` - Implementation summary

## Version
- Created: October 20, 2025
- Version: 2.8.0
- Related: Multi-Client Work Orders, WPSG Client Setup
