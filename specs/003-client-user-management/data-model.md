# Data Model: Client User Management

**Feature**: 003-client-user-management
**Phase**: 1 (Design & Contracts)
**Date**: 2025-10-19

## Overview

This feature reuses the existing User and Client models with no database schema changes required. The existing models already support all fields needed for client user management: multi-tenant isolation (client_id), role-based access (role enum), and contact information (phone_number).

---

## Existing Entities (Reused)

### User

**Table**: `users`
**Model File**: `/backend/models/user.model.js`
**Status**: EXISTING - No changes required

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique user identifier |
| username | STRING | UNIQUE, NOT NULL | Username for login (deprecated in favor of email) |
| email | STRING | NOT NULL, VALIDATED | User's email address (primary login credential) |
| password | STRING | NOT NULL | Bcrypt-hashed password |
| role | ENUM | NOT NULL | User role: 'client', 'client_admin', 'staff', 'admin' |
| full_name | STRING | NOT NULL | User's full name for display |
| phone_number | STRING | NULLABLE | Phone number (optional, validated when provided) |
| organization | STRING | DEFAULT 'VisionWest Community Trust' | Legacy organization field |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| client_id | INTEGER | FK → clients(id), NULLABLE | Multi-tenant foreign key |
| account_manager_id | INTEGER | FK → users(id), NULLABLE | Reference to account manager |
| createdAt | TIMESTAMP | AUTO | Record creation timestamp |
| updatedAt | TIMESTAMP | AUTO | Record last update timestamp |

**Relationships**:
- `belongsTo Client` (via client_id)
- `belongsTo User` (via account_manager_id, self-referential)

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `username`
- INDEX on `email` (for login lookups)
- INDEX on `client_id` (for multi-tenant queries)
- **REQUIRED NEW INDEX**: Compound unique index on `(LOWER(email), client_id)` to enforce email uniqueness within organization

**Validation Rules** (Sequelize model level):
- `email`: Must match email regex pattern
- `role`: Must be one of enum values
- `is_active`: Boolean type enforcement

**Business Rules for This Feature**:
1. Client admins can only create users with role 'client' or 'client_admin'
2. Created users must have same client_id as the creating admin
3. Email must be unique within the client organization (not globally)
4. Phone number is optional but validated if provided (E.164 format)
5. Initial password must be auto-generated and bcrypt-hashed before storage

---

### Client

**Table**: `clients`
**Model File**: `/backend/models/client.model.js`
**Status**: EXISTING - No changes required

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Unique client identifier |
| name | STRING | NOT NULL | Client organization name |
| code | STRING | UNIQUE, NOT NULL, UPPERCASE | Client code (e.g., 'VWCT', 'ACME') |
| status | STRING | NOT NULL | Status: 'active', 'inactive', 'archived' |
| primary_contact_name | STRING | NULLABLE | Primary contact person name |
| primary_contact_email | STRING | NULLABLE, VALIDATED | Primary contact email |
| primary_contact_phone | STRING | NULLABLE | Primary contact phone |
| settings | JSONB | NULLABLE | Client-specific settings (JSON object) |
| createdAt | TIMESTAMP | AUTO | Record creation timestamp |
| updatedAt | TIMESTAMP | AUTO | Record last update timestamp |

**Relationships**:
- `hasMany User` (via client_id foreign key in users table)

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `code`

**Business Rules for This Feature**:
1. Users created via this feature inherit client_id from the admin's client association
2. Client admins can only view/manage users belonging to their own client
3. Client status must be 'active' for user creation (validated via existing clientScoping middleware)

---

## New Entities

**None required**. All necessary data structures exist in current schema.

---

## Database Migrations Required

### Migration 1: Add Compound Unique Index on User Email + Client ID

**Purpose**: Enforce email uniqueness within each client organization while allowing same email across different clients (multi-tenant isolation).

**Migration File**: `/backend/migrations/YYYYMMDDHHMMSS-add-unique-email-client-index.js`

**Up Migration**:
```sql
CREATE UNIQUE INDEX user_email_client_idx
ON users (LOWER(email), client_id)
WHERE client_id IS NOT NULL;
```

**Down Migration**:
```sql
DROP INDEX IF EXISTS user_email_client_idx;
```

**Rationale**:
- Uses `LOWER(email)` to enforce case-insensitive uniqueness
- Includes `WHERE client_id IS NOT NULL` to handle legacy users without client association
- Prevents duplicate emails within organization at database level (strongest guarantee)
- Prevents race conditions during concurrent user creation

**Sequelize Migration Code**:
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX user_email_client_idx
      ON users (LOWER(email), client_id)
      WHERE client_id IS NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'user_email_client_idx');
  }
};
```

---

## Data Validation Rules

### User Creation Validation

**Required Fields**:
- full_name: Non-empty string, 2-100 characters
- email: Valid email format, unique within client organization
- role: Must be 'client' or 'client_admin' (validated at API layer)
- client_id: Must match authenticated admin's client_id (auto-assigned, not user-provided)

**Optional Fields**:
- phone_number: If provided, must be valid E.164 format (validated via libphonenumber-js)

**Auto-Generated Fields**:
- password: 12-character secure random password, bcrypt-hashed before storage
- username: Set to email value (for backward compatibility with existing User model)
- organization: Set to client.name (legacy field)
- is_active: Default TRUE
- createdAt/updatedAt: Auto-managed by Sequelize

**Validation Errors**:
- Duplicate email: `{ error: "A user with this email already exists in your organization" }`
- Invalid email format: `{ error: "Please provide a valid email address" }`
- Invalid phone: `{ error: "Please provide a valid phone number in international format" }`
- Invalid role: `{ error: "You can only assign Client User or Client Admin roles" }`
- Missing required field: `{ error: "Full name and email are required" }`

---

### User Update Validation

**Role Update**:
- New role must be 'client' or 'client_admin'
- Cannot change own role (prevent self-demotion)
- User must belong to admin's client organization

**Contact Details Update**:
- Email: If changed, must be unique within client organization
- Phone: If provided, must be valid E.164 format
- Full name: Non-empty string, 2-100 characters
- User must belong to admin's client organization

---

## State Transitions

### User Lifecycle States

```
[Not Exists]
    ↓ (Admin creates user)
[Created - Active] ← is_active = true, password sent via email
    ↓ (User logs in)
[First Login] ← Password change prompt (future enhancement)
    ↓ (User changes password)
[Active User] ← Normal usage state
    ↓ (Admin updates role)
[Role Changed] ← Permissions updated immediately
    ↓ (Admin updates contact)
[Contact Updated] ← Information refreshed
```

**Note**: This feature does NOT implement user deactivation/deletion. The `is_active` field exists in the model but is not modified by this feature (out of scope per spec boundaries).

---

## Query Patterns

### List Users for Client Admin

**Query**:
```javascript
User.findAndCountAll({
  where: {
    client_id: req.clientId,  // From auth token
    is_active: true            // Only show active users
  },
  attributes: ['id', 'full_name', 'email', 'role', 'phone_number', 'createdAt'],
  order: [['full_name', 'ASC']],
  limit: limit,                // From query param (default 50)
  offset: (page - 1) * limit   // From query param (default page 1)
});
```

**Returns**: `{ count: 123, rows: [...] }`

---

### Create New User

**Query**:
```javascript
const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

User.create({
  full_name: req.body.full_name,
  email: req.body.email.toLowerCase(),
  username: req.body.email.toLowerCase(), // Backward compatibility
  password: hashedPassword,
  role: req.body.role,           // 'client' or 'client_admin'
  phone_number: req.body.phone_number || null,
  client_id: req.clientId,       // From auth token
  organization: clientName,      // From Client model lookup
  is_active: true
});
```

**Validation**: Sequelize will enforce unique constraint on (email, client_id) compound index.

---

### Update User Role

**Query**:
```javascript
User.update(
  { role: req.body.role },
  {
    where: {
      id: req.params.userId,
      client_id: req.clientId  // Enforce multi-tenant isolation
    }
  }
);
```

**Returns**: `[affectedRows]` (will be 0 if user not found or not in admin's organization)

---

### Update User Contact Details

**Query**:
```javascript
User.update(
  {
    full_name: req.body.full_name,
    email: req.body.email?.toLowerCase(),
    phone_number: req.body.phone_number || null
  },
  {
    where: {
      id: req.params.userId,
      client_id: req.clientId  // Enforce multi-tenant isolation
    }
  }
);
```

**Note**: If email is changed, Sequelize will validate against compound unique index.

---

### Check Email Uniqueness (Pre-validation)

**Query** (before creation):
```javascript
const existingUser = await User.findOne({
  where: {
    email: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('email')),
      req.body.email.toLowerCase()
    ),
    client_id: req.clientId
  }
});

if (existingUser) {
  throw new Error('A user with this email already exists in your organization');
}
```

**Purpose**: Provide user-friendly error message before hitting database constraint.

---

## Data Flow Diagrams

### User Creation Flow

```
[Client Admin]
    ↓ POST /api/users
[User Controller]
    ↓ Validate input (email format, role constraints)
    ↓ Check email uniqueness within client
    ↓ Generate secure password (crypto.randomBytes)
    ↓ Hash password (bcrypt)
[User Model]
    ↓ Create user record (Sequelize)
    ↓ Enforce compound unique index (LOWER(email), client_id)
[Database]
    ↓ User created successfully
[Email Service]
    ↓ Send credentials email (async, non-blocking)
    ↓ Log success/failure (don't throw on email error)
[Response to Admin]
    ↓ Return user object (without password)
    ↓ { id, full_name, email, role, phone_number, createdAt }
```

---

### User List Retrieval Flow

```
[Client Admin]
    ↓ GET /api/users?page=1&limit=50
[User Controller]
    ↓ Extract pagination params
    ↓ Apply client_id filter (from JWT token)
[User Model]
    ↓ Query with WHERE client_id = X
    ↓ Apply pagination (LIMIT/OFFSET)
    ↓ Order by full_name ASC
[Database]
    ↓ Return count + rows
[Response to Admin]
    ↓ { users: [...], total: 123, page: 1, totalPages: 3 }
```

---

### User Update Flow (Role or Contact)

```
[Client Admin]
    ↓ PATCH /api/users/:userId
[User Controller]
    ↓ Validate input (role constraints, email uniqueness)
    ↓ Check user belongs to admin's client
    ↓ Prevent self-role-change (if updating role)
[User Model]
    ↓ Update user record (Sequelize)
    ↓ WHERE id = X AND client_id = Y
[Database]
    ↓ User updated (or 0 rows if not found/wrong client)
[Response to Admin]
    ↓ Return updated user object
    ↓ { id, full_name, email, role, phone_number, updatedAt }
```

---

## Performance Considerations

### Indexing Strategy

**Existing Indexes** (already in place):
- PRIMARY KEY on users.id
- UNIQUE INDEX on users.username
- INDEX on users.email (for login queries)
- INDEX on users.client_id (for multi-tenant filtering)

**New Index Required**:
- COMPOUND UNIQUE INDEX on (LOWER(email), client_id) - enforces email uniqueness within organization

**Query Performance**:
- User list query: O(log n) lookup via client_id index, then LIMIT/OFFSET scan
- Email uniqueness check: O(log n) lookup via compound index
- User updates: O(log n) lookup via primary key + client_id index

**Expected Performance**:
- List 50 users from 500 total: <50ms database query time
- Create user: <100ms (includes bcrypt hashing)
- Update user: <50ms
- Total API response time: <200ms (well within <500ms requirement)

---

### Pagination Impact

**Without Pagination** (loading all 500 users):
- Data transfer: ~250KB JSON payload
- Frontend rendering: 500+ DOM elements
- Memory: Higher browser memory usage

**With Pagination** (50 users per page):
- Data transfer: ~25KB JSON payload (90% reduction)
- Frontend rendering: 50 DOM elements (manageable)
- Memory: Lower browser memory footprint
- User can still access all data via page navigation

---

## Security Considerations

### Multi-Tenant Isolation

**Enforcement Layers**:
1. **Middleware Layer**: clientScoping.js adds req.clientId from JWT token
2. **Controller Layer**: All queries include `WHERE client_id = req.clientId`
3. **Database Layer**: Foreign key constraint ensures client_id references valid client

**Attack Prevention**:
- User cannot access/modify users from other organizations (filtered by client_id)
- User cannot create users without client_id (auto-assigned from token)
- User cannot change their own client_id (field not exposed in update API)

---

### Role-Based Access Control

**Enforcement**:
- Middleware: `isClientAdmin()` checks `req.userRole === 'client_admin'`
- Controller: Validates role assignments are limited to 'client' or 'client_admin'
- Database: role enum constraint prevents invalid role values

**Privilege Escalation Prevention**:
- Client admins cannot create 'staff' or 'admin' roles (rejected at API layer)
- Client admins cannot change their own role (validation in controller)
- Role changes take effect immediately (no cached permissions)

---

### Password Security

**Generation**:
- Use Node.js crypto.randomBytes() for cryptographically secure randomness
- 12 characters: uppercase + lowercase + numbers + special characters
- Minimum 2 special characters for complexity

**Storage**:
- Hash with bcrypt (work factor 10, existing standard)
- Never store or log plaintext passwords
- Temporary password only sent via email once

**Transmission**:
- Email sent via TLS-encrypted SMTP connection
- Email delivery logged without including password
- Frontend never displays generated password (only backend knows it)

---

## Data Migration Requirements

**Migration Status**: One migration required

**Migration File**: `/backend/migrations/YYYYMMDDHHMMSS-add-unique-email-client-index.js`

**Risk Assessment**: LOW
- Non-destructive change (adding index only)
- Partial index (WHERE client_id IS NOT NULL) prevents conflicts with legacy users
- Can be rolled back safely if issues arise

**Rollback Plan**:
- Run down migration: `DROP INDEX user_email_client_idx`
- Feature will still function (API-level validation remains)
- Performance: Slightly slower email uniqueness checks without index

**Testing**:
- Test migration on development database first
- Verify index created: `\d users` in psql
- Test user creation with duplicate emails (should fail)
- Test user creation across different clients (should succeed)

---

## Summary

- **No new tables required** - existing User and Client models support all functionality
- **One database migration** - compound unique index on (email, client_id)
- **Reuse existing relationships** - User belongsTo Client via client_id FK
- **Follow existing patterns** - Sequelize ORM, bcrypt hashing, JWT auth, client scoping
- **Performance optimized** - Indexed queries, pagination support, sub-200ms response times
- **Security enforced** - Multi-tenant isolation, RBAC, password security, input validation

Ready to proceed to API contract generation (Phase 1 continuation).
