# Database Migration Contract

**Feature**: Multi-Client Work Order Management
**Version**: 1.0.0
**Date**: 2025-10-17

## Overview

This contract defines the database migration strategy for transforming the VisionWest work order system from single-tenant to multi-tenant architecture. The migration ensures zero data loss, zero downtime, and complete rollback capability.

## Migration Strategy

**Approach**: Four-phase migration with nullable → backfill → enforce progression

**Duration**: ~30 minutes total (depending on data volume)

**Downtime**: Zero - application continues running throughout migration

**Rollback Capability**: Yes, at each phase boundary

## Phase 1: Schema Extension (5 minutes)

### Objective
Create `clients` table and add nullable `client_id` columns to `users` and `work_orders` tables.

### Migration File
**File**: `backend/migrations/YYYYMMDDHHMMSS-add-multi-client-support-phase1.js`

### Operations

#### 1.1 Create `clients` Table

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  settings JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_clients_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE UNIQUE INDEX idx_clients_code ON clients(code);
```

**Validation**:
```sql
-- Verify table exists
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'clients';
-- Expected: 1
```

#### 1.2 Insert Visionwest Client

```sql
INSERT INTO clients (
  name,
  code,
  status,
  primary_contact_name,
  primary_contact_email,
  created_at,
  updated_at
) VALUES (
  'Visionwest',
  'VISIONWEST',
  'active',
  'Admin',
  'admin@visionwest.com',
  NOW(),
  NOW()
) RETURNING id;
```

**Store Returned ID**: Save this ID for Phase 2 backfill (typically `id = 1`)

**Validation**:
```sql
SELECT * FROM clients WHERE code = 'VISIONWEST';
-- Expected: 1 row with active status
```

#### 1.3 Add `client_id` to `users` Table

```sql
ALTER TABLE users
ADD COLUMN client_id INTEGER,
ADD CONSTRAINT fk_users_client
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

CREATE INDEX idx_users_client_id ON users(client_id);
```

**Validation**:
```sql
-- Verify column exists and is nullable
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'client_id';
-- Expected: client_id, YES, integer

-- Verify all client_id values are NULL
SELECT COUNT(*) FROM users WHERE client_id IS NULL;
-- Expected: Total user count (all users)
```

#### 1.4 Add `client_id` to `work_orders` Table

```sql
ALTER TABLE work_orders
ADD COLUMN client_id INTEGER,
ADD CONSTRAINT fk_work_orders_client
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

CREATE INDEX idx_work_orders_client_id ON work_orders(client_id);
```

**Validation**:
```sql
-- Verify column exists and is nullable
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'work_orders' AND column_name = 'client_id';
-- Expected: client_id, YES, integer

-- Verify all client_id values are NULL
SELECT COUNT(*) FROM work_orders WHERE client_id IS NULL;
-- Expected: Total work order count
```

### Rollback Phase 1

```sql
-- Drop foreign keys and columns
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS fk_work_orders_client;
ALTER TABLE work_orders DROP COLUMN IF EXISTS client_id;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_client;
ALTER TABLE users DROP COLUMN IF EXISTS client_id;

-- Drop clients table
DROP INDEX IF EXISTS idx_clients_code;
DROP INDEX IF EXISTS idx_clients_status;
DROP TABLE IF EXISTS clients;
```

**Post-Rollback Validation**:
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'clients';
-- Expected: 0

SELECT COUNT(*) FROM information_schema.columns
WHERE table_name IN ('users', 'work_orders') AND column_name = 'client_id';
-- Expected: 0
```

---

## Phase 2: Data Backfill (10 minutes)

### Objective
Assign all existing users and work orders to the Visionwest client.

### Script File
**File**: `backend/scripts/backfill-visionwest-client.js`

**Why Separate Script**: Allows monitoring, progress tracking, and safe retry if interrupted.

### Operations

#### 2.1 Get Visionwest Client ID

```javascript
const visionwestClient = await Client.findOne({
  where: { code: 'VISIONWEST' }
});

if (!visionwestClient) {
  throw new Error('Visionwest client not found. Run Phase 1 migration first.');
}

const clientId = visionwestClient.id;
console.log(`Visionwest client ID: ${clientId}`);
```

#### 2.2 Backfill Users

```javascript
const userCount = await User.count({ where: { client_id: null } });
console.log(`Users to backfill: ${userCount}`);

const updatedUsers = await User.update(
  { client_id: clientId },
  { where: { client_id: null } }
);

console.log(`Users updated: ${updatedUsers[0]}`);
```

**SQL Equivalent**:
```sql
UPDATE users
SET client_id = 1  -- Visionwest client ID
WHERE client_id IS NULL;
```

**Validation**:
```sql
-- Check for remaining NULL values
SELECT COUNT(*) FROM users WHERE client_id IS NULL;
-- Expected: 0

-- Verify all assigned to Visionwest
SELECT client_id, COUNT(*) FROM users GROUP BY client_id;
-- Expected: Single row with client_id = 1
```

#### 2.3 Backfill Work Orders

```javascript
const workOrderCount = await WorkOrder.count({ where: { client_id: null } });
console.log(`Work orders to backfill: ${workOrderCount}`);

const updatedWorkOrders = await WorkOrder.update(
  { client_id: clientId },
  { where: { client_id: null } }
);

console.log(`Work orders updated: ${updatedWorkOrders[0]}`);
```

**SQL Equivalent**:
```sql
UPDATE work_orders
SET client_id = 1  -- Visionwest client ID
WHERE client_id IS NULL;
```

**Validation**:
```sql
-- Check for remaining NULL values
SELECT COUNT(*) FROM work_orders WHERE client_id IS NULL;
-- Expected: 0

-- Verify all assigned to Visionwest
SELECT client_id, COUNT(*) FROM work_orders GROUP BY client_id;
-- Expected: Single row with client_id = 1
```

### Rollback Phase 2

```sql
-- Clear backfilled data
UPDATE work_orders SET client_id = NULL WHERE client_id = 1;
UPDATE users SET client_id = NULL WHERE client_id = 1;
```

**Post-Rollback Validation**:
```sql
SELECT COUNT(*) FROM users WHERE client_id IS NOT NULL;
-- Expected: 0

SELECT COUNT(*) FROM work_orders WHERE client_id IS NOT NULL;
-- Expected: 0
```

---

## Phase 3: Enforce Constraints (10 minutes)

### Objective
Make `client_id` required (NOT NULL) and add composite indexes for performance.

### Migration File
**File**: `backend/migrations/YYYYMMDDHHMMSS-add-multi-client-support-phase3.js`

### Operations

#### 3.1 Make `client_id` NOT NULL

**Prerequisites**: Phase 2 validation MUST pass (zero NULL values)

```sql
-- Users table
ALTER TABLE users
ALTER COLUMN client_id SET NOT NULL;

-- Work orders table
ALTER TABLE work_orders
ALTER COLUMN client_id SET NOT NULL;
```

**Validation**:
```sql
-- Verify NOT NULL constraint
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'client_id';
-- Expected: is_nullable = 'NO'

SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'work_orders' AND column_name = 'client_id';
-- Expected: is_nullable = 'NO'
```

#### 3.2 Add Composite Indexes

```sql
-- Users: client + role (for role-based queries)
CREATE INDEX idx_users_client_role ON users(client_id, role);

-- Users: client + email (for login + uniqueness)
CREATE UNIQUE INDEX uq_users_client_email ON users(client_id, email);

-- Work orders: client + status (most common filter)
CREATE INDEX idx_work_orders_client_status ON work_orders(client_id, status);

-- Work orders: client + job_no (uniqueness + lookup)
CREATE UNIQUE INDEX uq_work_orders_client_job_no ON work_orders(client_id, job_no);

-- Work orders: client + date (date-sorted lists)
CREATE INDEX idx_work_orders_client_date ON work_orders(client_id, date DESC);
```

**Note**: `uq_users_client_email` replaces global email uniqueness. If a global unique constraint exists on `users.email`, it must be dropped first:

```sql
-- Check for existing unique constraint
SELECT conname FROM pg_constraint
WHERE conrelid = 'users'::regclass AND contype = 'u';

-- Drop if exists (adjust constraint name as needed)
ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_users_email;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
```

**Validation**:
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('users', 'work_orders')
AND indexname LIKE 'idx_%' OR indexname LIKE 'uq_%';
-- Expected: All 5 indexes listed
```

### Rollback Phase 3

```sql
-- Drop composite indexes
DROP INDEX IF EXISTS idx_work_orders_client_date;
DROP INDEX IF EXISTS uq_work_orders_client_job_no;
DROP INDEX IF EXISTS idx_work_orders_client_status;
DROP INDEX IF EXISTS uq_users_client_email;
DROP INDEX IF EXISTS idx_users_client_role;

-- Make client_id nullable again
ALTER TABLE work_orders ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN client_id DROP NOT NULL;
```

**Post-Rollback Validation**:
```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name IN ('users', 'work_orders') AND column_name = 'client_id';
-- Expected: Both rows with is_nullable = 'YES'
```

---

## Phase 4: Model & Middleware Deployment (5 minutes)

### Objective
Deploy application code changes (Sequelize models, middleware) to production.

**Critical**: Application deployment MUST occur AFTER Phase 3 database migration.

### Operations

#### 4.1 Deploy Backend Changes

**Files Modified/Added**:
- `backend/models/Client.js` (new model)
- `backend/models/User.js` (add `client_id`, associations)
- `backend/models/WorkOrder.js` (add `client_id`, associations)
- `backend/middleware/clientScoping.js` (new middleware)
- `backend/middleware/auth.middleware.js` (extend JWT with `clientId`)
- `backend/routes/client.routes.js` (new routes)
- `backend/controllers/client.controller.js` (new controller)

**Deployment Steps**:
1. Build backend: `npm run build` (if applicable)
2. Run application tests: `npm test`
3. Deploy to production server (Render)
4. Verify health check: `GET /api/health`

#### 4.2 Deploy Frontend Changes

**Files Modified/Added**:
- `frontend/src/components/admin/ClientList.jsx` (new component)
- `frontend/src/components/admin/ClientForm.jsx` (new component)
- `frontend/src/components/admin/ClientSwitcher.jsx` (new component)
- `frontend/src/pages/AdminPanel.jsx` (new page)
- `frontend/src/context/ClientContext.jsx` (extended context)
- `frontend/src/services/clientService.js` (new service)

**Deployment Steps**:
1. Build frontend: `npm run build`
2. Deploy to production (Netlify)
3. Verify deployment: Access application in browser
4. Test login → JWT token includes `clientId`

#### 4.3 Force Token Refresh

**Action**: All users must log in again to receive JWT tokens with `clientId` claim.

**Options**:
1. **Automatic**: Middleware returns `401 Unauthorized` for tokens without `clientId` → frontend redirects to login
2. **Manual**: Send email notification to all users explaining one-time re-login requirement

**Communication Template**:
```
Subject: VisionWest Work Orders - One-Time Login Required

We've upgraded our system to support multiple client organizations.

Action Required: Please log in to the system again today. Your credentials remain the same.

This is a one-time requirement due to security improvements.

Thank you for your understanding!
```

### Rollback Phase 4

1. Revert application deployment to previous version
2. Verify old code works with new database schema (should be compatible - `client_id` nullable)
3. If needed, execute Phase 3 rollback to remove constraints

---

## Complete Rollback Procedure

To fully rollback multi-client migration:

```bash
# Step 1: Revert application deployment (Phase 4 rollback)
# Deploy previous application version

# Step 2: Remove database constraints (Phase 3 rollback)
npm run migration:undo  # Undo Phase 3 migration

# Step 3: Clear backfilled data (Phase 2 rollback)
npm run migration:undo  # Undo Phase 2 migration (if migrated)
# OR run manual rollback script

# Step 4: Remove schema changes (Phase 1 rollback)
npm run migration:undo  # Undo Phase 1 migration
```

---

## Testing Requirements

### Pre-Migration Tests

- [ ] **Database Backup**: Full PostgreSQL backup created and stored securely
- [ ] **Staging Migration**: Complete migration executed successfully on staging environment
- [ ] **Staging Validation**: All validation queries pass on staging database
- [ ] **Application Tests**: All unit and integration tests pass on staging

### Post-Phase 1 Validation

- [ ] `clients` table exists with Visionwest client
- [ ] `users.client_id` column exists and is nullable
- [ ] `work_orders.client_id` column exists and is nullable
- [ ] Foreign key constraints exist
- [ ] Application continues running without errors

### Post-Phase 2 Validation

- [ ] Zero users with `client_id = NULL`
- [ ] Zero work orders with `client_id = NULL`
- [ ] All users assigned to Visionwest client (client_id = 1)
- [ ] All work orders assigned to Visionwest client (client_id = 1)
- [ ] User count matches pre-migration count
- [ ] Work order count matches pre-migration count

### Post-Phase 3 Validation

- [ ] `users.client_id` is NOT NULL
- [ ] `work_orders.client_id` is NOT NULL
- [ ] All 5 composite indexes created successfully
- [ ] Query performance meets targets (<10% degradation)
- [ ] EXPLAIN ANALYZE shows composite indexes being used

### Post-Phase 4 Validation

- [ ] Users can log in and receive JWT token with `clientId` claim
- [ ] Work order list filters by client_id automatically
- [ ] Admin panel displays client management UI
- [ ] Admin can switch client context
- [ ] n8n webhook continues to create work orders (assigned to Visionwest)
- [ ] Cross-client access attempts return 404 Not Found
- [ ] No errors in application logs

---

## Performance Validation

### Baseline Metrics (Pre-Migration)

```sql
-- Work order list query
EXPLAIN ANALYZE
SELECT * FROM work_orders WHERE status = 'pending' ORDER BY date DESC LIMIT 10;
-- Record: Execution time, rows scanned, index used
```

### Post-Migration Metrics (Phase 3 Complete)

```sql
-- Work order list query (client-scoped)
EXPLAIN ANALYZE
SELECT * FROM work_orders
WHERE client_id = 1 AND status = 'pending'
ORDER BY date DESC LIMIT 10;
-- Target: <10% increase in execution time
-- Verify: idx_work_orders_client_status used
```

**Acceptance Criteria**:
- Execution time increase < 10%
- Composite index (`idx_work_orders_client_status`) used in query plan
- No sequential table scans

---

## Data Integrity Validation Queries

Run these queries after each phase to ensure data integrity:

### Users

```sql
-- All users have valid client_id
SELECT COUNT(*) FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.client_id IS NOT NULL AND c.id IS NULL;
-- Expected: 0 (no orphaned users)

-- Email uniqueness per client
SELECT client_id, email, COUNT(*)
FROM users
GROUP BY client_id, email
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicate emails per client)
```

### Work Orders

```sql
-- All work orders have valid client_id
SELECT COUNT(*) FROM work_orders wo
LEFT JOIN clients c ON wo.client_id = c.id
WHERE wo.client_id IS NOT NULL AND c.id IS NULL;
-- Expected: 0 (no orphaned work orders)

-- Job number uniqueness per client
SELECT client_id, job_no, COUNT(*)
FROM work_orders
WHERE job_no IS NOT NULL
GROUP BY client_id, job_no
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicate job numbers per client)
```

### Foreign Keys

```sql
-- Verify foreign key constraints exist
SELECT conname, contype, confdeltype
FROM pg_constraint
WHERE conrelid IN ('users'::regclass, 'work_orders'::regclass)
AND contype = 'f';
-- Expected: fk_users_client and fk_work_orders_client with confdeltype = 'n' (SET NULL)
```

---

## Monitoring & Alerts

### Metrics to Monitor

1. **Migration Progress**
   - Phase completion timestamps
   - Row counts before/after backfill
   - Validation query results

2. **Application Health**
   - API response times (target: <10% increase)
   - Error rates (target: zero errors related to client_id)
   - Active user sessions (expect drop during Phase 4 token refresh)

3. **Database Performance**
   - Query execution times (baseline vs post-migration)
   - Index usage statistics
   - Connection pool utilization

### Alert Conditions

- ⚠️ **Warning**: Any validation query returns unexpected results
- ⚠️ **Warning**: API response time increase >10%
- 🚨 **Critical**: Any user/work order with `client_id = NULL` after Phase 3
- 🚨 **Critical**: Foreign key constraint violation errors

---

## Migration Execution Checklist

### Pre-Migration

- [ ] Database backup created and verified
- [ ] Staging environment migration successful
- [ ] All stakeholders notified of maintenance window
- [ ] Rollback procedure tested on staging
- [ ] Monitoring dashboards prepared

### Phase 1: Schema Extension

- [ ] Run Phase 1 migration script
- [ ] Execute Phase 1 validation queries
- [ ] Verify application continues running
- [ ] Record Visionwest client ID

### Phase 2: Data Backfill

- [ ] Run backfill script with progress logging
- [ ] Execute Phase 2 validation queries
- [ ] Verify zero NULL client_id values
- [ ] Check user/work order counts match pre-migration

### Phase 3: Enforce Constraints

- [ ] Verify Phase 2 validation passed
- [ ] Run Phase 3 migration script
- [ ] Execute Phase 3 validation queries
- [ ] Run performance validation queries (EXPLAIN ANALYZE)

### Phase 4: Application Deployment

- [ ] Deploy backend code changes
- [ ] Deploy frontend code changes
- [ ] Execute Phase 4 validation queries
- [ ] Test login flow (JWT includes clientId)
- [ ] Test work order list (client-scoped)
- [ ] Test n8n webhook (creates Visionwest work orders)
- [ ] Test admin client management UI

### Post-Migration

- [ ] Monitor application for 24 hours
- [ ] Review logs for errors
- [ ] Conduct user acceptance testing
- [ ] Document lessons learned
- [ ] Archive migration artifacts

---

## Support & Troubleshooting

### Common Issues

#### Issue 1: Users with NULL client_id after Phase 2

**Symptom**: Validation query shows users with `client_id = NULL`

**Cause**: Backfill script did not complete or failed partway through

**Resolution**:
```sql
-- Re-run backfill manually
UPDATE users SET client_id = 1 WHERE client_id IS NULL;
UPDATE work_orders SET client_id = 1 WHERE client_id IS NULL;

-- Verify
SELECT COUNT(*) FROM users WHERE client_id IS NULL;
SELECT COUNT(*) FROM work_orders WHERE client_id IS NULL;
```

#### Issue 2: Foreign key constraint violation during Phase 3

**Symptom**: `ERROR: foreign key constraint "fk_users_client" violated`

**Cause**: Orphaned records referencing non-existent client_id

**Resolution**:
```sql
-- Find orphaned records
SELECT id, client_id FROM users WHERE client_id NOT IN (SELECT id FROM clients);
SELECT id, client_id FROM work_orders WHERE client_id NOT IN (SELECT id FROM clients);

-- Fix: Assign to Visionwest client
UPDATE users SET client_id = 1 WHERE client_id NOT IN (SELECT id FROM clients);
UPDATE work_orders SET client_id = 1 WHERE client_id NOT IN (SELECT id FROM clients);
```

#### Issue 3: Duplicate email constraint violation

**Symptom**: `ERROR: duplicate key value violates unique constraint "uq_users_client_email"`

**Cause**: Multiple users with same email exist (rare - single-tenant had global uniqueness)

**Resolution**:
```sql
-- Find duplicates
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Manual resolution: Contact admin to resolve duplicate accounts
-- Option 1: Merge accounts
-- Option 2: Reassign one account to different client
-- Option 3: Deactivate duplicate account
```

---

## Changelog

- 2025-10-17: Initial database migration contract for multi-client architecture
