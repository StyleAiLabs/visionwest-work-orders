# Data Model: Admin Client Filter

**Feature**: 004-add-client-filter
**Date**: 2025-10-19
**Phase**: Phase 1 - Design

## Overview

This feature leverages existing database entities (Client, WorkOrder, User) without requiring schema changes. The data model focuses on the relationships and query patterns needed to support admin client filtering.

## Entity Definitions

### Client (Existing Entity - No Changes)

**Table**: `clients`

**Purpose**: Represents an organization/tenant in the multi-tenant system. Work orders belong to clients.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique client identifier |
| name | STRING | NOT NULL | Client organization name (e.g., "VisionWest Community Trust") |
| code | STRING | UNIQUE, NOT NULL | Short client code (e.g., "VWCT") |
| status | STRING | NOT NULL, DEFAULT 'active' | Client status: 'active', 'inactive', 'suspended' |
| primary_contact_name | STRING | NULLABLE | Main contact person |
| primary_contact_email | STRING | NULLABLE | Main contact email |
| primary_contact_phone | STRING | NULLABLE | Main contact phone |
| createdAt | TIMESTAMP | NOT NULL | Record creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Record last update timestamp |

**Relationships**:
- One Client has many WorkOrders (1:N via `work_orders.client_id`)
- One Client has many Users (1:N via `users.client_id`)

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `code`
- INDEX on `status` (for filtering active clients)

**Validation Rules**:
- `name` must not be empty
- `code` must be unique across all clients
- `status` must be one of: 'active', 'inactive', 'suspended'

---

### WorkOrder (Existing Entity - No Changes)

**Table**: `work_orders`

**Purpose**: Represents a job/work order in the system. Each work order belongs to exactly one client.

**Key Fields** (relevant to filtering):
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique work order identifier |
| client_id | INTEGER | FOREIGN KEY → clients.id, NOT NULL | Owner client of this work order |
| job_no | STRING | UNIQUE (per client), NOT NULL | Job number (scoped to client) |
| status | ENUM | NOT NULL | 'pending', 'in-progress', 'completed', 'cancelled' |
| authorized_email | STRING | NULLABLE | Email of authorized person for this work order |
| date | DATEONLY | NOT NULL | Work order date |
| work_order_type | STRING | NOT NULL | Type: 'manual', 'webhook', etc. |
| created_by | INTEGER | FOREIGN KEY → users.id, NULLABLE | User who created this work order |
| createdAt | TIMESTAMP | NOT NULL | Record creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Record last update timestamp |

**Relationships**:
- Many WorkOrders belong to one Client (N:1 via `client_id`)
- Many WorkOrders belong to one User (N:1 via `created_by`)

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY INDEX on `client_id`
- INDEX on `status`
- INDEX on `authorized_email`
- COMPOSITE INDEX on `(client_id, job_no)` for uniqueness

**Validation Rules**:
- `client_id` must reference existing client
- `job_no` must be unique within client scope
- `status` must be valid enum value

---

### User (Existing Entity - No Changes)

**Table**: `users`

**Purpose**: Represents system users with role-based access. Admin users can filter work orders by client.

**Key Fields** (relevant to authorization):
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| email | STRING | UNIQUE, NOT NULL | User email (login credential) |
| role | ENUM | NOT NULL | 'client', 'client_admin', 'staff', 'admin' |
| client_id | INTEGER | FOREIGN KEY → clients.id, NULLABLE | Assigned client (NULL for global admins) |
| full_name | STRING | NOT NULL | User's full name |
| status | STRING | NOT NULL, DEFAULT 'active' | User status: 'active', 'inactive', 'suspended' |

**Relationships**:
- Many Users belong to one Client (N:1 via `client_id`)
- One User creates many WorkOrders (1:N via `work_orders.created_by`)

**Role Definitions**:
- **admin**: Global admin, can view/filter work orders for ANY client
- **staff**: Client-level staff, can view all work orders for their client
- **client_admin**: Client administrator, can manage users and view all work orders for their client
- **client**: Regular client user, can only view work orders where they are the authorized person

**Authorization Rules for Client Filter**:
- Only users with `role = 'admin'` can see and use the client filter
- Admin users can select any client regardless of their `client_id` assignment
- Non-admin users do NOT see the client filter UI

---

## Query Patterns

### Query 1: Fetch Active Clients (for dropdown population)

**Endpoint**: `GET /api/clients`

**SQL Pattern**:
```sql
SELECT id, name, code, status
FROM clients
WHERE status = 'active'
ORDER BY name ASC
```

**Sequelize Query**:
```javascript
await Client.findAll({
  where: { status: 'active' },
  attributes: ['id', 'name', 'code', 'status'],
  order: [['name', 'ASC']]
});
```

**Authorization**: Requires authenticated user with `role = 'admin'`

**Performance**:
- Expected result set: 10-50 clients
- Query time: <50ms (indexed on status)
- Response size: <5KB

---

### Query 2: Fetch Work Orders Filtered by Client

**Endpoint**: `GET /api/work-orders?clientId=X&page=1&limit=5`

**SQL Pattern** (simplified):
```sql
SELECT wo.*
FROM work_orders wo
WHERE wo.client_id = :clientId
  AND wo.status = :status (if status filter applied)
  AND wo.authorized_email = :authorizedEmail (if authorized person filter applied)
ORDER BY wo.createdAt DESC
LIMIT :limit OFFSET :offset
```

**Sequelize Query**:
```javascript
const where = { client_id: clientId };
if (status) where.status = status;
if (authorizedEmail) where.authorized_email = authorizedEmail;

const { rows, count } = await WorkOrder.findAndCountAll({
  where,
  include: [{ model: Client, attributes: ['name', 'code'] }],
  order: [['createdAt', 'DESC']],
  limit: parseInt(limit),
  offset: (page - 1) * limit
});
```

**Implementation Note**: The backend already uses `X-Client-Context` header to set `req.clientId` via middleware. The controller reads `req.clientId` and applies it to the query's `where` clause.

**Performance**:
- Expected result set per page: 5-10 work orders
- Query time: <200ms (indexed on client_id, status, authorized_email)
- Response size: <20KB per page

---

### Query 3: Fetch Authorized Persons for Selected Client

**Endpoint**: `GET /api/work-orders/authorized-persons?clientId=X`

**SQL Pattern**:
```sql
SELECT DISTINCT authorized_email
FROM work_orders
WHERE client_id = :clientId
  AND authorized_email IS NOT NULL
ORDER BY authorized_email ASC
```

**Sequelize Query**:
```javascript
const authorizedPersons = await WorkOrder.findAll({
  where: {
    client_id: clientId,
    authorized_email: { [Op.ne]: null }
  },
  attributes: [
    [Sequelize.fn('DISTINCT', Sequelize.col('authorized_email')), 'authorized_email']
  ],
  order: [['authorized_email', 'ASC']],
  raw: true
});
```

**Authorization**: Requires authenticated admin user

**Performance**:
- Expected result set: 5-20 authorized persons per client
- Query time: <100ms (indexed on authorized_email and client_id)
- Response size: <2KB

---

### Query 4: Dashboard Summary Counts by Client

**Endpoint**: `GET /api/work-orders/summary?clientId=X`

**SQL Pattern**:
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) as total_count
FROM work_orders
WHERE client_id = :clientId (if clientId specified)
```

**Sequelize Query**:
```javascript
const where = clientId ? { client_id: clientId } : {};

const counts = await WorkOrder.findAll({
  where,
  attributes: [
    'status',
    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
  ],
  group: ['status'],
  raw: true
});
```

**Authorization**: Admin users can pass any clientId; non-admin users default to their assigned client

**Performance**:
- Query time: <100ms (indexed on status and client_id)
- Response size: <1KB

---

## State Transitions

### Client Filter State Machine

**States**:
1. **All Clients** (default): No client filter applied, admin sees work orders from all clients
2. **Specific Client Selected**: Client filter applied, admin sees only that client's work orders
3. **Client with No Work Orders**: Client filter applied but yields empty result set

**Transitions**:
- **Initial Load** → All Clients (default)
- **User Selects Client X** → Specific Client Selected
- **User Selects "All Clients"** → All Clients
- **Specific Client Selected** → **Another Specific Client** (when user switches clients)

**Side Effects on Transitions**:
- When transitioning to **Specific Client Selected**:
  - Reset pagination to page 1
  - Recalculate total pages based on filtered count
  - Update authorized person filter options (fetch for new client)
  - If current authorized person doesn't exist in new client, clear authorized person filter

- When transitioning to **All Clients**:
  - Reset pagination to page 1
  - Authorized person filter shows ALL authorized persons across clients
  - Maintain authorized person selection if applicable

---

## Validation Rules

### Frontend Validation

**Client Selection**:
- Selected client ID must be either:
  - `null` or `'all'` (representing "All Clients"), OR
  - A valid integer matching a client ID from the fetched client list

**Filter Combination**:
- Client filter and authorized person filter can be active simultaneously
- When both active, results must match BOTH criteria (AND logic)
- When client changes, authorized person filter validity is checked

**Pagination**:
- When client filter changes, page must reset to 1
- Page number must be <= total pages for current filtered result set

---

### Backend Validation

**Authorization Check**:
```javascript
// Middleware: verifyToken + checkRole(['admin'])
if (req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
}
```

**Client ID Validation**:
```javascript
// If clientId provided in X-Client-Context header
if (req.headers['x-client-context']) {
  const clientId = parseInt(req.headers['x-client-context']);

  // Verify client exists
  const client = await Client.findByPk(clientId);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  req.clientId = clientId;
} else {
  // No header = All Clients (for admin users)
  req.clientId = null;
}
```

**Query Parameter Validation**:
- `page`: Must be positive integer, default = 1
- `limit`: Must be positive integer between 1-100, default = 5
- `status`: Must be one of enum values if provided
- `authorizedEmail`: No strict validation (string match)

---

## Data Integrity Constraints

### Foreign Key Constraints

**work_orders.client_id → clients.id**:
- ON DELETE: RESTRICT (cannot delete client with work orders)
- ON UPDATE: CASCADE (if client ID changes, update work orders)

**work_orders.created_by → users.id**:
- ON DELETE: SET NULL (if user deleted, work orders remain but creator is null)
- ON UPDATE: CASCADE

**users.client_id → clients.id**:
- ON DELETE: RESTRICT (cannot delete client with users)
- ON UPDATE: CASCADE

### Uniqueness Constraints

**clients.code**: Global UNIQUE constraint

**work_orders.job_no**: UNIQUE within client scope (composite unique index on `client_id, job_no`)

---

## Performance Optimization

### Database Indexes (Existing)

```sql
-- Clients table
CREATE INDEX idx_clients_status ON clients(status);

-- Work Orders table
CREATE INDEX idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_authorized_email ON work_orders(authorized_email);
CREATE INDEX idx_work_orders_created_at ON work_orders(createdAt);

-- Composite indexes
CREATE UNIQUE INDEX idx_work_orders_client_job ON work_orders(client_id, job_no);
CREATE INDEX idx_work_orders_client_status ON work_orders(client_id, status);
```

### Query Optimization Strategies

1. **Always filter by client_id first**: Most selective filter for work orders query
2. **Use composite indexes**: `(client_id, status)` for combined filtering
3. **Limit result sets**: Always use pagination (LIMIT/OFFSET)
4. **Select only needed columns**: Avoid `SELECT *` in production queries
5. **Cache client list**: Frontend can cache for session duration (small dataset)

---

## Security Considerations

### Access Control

- Client list endpoint: **Admin role required**
- Work order endpoints: **Role-based**:
  - Admin: Can access any client's work orders
  - Client/Staff/Client Admin: Limited to their assigned client
- Client filter UI: **Rendered only for admin users**

### Data Exposure

- Client list endpoint returns minimal fields: `id, name, code, status`
- No sensitive client contact information exposed
- Work order queries still enforce RBAC even with client filter

### Audit Trail

- No new audit requirements for this feature
- Existing work order access logging continues to apply
- Admin actions (viewing different clients) are implicitly logged via JWT token in request logs

---

## Migration Requirements

**None**: This feature requires no database migrations. All entities and relationships already exist.

---

## Summary

The data model for this feature is minimal, leveraging existing entities without schema changes:

- **Client** entity: Already exists, no changes
- **WorkOrder** entity: Already exists, no changes
- **User** entity: Already exists, no changes
- **Query patterns**: Extend existing queries with client_id filtering
- **Indexes**: All required indexes already present
- **Relationships**: All relationships already defined

The feature is purely additive, using existing infrastructure to expose client-based filtering to admin users through a new UI component and minimal backend controller additions.
