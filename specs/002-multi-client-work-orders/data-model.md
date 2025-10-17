# Data Model: Multi-Client Work Order Management

**Feature**: Multi-Client Work Order Management
**Date**: 2025-10-17
**Purpose**: Define database schema changes and entity relationships for multi-tenant support

## Overview

This document specifies the data model changes required to transform the single-tenant VisionWest work order system into a multi-client (multi-tenant) platform. The core change introduces a `Client` entity with one-to-many relationships to `User` and `WorkOrder` entities.

## Entity Definitions

### New Entity: Client

Represents an independent organization/business using the work order management platform.

**Attributes**:

| Field                     | Type         | Constraints                  | Description                                      |
|---------------------------|--------------|------------------------------|--------------------------------------------------|
| id                        | INTEGER      | PRIMARY KEY, AUTO_INCREMENT  | Unique identifier for the client organization    |
| name                      | VARCHAR(255) | NOT NULL                     | Client organization name (e.g., "Visionwest")    |
| code                      | VARCHAR(50)  | NOT NULL, UNIQUE             | Short code for client (e.g., "VISIONWEST")       |
| status                    | ENUM         | NOT NULL, DEFAULT 'active'   | 'active', 'inactive', 'archived'                 |
| primary_contact_name      | VARCHAR(255) | NULL                         | Main contact person for this client              |
| primary_contact_email     | VARCHAR(255) | NULL                         | Contact email address                            |
| primary_contact_phone     | VARCHAR(50)  | NULL                         | Contact phone number                             |
| settings                  | JSONB        | NULL                         | Client-specific settings (future: branding, etc) |
| created_at                | TIMESTAMP    | NOT NULL, DEFAULT NOW()      | Record creation timestamp                        |
| updated_at                | TIMESTAMP    | NOT NULL, DEFAULT NOW()      | Last update timestamp                            |

**Validation Rules**:
- `name`: Required, 1-255 characters, trimmed
- `code`: Required, 1-50 characters, uppercase, alphanumeric + underscore/hyphen only, unique
- `status`: Must be one of: 'active', 'inactive', 'archived'
- `primary_contact_email`: If provided, must be valid email format
- `primary_contact_phone`: If provided, 10-20 characters

**Business Rules**:
- Code is immutable after creation (prevents breaking relationships)
- Cannot delete client with active users or work orders (soft delete via status='archived')
- First client created is always Visionwest (code: 'VISIONWEST')
- `settings` JSONB for future extensibility (branding, integrations)

**Indexes**:
```sql
CREATE INDEX idx_clients_status ON clients(status);
CREATE UNIQUE INDEX idx_clients_code ON clients(code);
```

---

### Modified Entity: User (Extended)

Existing user entity extended with client organization relationship.

**New Attributes**:

| Field      | Type    | Constraints                                   | Description                                    |
|------------|---------|-----------------------------------------------|------------------------------------------------|
| client_id  | INTEGER | FOREIGN KEY → clients(id), ON DELETE SET NULL | Client organization this user belongs to       |

**Migration Notes**:
- Initially nullable during migration
- Backfill with Visionwest client ID for existing users
- Change to NOT NULL after backfill verification
- Foreign key with ON DELETE SET NULL (preserves orphaned users for audit)

**Modified Validation Rules**:
- After migration: `client_id` is required for all new users
- User email uniqueness scoped to client (allow `admin@example.com` for multiple clients)

**Updated Business Rules**:
- Users belong to exactly one client organization
- Admin role users can view data across all clients (via context switching)
- Client, client_admin, staff roles are scoped to their client_id
- User cannot be reassigned to different client (data integrity - create new user instead)

**New Indexes**:
```sql
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_client_role ON users(client_id, role);
CREATE INDEX idx_users_client_email ON users(client_id, email);
```

---

### Modified Entity: WorkOrder (Extended)

Existing work order entity extended with client organization relationship.

**New Attributes**:

| Field      | Type    | Constraints                                   | Description                                    |
|------------|---------|-----------------------------------------------|------------------------------------------------|
| client_id  | INTEGER | FOREIGN KEY → clients(id), ON DELETE SET NULL | Client organization this work order belongs to |

**Migration Notes**:
- Initially nullable during migration
- Backfill with Visionwest client ID for existing work orders
- Change to NOT NULL after backfill verification
- Foreign key with ON DELETE SET NULL (preserves orphaned work orders)

**Modified Validation Rules**:
- After migration: `client_id` is required for all new work orders
- `job_no` uniqueness scoped to client (each client has independent numbering)

**Updated Business Rules**:
- Work orders belong to exactly one client organization
- All work order operations (create, read, update, delete) automatically scoped by client_id
- n8n webhook-created work orders always assigned to Visionwest client
- Work order cannot be reassigned to different client (data integrity)

**New Indexes**:
```sql
CREATE INDEX idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX idx_work_orders_client_status ON work_orders(client_id, status);
CREATE INDEX idx_work_orders_client_job_no ON work_orders(client_id, job_no);
CREATE INDEX idx_work_orders_client_date ON work_orders(client_id, date DESC);
```

---

## Entity Relationships

```
┌─────────────┐
│   Client    │
│             │
│ - id (PK)   │
│ - name      │
│ - code      │
│ - status    │
└──────┬──────┘
       │
       │ 1:N
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌─────────────┐              ┌──────────────┐
│    User     │              │  WorkOrder   │
│             │              │              │
│ - id (PK)   │              │ - id (PK)    │
│ - email     │              │ - job_no     │
│ - role      │              │ - status     │
│ - client_id │◄─────────────┤ - client_id  │
│   (FK)      │   created_by │   (FK)       │
└─────────────┘              └──────────────┘
```

**Cardinality**:
- `Client → User`: One-to-Many (1:N)
- `Client → WorkOrder`: One-to-Many (1:N)
- `User → WorkOrder`: One-to-Many (1:N) via `created_by` (existing relationship)

**Referential Integrity**:
- `users.client_id` → `clients.id` (ON DELETE SET NULL)
- `work_orders.client_id` → `clients.id` (ON DELETE SET NULL)
- Soft delete preferred for clients (status='archived') to avoid orphaned records

---

## Data Integrity Constraints

### Unique Constraints

```sql
-- Client code must be unique
ALTER TABLE clients ADD CONSTRAINT uq_clients_code UNIQUE (code);

-- Email unique per client (not globally unique)
-- Note: Requires dropping existing unique constraint if present
ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_users_email;
CREATE UNIQUE INDEX uq_users_client_email ON users(client_id, email);

-- Job number unique per client (not globally unique)
-- Note: Existing job_no may not have unique constraint
CREATE UNIQUE INDEX uq_work_orders_client_job_no ON work_orders(client_id, job_no);
```

### Foreign Key Constraints

```sql
-- User belongs to client
ALTER TABLE users
ADD CONSTRAINT fk_users_client
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

-- Work order belongs to client
ALTER TABLE work_orders
ADD CONSTRAINT fk_work_orders_client
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;
```

### Check Constraints

```sql
-- Client status must be valid
ALTER TABLE clients
ADD CONSTRAINT chk_clients_status
CHECK (status IN ('active', 'inactive', 'archived'));
```

---

## Migration Plan

### Phase 1: Schema Changes (Nullable)

**Step 1**: Create `clients` table
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
```

**Step 2**: Insert Visionwest client
```sql
INSERT INTO clients (name, code, status, primary_contact_name)
VALUES ('Visionwest', 'VISIONWEST', 'active', 'Admin')
RETURNING id;
-- Store returned ID for backfill step
```

**Step 3**: Add nullable `client_id` columns
```sql
-- Add to users table
ALTER TABLE users
ADD COLUMN client_id INTEGER,
ADD CONSTRAINT fk_users_client
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

CREATE INDEX idx_users_client_id ON users(client_id);

-- Add to work_orders table
ALTER TABLE work_orders
ADD COLUMN client_id INTEGER,
ADD CONSTRAINT fk_work_orders_client
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

CREATE INDEX idx_work_orders_client_id ON work_orders(client_id);
```

### Phase 2: Data Backfill

**Step 4**: Backfill existing data
```sql
-- Get Visionwest client ID
SELECT id FROM clients WHERE code = 'VISIONWEST';
-- Assume id = 1

-- Backfill users
UPDATE users
SET client_id = 1
WHERE client_id IS NULL;

-- Verify: Check for any remaining null values
SELECT COUNT(*) FROM users WHERE client_id IS NULL;
-- Expected: 0

-- Backfill work orders
UPDATE work_orders
SET client_id = 1
WHERE client_id IS NULL;

-- Verify: Check for any remaining null values
SELECT COUNT(*) FROM work_orders WHERE client_id IS NULL;
-- Expected: 0
```

### Phase 3: Enforce Constraints

**Step 5**: Make `client_id` NOT NULL
```sql
-- After verification in Step 4
ALTER TABLE users
ALTER COLUMN client_id SET NOT NULL;

ALTER TABLE work_orders
ALTER COLUMN client_id SET NOT NULL;
```

**Step 6**: Add composite indexes
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

### Rollback Plan

Each migration step has corresponding rollback:

```sql
-- Rollback Step 6: Drop composite indexes
DROP INDEX IF EXISTS uq_work_orders_client_job_no;
DROP INDEX IF EXISTS idx_work_orders_client_date;
DROP INDEX IF EXISTS idx_work_orders_client_status;
DROP INDEX IF EXISTS uq_users_client_email;
DROP INDEX IF EXISTS idx_users_client_role;

-- Rollback Step 5: Make client_id nullable again
ALTER TABLE work_orders ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN client_id DROP NOT NULL;

-- Rollback Step 4: Clear backfilled data
UPDATE work_orders SET client_id = NULL;
UPDATE users SET client_id = NULL;

-- Rollback Step 3: Drop foreign keys and columns
ALTER TABLE work_orders DROP CONSTRAINT fk_work_orders_client;
ALTER TABLE work_orders DROP COLUMN client_id;

ALTER TABLE users DROP CONSTRAINT fk_users_client;
ALTER TABLE users DROP COLUMN client_id;

-- Rollback Step 2: Delete Visionwest client
DELETE FROM clients WHERE code = 'VISIONWEST';

-- Rollback Step 1: Drop clients table
DROP TABLE IF EXISTS clients;
```

---

## Sequelize Model Definitions

### Client Model (`backend/models/Client.js`)

```javascript
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
        is: /^[A-Z0-9_-]+$/i  // Alphanumeric, underscore, hyphen
      },
      set(value) {
        this.setDataValue('code', value.toUpperCase());
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      allowNull: false,
      defaultValue: 'active'
    },
    primary_contact_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    primary_contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    primary_contact_phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [10, 20]
      }
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'clients',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['code'], unique: true }
    ]
  });

  Client.associate = (models) => {
    Client.hasMany(models.User, {
      foreignKey: 'client_id',
      onDelete: 'SET NULL',
      as: 'users'
    });

    Client.hasMany(models.WorkOrder, {
      foreignKey: 'client_id',
      onDelete: 'SET NULL',
      as: 'workOrders'
    });
  };

  return Client;
};
```

### User Model Changes (`backend/models/User.js`)

```javascript
// Add to existing User model definition

// In attributes:
client_id: {
  type: DataTypes.INTEGER,
  allowNull: false,  // After migration
  references: {
    model: 'clients',
    key: 'id'
  }
}

// In associate function:
User.belongsTo(models.Client, {
  foreignKey: 'client_id',
  as: 'client'
});

// In indexes array:
{
  fields: ['client_id']
},
{
  fields: ['client_id', 'role']
},
{
  fields: ['client_id', 'email'],
  unique: true  // Email unique per client
}
```

### WorkOrder Model Changes (`backend/models/WorkOrder.js`)

```javascript
// Add to existing WorkOrder model definition

// In attributes:
client_id: {
  type: DataTypes.INTEGER,
  allowNull: false,  // After migration
  references: {
    model: 'clients',
    key: 'id'
  }
}

// In associate function:
WorkOrder.belongsTo(models.Client, {
  foreignKey: 'client_id',
  as: 'client'
});

// In indexes array:
{
  fields: ['client_id']
},
{
  fields: ['client_id', 'status']
},
{
  fields: ['client_id', 'job_no'],
  unique: true  // Job number unique per client
},
{
  fields: ['client_id', 'date']
}
```

---

## Query Performance Analysis

### Before Multi-Client (Single-Tenant)

```sql
-- Work order list query
SELECT * FROM work_orders WHERE status = 'pending' ORDER BY date DESC LIMIT 10;
-- Uses: idx_work_orders_status
-- Estimated rows scanned: 100-500
-- Performance: ~50ms
```

### After Multi-Client (Multi-Tenant)

```sql
-- Work order list query (client-scoped)
SELECT * FROM work_orders
WHERE client_id = 1 AND status = 'pending'
ORDER BY date DESC LIMIT 10;
-- Uses: idx_work_orders_client_status (composite index)
-- Estimated rows scanned: 10-50 (10x reduction)
-- Target performance: ~55ms (<10% increase)
```

**Performance Validation**:
- Run EXPLAIN ANALYZE on production-like data volumes
- Verify composite index usage (no sequential scans)
- Monitor query performance in staging environment
- Load test with multiple concurrent clients

---

## Data Validation Checklist

Post-migration validation queries:

```sql
-- 1. All users have client_id
SELECT COUNT(*) FROM users WHERE client_id IS NULL;
-- Expected: 0

-- 2. All work orders have client_id
SELECT COUNT(*) FROM work_orders WHERE client_id IS NULL;
-- Expected: 0

-- 3. All client_ids reference valid clients
SELECT COUNT(*) FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE c.id IS NULL;
-- Expected: 0

-- 4. Visionwest client exists
SELECT * FROM clients WHERE code = 'VISIONWEST';
-- Expected: 1 row

-- 5. All existing data assigned to Visionwest
SELECT client_id, COUNT(*) FROM users GROUP BY client_id;
SELECT client_id, COUNT(*) FROM work_orders GROUP BY client_id;
-- Expected: All counts under Visionwest client_id

-- 6. Foreign key constraints active
SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'users'::regclass AND contype = 'f';
-- Expected: fk_users_client

SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'work_orders'::regclass AND contype = 'f';
-- Expected: fk_work_orders_client
```

---

## Changelog

- 2025-10-17: Initial data model specification created
