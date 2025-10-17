# Quickstart Guide: Multi-Client Work Order Management

**Feature**: Multi-Client Work Order Management
**Version**: 1.0.0
**Date**: 2025-10-17

## Overview

This guide provides integration scenarios, testing workflows, and quick reference documentation for developers implementing and testing the multi-client work order management feature.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Database Migration Quickstart](#database-migration-quickstart)
3. [Testing Scenarios](#testing-scenarios)
4. [API Integration Examples](#api-integration-examples)
5. [Troubleshooting Guide](#troubleshooting-guide)

---

## Development Environment Setup

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- Backend and frontend running locally

### 1. Database Setup

Create test clients in your local database:

```sql
-- Insert test clients
INSERT INTO clients (name, code, status, primary_contact_email) VALUES
('Visionwest', 'VISIONWEST', 'active', 'admin@visionwest.com'),
('ABC Property Management', 'ABC_PROP', 'active', 'contact@abcprop.com'),
('XYZ Facilities', 'XYZ_FAC', 'active', 'info@xyzfacilities.com');

-- Verify
SELECT id, name, code, status FROM clients;
```

### 2. Create Test Users

```sql
-- Visionwest users
INSERT INTO users (email, password_hash, name, role, client_id) VALUES
('admin@visionwest.com', '$2b$10$...', 'Admin User', 'admin', 1),
('staff@visionwest.com', '$2b$10$...', 'Staff User', 'staff', 1);

-- ABC Property users
INSERT INTO users (email, password_hash, name, role, client_id) VALUES
('admin@abcprop.com', '$2b$10$...', 'ABC Admin', 'client_admin', 2),
('user@abcprop.com', '$2b$10$...', 'ABC User', 'client', 2);

-- XYZ Facilities users
INSERT INTO users (email, password_hash, name, role, client_id) VALUES
('admin@xyzfac.com', '$2b$10$...', 'XYZ Admin', 'client_admin', 3),
('user@xyzfac.com', '$2b$10$...', 'XYZ User', 'client', 3);
```

### 3. Create Test Work Orders

```sql
-- Visionwest work orders
INSERT INTO work_orders (job_no, address, trade, status, client_id, date) VALUES
('VW-001', '123 Main St', 'Plumbing', 'pending', 1, NOW()),
('VW-002', '456 Oak Ave', 'Electrical', 'in_progress', 1, NOW());

-- ABC Property work orders
INSERT INTO work_orders (job_no, address, trade, status, client_id, date) VALUES
('ABC-001', '789 Pine Rd', 'HVAC', 'pending', 2, NOW()),
('ABC-002', '321 Elm St', 'Carpentry', 'completed', 2, NOW());

-- XYZ Facilities work orders
INSERT INTO work_orders (job_no, address, trade, status, client_id, date) VALUES
('XYZ-001', '555 Maple Dr', 'Painting', 'pending', 3, NOW()),
('XYZ-002', '888 Cedar Ln', 'Plumbing', 'in_progress', 3, NOW());
```

---

## Database Migration Quickstart

### Local Development Migration

```bash
# Navigate to backend directory
cd backend

# Run Phase 1: Schema Extension
npx sequelize-cli db:migrate --name YYYYMMDDHHMMSS-add-multi-client-support-phase1.js

# Run Phase 2: Data Backfill (script)
node scripts/backfill-visionwest-client.js

# Verify Phase 2
psql -d visionwest_db -c "SELECT COUNT(*) FROM users WHERE client_id IS NULL;"
psql -d visionwest_db -c "SELECT COUNT(*) FROM work_orders WHERE client_id IS NULL;"

# Run Phase 3: Enforce Constraints
npx sequelize-cli db:migrate --name YYYYMMDDHHMMSS-add-multi-client-support-phase3.js

# Verify Phase 3
psql -d visionwest_db -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'client_id';"
```

### Rollback (if needed)

```bash
# Rollback Phase 3
npx sequelize-cli db:migrate:undo

# Rollback Phase 2 (manual script or re-run with NULL)
node scripts/rollback-backfill.js

# Rollback Phase 1
npx sequelize-cli db:migrate:undo
```

---

## Testing Scenarios

### Scenario 1: Client Data Isolation

**Objective**: Verify users can only access their own client's work orders.

**Test Steps**:

1. **Login as ABC Property user**
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@abcprop.com", "password": "password123"}'
```

Expected Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "email": "user@abcprop.com",
    "role": "client",
    "client_id": 2,
    "client": {
      "name": "ABC Property Management",
      "code": "ABC_PROP"
    }
  }
}
```

2. **Fetch work orders (should only see ABC Property work orders)**
```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <ABC_USER_TOKEN>"
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "job_no": "ABC-001",
      "address": "789 Pine Rd",
      "client_id": 2
    },
    {
      "id": 4,
      "job_no": "ABC-002",
      "address": "321 Elm St",
      "client_id": 2
    }
  ]
}
```

**Should NOT see**: VW-001, VW-002, XYZ-001, XYZ-002

3. **Attempt to access Visionwest work order directly**
```bash
curl -X GET http://localhost:5002/api/work-orders/1 \
  -H "Authorization: Bearer <ABC_USER_TOKEN>"
```

Expected Response:
```json
{
  "success": false,
  "message": "Work order not found"
}
```

**Result**: ✅ Client data isolation working correctly

---

### Scenario 2: Admin Client Context Switching

**Objective**: Verify admin users can switch client context to view different clients' data.

**Test Steps**:

1. **Login as admin user**
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@visionwest.com", "password": "admin123"}'
```

2. **Fetch work orders without context switch (see Visionwest data)**
```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected: VW-001, VW-002

3. **Fetch work orders with X-Client-Context header (see ABC Property data)**
```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "X-Client-Context: 2"
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {"job_no": "ABC-001", "client_id": 2},
    {"job_no": "ABC-002", "client_id": 2}
  ],
  "meta": {
    "client_id": 2,
    "client_name": "ABC Property Management",
    "admin_context_switched": true
  }
}
```

4. **Switch to XYZ Facilities (client_id: 3)**
```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "X-Client-Context: 3"
```

Expected: XYZ-001, XYZ-002

**Result**: ✅ Admin context switching working correctly

---

### Scenario 3: Client Management CRUD

**Objective**: Test admin endpoints for creating, reading, updating, and deleting clients.

**Test Steps**:

1. **List all clients**
```bash
curl -X GET http://localhost:5002/api/clients \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected: List of all 3 clients (Visionwest, ABC Property, XYZ Facilities)

2. **Create new client**
```bash
curl -X POST http://localhost:5002/api/clients \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client Co",
    "code": "TEST_CLIENT",
    "primary_contact_email": "contact@testclient.com",
    "status": "active"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 4,
    "name": "Test Client Co",
    "code": "TEST_CLIENT",
    "status": "active"
  }
}
```

3. **Update client**
```bash
curl -X PUT http://localhost:5002/api/clients/4 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client Corporation",
    "primary_contact_email": "info@testclient.com"
  }'
```

Expected: Client updated successfully

4. **Get client by ID**
```bash
curl -X GET http://localhost:5002/api/clients/4 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected: Client details with updated name

5. **Delete client (archive)**
```bash
curl -X DELETE http://localhost:5002/api/clients/4?confirm=true \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected Response:
```json
{
  "success": true,
  "message": "Client archived successfully"
}
```

**Result**: ✅ Client management CRUD working correctly

---

### Scenario 4: n8n Webhook Integration

**Objective**: Verify n8n webhook continues to work and creates work orders for Visionwest client.

**Test Steps**:

1. **Send webhook request (simulating n8n)**
```bash
curl -X POST http://localhost:5002/api/webhook/work-orders \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <WEBHOOK_SECRET>" \
  -d '{
    "job_no": "N8N-TEST-001",
    "address": "999 Test St",
    "trade": "Plumbing",
    "status": "pending",
    "date": "2025-10-17"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Work order created successfully",
  "data": {
    "id": 7,
    "job_no": "N8N-TEST-001",
    "client_id": 1,
    "address": "999 Test St"
  }
}
```

2. **Verify work order assigned to Visionwest**
```bash
psql -d visionwest_db -c "SELECT id, job_no, client_id FROM work_orders WHERE job_no = 'N8N-TEST-001';"
```

Expected: `client_id = 1` (Visionwest)

3. **Login as Visionwest user and verify visibility**
```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <VISIONWEST_USER_TOKEN>"
```

Expected: N8N-TEST-001 appears in list

4. **Login as ABC Property user and verify NOT visible**
```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <ABC_USER_TOKEN>"
```

Expected: N8N-TEST-001 does NOT appear

**Result**: ✅ n8n webhook integration working correctly

---

### Scenario 5: JWT Token Validation

**Objective**: Verify JWT tokens include `clientId` and are validated correctly.

**Test Steps**:

1. **Decode JWT token** (using jwt.io or jwt-cli)
```bash
# Install jwt-cli if not already installed
# npm install -g jwt-cli

jwt decode <YOUR_JWT_TOKEN>
```

Expected Payload:
```json
{
  "userId": 123,
  "clientId": 1,
  "role": "staff",
  "iat": 1697558400,
  "exp": 1697644800
}
```

2. **Attempt API call with old token (no clientId)**

Create a test token without clientId:
```javascript
const jwt = require('jsonwebtoken');
const oldToken = jwt.sign(
  { userId: 123, role: 'staff' },  // Missing clientId
  process.env.JWT_SECRET
);
```

```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <OLD_TOKEN_WITHOUT_CLIENT_ID>"
```

Expected Response:
```json
{
  "success": false,
  "message": "Authentication token is outdated. Please log in again.",
  "code": "TOKEN_MISSING_CLIENT_ID"
}
```

3. **Attempt API call with tampered token**

Create a token with modified clientId (invalid signature):
```bash
# Manually modify token payload to change clientId
# Token signature will become invalid
```

```bash
curl -X GET http://localhost:5002/api/work-orders \
  -H "Authorization: Bearer <TAMPERED_TOKEN>"
```

Expected Response:
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Result**: ✅ JWT token validation working correctly

---

## API Integration Examples

### Example 1: Frontend Login Flow

```javascript
// frontend/src/services/authService.js

async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    // Store token
    localStorage.setItem('token', data.token);

    // Store client context
    localStorage.setItem('clientId', data.user.client_id);
    localStorage.setItem('clientName', data.user.client.name);
    localStorage.setItem('userRole', data.user.role);

    return data.user;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 2: Admin Client Switcher Component

```javascript
// frontend/src/components/admin/ClientSwitcher.jsx

import { useState, useEffect } from 'react';
import clientService from '../../services/clientService';

function ClientSwitcher({ currentClientId, onSwitch }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      const data = await clientService.getAllClients();
      setClients(data);
    }
    fetchClients();
  }, []);

  async function handleSwitch(clientId) {
    if (confirm('Switch to this client? All views will update.')) {
      setLoading(true);

      // Store selected client in localStorage
      localStorage.setItem('admin_selected_client', clientId);

      // Trigger context switch
      onSwitch(clientId);

      setLoading(false);
    }
  }

  return (
    <div className="client-switcher">
      <label>Viewing Client:</label>
      <select
        value={currentClientId}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={loading}
      >
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.code})
          </option>
        ))}
      </select>
    </div>
  );
}

export default ClientSwitcher;
```

### Example 3: Work Order Service with Client Context

```javascript
// frontend/src/services/workOrderService.js

class WorkOrderService {
  constructor() {
    this.baseURL = '/api/work-orders';
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Add client context for admin users
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      const selectedClientId = localStorage.getItem('admin_selected_client');
      if (selectedClientId) {
        headers['X-Client-Context'] = selectedClientId;
      }
    }

    return headers;
  }

  async getAll() {
    const response = await fetch(this.baseURL, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async create(workOrder) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(workOrder)
    });
    return response.json();
  }
}

export default new WorkOrderService();
```

### Example 4: Backend Client Scoping Middleware

```javascript
// backend/middleware/clientScoping.js

const { Client } = require('../models');

async function clientScopingMiddleware(req, res, next) {
  try {
    // Skip for webhook endpoints
    if (req.path.startsWith('/api/webhook/')) {
      return next();
    }

    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin context switching
    if (req.user.role === 'admin' && req.headers['x-client-context']) {
      const targetClientId = parseInt(req.headers['x-client-context']);

      // Validate target client exists
      const client = await Client.findByPk(targetClientId);
      if (!client) {
        return res.status(400).json({
          success: false,
          message: 'Invalid client context'
        });
      }

      req.clientId = targetClientId;
      req.isAdminSwitchedContext = true;

      console.log(`Admin ${req.user.userId} switched to client ${targetClientId}`);
    } else {
      // Normal user - use client from token
      req.clientId = req.user.clientId;
    }

    next();
  } catch (error) {
    console.error('Client scoping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = clientScopingMiddleware;
```

### Example 5: Backend Work Order Controller with Client Filter

```javascript
// backend/controllers/workOrder.controller.js

const { WorkOrder } = require('../models');

exports.getAllWorkOrders = async (req, res) => {
  try {
    // req.clientId automatically set by clientScoping middleware
    const workOrders = await WorkOrder.findAll({
      where: {
        client_id: req.clientId  // Automatic client filtering
      },
      order: [['date', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: workOrders,
      meta: {
        client_id: req.clientId,
        admin_context_switched: req.isAdminSwitchedContext || false
      }
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work orders'
    });
  }
};

exports.createWorkOrder = async (req, res) => {
  try {
    // Automatically assign to user's client
    const workOrderData = {
      ...req.body,
      client_id: req.clientId  // Auto-assign client
    };

    const workOrder = await WorkOrder.create(workOrderData);

    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      data: workOrder
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create work order'
    });
  }
};
```

---

## Troubleshooting Guide

### Issue: "Authentication token is outdated" Error

**Symptom**: API returns `TOKEN_MISSING_CLIENT_ID` error

**Cause**: User has old JWT token without `clientId` claim

**Solution**:
1. Clear browser localStorage
2. Log in again to get new token with `clientId`

```javascript
// Clear old token
localStorage.removeItem('token');
localStorage.removeItem('user');

// Redirect to login
window.location.href = '/login';
```

---

### Issue: Admin Cannot Switch Client Context

**Symptom**: Admin user provides `X-Client-Context` header but still sees own client's data

**Cause**: Middleware not applying header correctly

**Debugging Steps**:
1. Check middleware order in Express app
2. Verify `clientScoping` middleware runs after `authenticateToken`
3. Add console.log in middleware to trace execution

```javascript
// backend/app.js - Correct order
app.use(authenticateToken);      // First: verify JWT
app.use(clientScopingMiddleware); // Second: apply client scoping
app.use('/api/work-orders', workOrderRoutes);
```

---

### Issue: Cross-Client Data Leakage

**Symptom**: User can see work orders from other clients

**Cause**: Query missing `client_id` filter

**Solution**: Ensure ALL queries include client_id filter

```javascript
// BAD: Missing client filter
const workOrders = await WorkOrder.findAll({
  where: { status: 'pending' }
});

// GOOD: Client filter included
const workOrders = await WorkOrder.findAll({
  where: {
    client_id: req.clientId,
    status: 'pending'
  }
});
```

---

### Issue: n8n Webhook Returns 401 Unauthorized

**Symptom**: Webhook requests fail with authentication error

**Cause**: Webhook endpoint not excluded from JWT authentication

**Solution**: Exclude webhook routes from JWT middleware

```javascript
// backend/app.js
app.use((req, res, next) => {
  // Skip JWT auth for webhook endpoints
  if (req.path.startsWith('/api/webhook/')) {
    return next();
  }
  authenticateToken(req, res, next);
});
```

---

### Issue: Database Foreign Key Constraint Violation

**Symptom**: `ERROR: insert or update on table "work_orders" violates foreign key constraint`

**Cause**: Attempting to assign non-existent `client_id`

**Solution**: Verify client exists before creating work order

```javascript
const client = await Client.findByPk(req.clientId);
if (!client) {
  return res.status(400).json({
    success: false,
    message: 'Invalid client ID'
  });
}
```

---

## Quick Reference

### Environment Variables

```bash
# Backend .env
DATABASE_URL=postgresql://user:password@localhost:5432/visionwest_db
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=4h
WEBHOOK_SECRET=your-webhook-secret-here
```

### Useful SQL Queries

```sql
-- List all clients
SELECT id, name, code, status FROM clients ORDER BY id;

-- Count users per client
SELECT c.name, COUNT(u.id) as user_count
FROM clients c
LEFT JOIN users u ON c.id = u.client_id
GROUP BY c.id, c.name;

-- Count work orders per client
SELECT c.name, COUNT(wo.id) as work_order_count
FROM clients c
LEFT JOIN work_orders wo ON c.id = wo.client_id
GROUP BY c.id, c.name;

-- Find orphaned users (client_id references non-existent client)
SELECT u.id, u.email, u.client_id
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.client_id IS NOT NULL AND c.id IS NULL;

-- Find orphaned work orders
SELECT wo.id, wo.job_no, wo.client_id
FROM work_orders wo
LEFT JOIN clients c ON wo.client_id = c.id
WHERE wo.client_id IS NOT NULL AND c.id IS NULL;
```

### API Endpoint Summary

```
# Authentication
POST   /api/auth/login              # Login and get JWT token
POST   /api/auth/register           # Register new user (requires client_id)

# Client Management (admin only)
GET    /api/clients                 # List all clients
GET    /api/clients/:id             # Get client by ID
POST   /api/clients                 # Create new client
PUT    /api/clients/:id             # Update client
DELETE /api/clients/:id             # Archive client
GET    /api/clients/:id/stats       # Get client statistics

# Work Orders (client-scoped)
GET    /api/work-orders             # List work orders (filtered by client_id)
GET    /api/work-orders/:id         # Get work order by ID
POST   /api/work-orders             # Create work order (auto-assigns client_id)
PUT    /api/work-orders/:id         # Update work order
DELETE /api/work-orders/:id         # Delete work order

# Webhook (no JWT auth, assigns to Visionwest)
POST   /api/webhook/work-orders     # Create work order via n8n webhook
```

---

## Changelog

- 2025-10-17: Initial quickstart guide for multi-client work order management
