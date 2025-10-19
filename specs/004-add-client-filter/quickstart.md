# Quickstart Guide: Admin Client Filter Implementation

**Feature**: 004-add-client-filter
**Date**: 2025-10-19
**Audience**: Developers implementing this feature

## Overview

This quickstart provides step-by-step instructions for implementing the admin client filter feature. Follow the phases in order to deliver the P1 MVP functionality.

## Prerequisites

Before starting implementation:

- [ ] Read the feature specification: [spec.md](./spec.md)
- [ ] Review the implementation plan: [plan.md](./plan.md)
- [ ] Understand existing codebase structure (frontend/backend separation)
- [ ] Verify development environment is set up:
  - Node.js 18.x installed
  - PostgreSQL database running
  - Backend running on http://localhost:5002
  - Frontend running on http://localhost:5173
- [ ] Have access to an admin user account for testing

## Implementation Phases

### Phase 1: Backend - Client List Endpoint (P1)

**Goal**: Create API endpoint to fetch active clients for dropdown

**Files to Create**:
1. `backend/controllers/client.controller.js`
2. `backend/routes/client.routes.js`

**Files to Modify**:
3. `backend/server.js` (add client routes)

**Steps**:

#### Step 1.1: Create Client Controller

**File**: `backend/controllers/client.controller.js`

```javascript
const { Client } = require('../models');

/**
 * Get all active clients, sorted alphabetically
 * Admin-only endpoint
 */
const getClients = async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Admin access required'
      });
    }

    // Fetch active clients
    const clients = await Client.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'code', 'status'],
      order: [['name', 'ASC']]
    });

    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      error: 'Failed to fetch clients'
    });
  }
};

module.exports = {
  getClients
};
```

#### Step 1.2: Create Client Routes

**File**: `backend/routes/client.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { getClients } = require('../controllers/client.controller');
const { verifyToken } = require('../middleware/auth');

// GET /api/clients - Get all active clients (admin only)
router.get('/', verifyToken, getClients);

module.exports = router;
```

#### Step 1.3: Register Routes in Server

**File**: `backend/server.js` (add this line with other route imports)

```javascript
const clientRoutes = require('./routes/client.routes');

// ... other route registrations ...
app.use('/api/clients', clientRoutes);
```

#### Step 1.4: Test Backend Endpoint

**Manual Testing**:

```bash
# Get JWT token by logging in as admin
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Use the token to fetch clients
curl http://localhost:5002/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
# {
#   "clients": [
#     {"id": 1, "name": "Client A", "code": "CA", "status": "active"},
#     {"id": 2, "name": "Client B", "code": "CB", "status": "active"}
#   ]
# }
```

**Verify**:
- [ ] Endpoint returns 200 OK with client list for admin user
- [ ] Clients are sorted alphabetically by name
- [ ] Only active clients are returned
- [ ] Non-admin users receive 403 Forbidden

---

### Phase 2: Frontend - Client Service (P1)

**Goal**: Create frontend service to call client API

**Files to Create**:
1. `frontend/src/services/clientService.js`

**Steps**:

#### Step 2.1: Create Client Service

**File**: `frontend/src/services/clientService.js`

```javascript
import api from './api';

/**
 * Fetch all active clients
 * Requires admin authentication
 */
export const getClients = async () => {
  try {
    const response = await api.get('/clients');
    return response.data.clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export default {
  getClients
};
```

#### Step 2.2: Test Service (Browser Console)

Open browser developer tools and test:

```javascript
import clientService from './services/clientService';

clientService.getClients()
  .then(clients => console.log('Clients:', clients))
  .catch(error => console.error('Error:', error));
```

**Verify**:
- [ ] Service successfully fetches clients
- [ ] Error handling works correctly

---

### Phase 3: Frontend - Client Filter Component (P1)

**Goal**: Create reusable ClientFilter dropdown component

**Files to Create**:
1. `frontend/src/components/workOrders/ClientFilter.jsx`

**Steps**:

#### Step 3.1: Create ClientFilter Component

**File**: `frontend/src/components/workOrders/ClientFilter.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import clientService from '../../services/clientService';

const ClientFilter = ({ selectedClientId, onClientChange, userRole }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only show filter for admin users
  if (userRole !== 'admin') {
    return null;
  }

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const clientList = await clientService.getClients();
        setClients(clientList);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    // Convert "all" to null, otherwise parse as integer
    const clientId = value === 'all' ? null : parseInt(value);
    onClientChange(clientId);
  };

  if (loading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client
        </label>
        <div className="text-gray-500 text-sm">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client
        </label>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label
        htmlFor="client-filter"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Client
      </label>
      <select
        id="client-filter"
        value={selectedClientId === null ? 'all' : selectedClientId}
        onChange={handleChange}
        className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
        style={{ minHeight: '44px' }} // Mobile touch target
      >
        <option value="all">All Clients</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientFilter;
```

**Verify**:
- [ ] Component renders correctly
- [ ] Dropdown shows "All Clients" as first option
- [ ] Clients are listed alphabetically
- [ ] Component respects minimum touch target height (44px)
- [ ] Component is responsive (full width on mobile, fixed width on desktop)

---

### Phase 4: Frontend - Integrate Client Filter into WorkOrdersPage (P1)

**Goal**: Add client filter to work orders page with proper state management

**Files to Modify**:
1. `frontend/src/pages/WorkOrdersPage.jsx`
2. `frontend/src/services/workOrderService.js`
3. `frontend/src/components/workOrders/AuthorizedPersonFilter.jsx`

**Steps**:

#### Step 4.1: Update WorkOrdersPage

**File**: `frontend/src/pages/WorkOrdersPage.jsx`

Add client filter state and integrate component:

```javascript
import ClientFilter from '../components/workOrders/ClientFilter';

// Inside WorkOrdersPage component:
const [clientId, setClientId] = useState(null); // null = "All Clients"

// Modify fetchWorkOrders to include clientId
const fetchWorkOrders = async () => {
  try {
    setLoading(true);
    const filters = {
      status: selectedStatus,
      search: searchTerm,
      authorized_person: selectedAuthorizedPerson,
      page: currentPage,
      limit: 10
    };

    // Pass clientId to service
    const response = await workOrderService.getWorkOrders(filters, clientId);
    setWorkOrders(response.workOrders);
    setTotalPages(response.pagination.totalPages);
  } catch (error) {
    console.error('Error fetching work orders:', error);
  } finally {
    setLoading(false);
  }
};

// Handle client filter change
const handleClientChange = (newClientId) => {
  setClientId(newClientId);
  setCurrentPage(1); // Reset to page 1

  // If authorized person doesn't exist in new client, clear it
  // (Will be implemented in Step 4.3)
};

// Re-fetch when clientId changes
useEffect(() => {
  fetchWorkOrders();
}, [clientId, selectedStatus, selectedAuthorizedPerson, currentPage]);

// Add ClientFilter component to JSX (before other filters)
<ClientFilter
  selectedClientId={clientId}
  onClientChange={handleClientChange}
  userRole={user.role}
/>
```

#### Step 4.2: Verify workOrderService Uses clientId

**File**: `frontend/src/services/workOrderService.js`

Ensure the service properly uses clientId parameter:

```javascript
export const getWorkOrders = async (filters = {}, clientId = null) => {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.authorized_person) params.append('authorized_person', filters.authorized_person);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    // Add client context header if clientId provided
    const headers = {};
    if (clientId !== null) {
      headers['X-Client-Context'] = clientId;
    }

    const response = await api.get(`/work-orders?${params.toString()}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching work orders:', error);
    throw error;
  }
};
```

#### Step 4.3: Update AuthorizedPersonFilter

**File**: `frontend/src/components/workOrders/AuthorizedPersonFilter.jsx`

Modify to accept clientId and re-fetch when it changes:

```javascript
const AuthorizedPersonFilter = ({
  selectedAuthorizedPerson,
  onAuthorizedPersonChange,
  clientId // Add this prop
}) => {
  const [authorizedPersons, setAuthorizedPersons] = useState([]);

  useEffect(() => {
    const fetchAuthorizedPersons = async () => {
      try {
        setLoading(true);
        // Pass clientId to service (if provided)
        const persons = await workOrderService.getAuthorizedPersons(clientId);
        setAuthorizedPersons(persons);

        // If current selection not in new list, clear it
        if (selectedAuthorizedPerson && !persons.includes(selectedAuthorizedPerson)) {
          onAuthorizedPersonChange('');
        }
      } catch (error) {
        console.error('Error fetching authorized persons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorizedPersons();
  }, [clientId]); // Re-fetch when clientId changes

  // ... rest of component
};
```

Update `workOrderService.getAuthorizedPersons()` to accept clientId:

```javascript
export const getAuthorizedPersons = async (clientId = null) => {
  try {
    const headers = {};
    if (clientId !== null) {
      headers['X-Client-Context'] = clientId;
    }

    const response = await api.get('/work-orders/authorized-persons', { headers });
    return response.data.authorizedPersons || [];
  } catch (error) {
    console.error('Error fetching authorized persons:', error);
    throw error;
  }
};
```

**Verify**:
- [ ] Client filter appears on work orders page for admin users
- [ ] Selecting a client filters work orders correctly
- [ ] Pagination resets to page 1 when client changes
- [ ] Authorized person filter updates when client changes
- [ ] "All Clients" option works correctly (shows all work orders)

---

### Phase 5: Frontend - Dashboard Integration (P1)

**Goal**: Add client filter to dashboard page

**Files to Modify**:
1. `frontend/src/pages/DashboardPage.jsx`

**Steps**:

#### Step 5.1: Update DashboardPage

Add client filter and pass clientId to summary fetch:

```javascript
import ClientFilter from '../components/workOrders/ClientFilter';

// Inside DashboardPage component:
const [clientId, setClientId] = useState(null);

const fetchDashboardSummary = async () => {
  try {
    const summary = await dashboardService.getDashboardSummary(clientId);
    setSummary(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
  }
};

useEffect(() => {
  fetchDashboardSummary();
}, [clientId]);

const handleClientChange = (newClientId) => {
  setClientId(newClientId);
};

// Add ClientFilter component to JSX
<ClientFilter
  selectedClientId={clientId}
  onClientChange={handleClientChange}
  userRole={user.role}
/>
```

Update `dashboardService.getDashboardSummary()` to use clientId:

```javascript
export const getDashboardSummary = async (clientId = null) => {
  try {
    const headers = {};
    if (clientId !== null) {
      headers['X-Client-Context'] = clientId;
    }

    const response = await api.get('/work-orders/summary', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};
```

**Verify**:
- [ ] Client filter appears on dashboard
- [ ] Summary counts update when client changes
- [ ] "All Clients" shows counts across all clients

---

### Phase 6: Empty State Handling (P1)

**Goal**: Display appropriate message when filtered client has no work orders

**Files to Modify**:
1. `frontend/src/pages/WorkOrdersPage.jsx`

**Steps**:

Add empty state component:

```javascript
// Inside WorkOrdersPage component, in JSX:

{workOrders.length === 0 && !loading && (
  <div className="text-center py-8">
    <p className="text-gray-500">
      {clientId !== null
        ? `No work orders found for ${getClientName(clientId)}`
        : 'No work orders found'
      }
    </p>
  </div>
)}

// Helper function to get client name:
const getClientName = (id) => {
  // You'll need to store clients list in state from ClientFilter
  // Or pass it up via callback
  const client = clients.find(c => c.id === id);
  return client ? client.name : 'selected client';
};
```

**Verify**:
- [ ] Empty state message appears when no work orders match filter
- [ ] Message includes client name when specific client selected
- [ ] Generic message shown when "All Clients" selected and no results

---

### Phase 7: Mobile Testing (P1)

**Goal**: Verify mobile-first design on actual devices

**Test Devices**:
- [ ] iOS device (iPhone 12 or later)
- [ ] Android device (recent model)

**Test Checklist**:
- [ ] Client filter dropdown opens correctly on mobile
- [ ] Touch targets are adequately sized (44x44px minimum)
- [ ] Dropdown is easy to use with one hand
- [ ] Text is readable (not too small)
- [ ] Filter works correctly on narrow screens (320px)
- [ ] Responsive breakpoints work (375px, 390px, 414px)
- [ ] Page layout doesn't break on mobile

---

## Testing Scenarios

### Scenario 1: Admin Filters by Specific Client

**Steps**:
1. Login as admin user
2. Navigate to Work Orders page
3. Click Client filter dropdown
4. Select a specific client (e.g., "VWCT")
5. Observe work orders list

**Expected**:
- [ ] Only work orders for selected client are displayed
- [ ] Pagination shows correct total pages
- [ ] Authorized person filter updates to show only persons from that client
- [ ] Dashboard summary counts reflect selected client

### Scenario 2: Admin Switches Between Clients

**Steps**:
1. Start with client "Client A" selected
2. Select authorized person from dropdown
3. Switch to "Client B" using client filter

**Expected**:
- [ ] Work orders list refreshes for Client B
- [ ] Pagination resets to page 1
- [ ] Authorized person filter clears (if person doesn't exist in Client B)
- [ ] OR authorized person filter maintains selection (if person exists in Client B)

### Scenario 3: Admin Views All Clients

**Steps**:
1. Start with specific client selected
2. Select "All Clients" from dropdown

**Expected**:
- [ ] Work orders from all clients are displayed
- [ ] Authorized person filter shows all authorized persons
- [ ] Dashboard summary shows total counts across all clients

### Scenario 4: Client with No Work Orders

**Steps**:
1. Select a client that has no work orders

**Expected**:
- [ ] Empty state message appears: "No work orders found for [Client Name]"
- [ ] Client filter remains functional
- [ ] No errors in console

### Scenario 5: Non-Admin User

**Steps**:
1. Login as non-admin user (client, staff, or client_admin)
2. Navigate to Work Orders page

**Expected**:
- [ ] Client filter does NOT appear
- [ ] Work orders are automatically scoped to user's client
- [ ] No errors or unauthorized access attempts

---

## Performance Validation

**Metrics to Check**:

- [ ] Client list loads in <200ms
- [ ] Filtered work orders load in <500ms
- [ ] Total filter application time <2 seconds
- [ ] No visible lag when switching clients
- [ ] Dashboard summary updates smoothly

---

## Integration Testing

**n8n Webhook Verification**:

- [ ] Create work order via n8n webhook
- [ ] Verify work order appears in "All Clients" view
- [ ] Verify work order appears when filtering by its client
- [ ] Confirm webhook endpoint not affected by changes

---

## Rollback Plan

If issues arise during implementation:

1. **Backend Issues**: Comment out client route registration in `server.js`
2. **Frontend Issues**: Remove `ClientFilter` component imports and hide UI
3. **Database Issues**: No migrations required, so no rollback needed

---

## Post-Implementation

After completing P1 MVP:

- [ ] Commit changes with descriptive message
- [ ] Update [CLAUDE.md](/Users/hewage/Documents/Projects/visionwest-work-orders/CLAUDE.md) if new patterns introduced
- [ ] Document any deviations from plan
- [ ] Create tasks for P2/P3 enhancements (if applicable)

**P2/P3 Enhancements (Future)**:
- Offline caching of client list
- Client work order counts in dropdown
- Session persistence of selected client across page reloads
- Advanced filter combinations

---

## Troubleshooting

### Issue: Client filter not appearing for admin user

**Check**:
- Verify user role is exactly 'admin' (case-sensitive)
- Check browser console for JavaScript errors
- Verify ClientFilter component is imported correctly

### Issue: Work orders not filtering by client

**Check**:
- Verify `X-Client-Context` header is being sent
- Check backend logs for clientId value
- Verify clientScoping middleware is working

### Issue: Authorized person filter not clearing

**Check**:
- Verify AuthorizedPersonFilter receives clientId prop
- Check useEffect dependencies include clientId
- Verify logic for clearing selection when person not in new list

---

## Support & Resources

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contract**: [contracts/clients-api.yaml](./contracts/clients-api.yaml)
- **Constitution**: [.specify/memory/constitution.md](/.specify/memory/constitution.md)

---

**Implementation Time Estimate**: 4-6 hours for P1 MVP

**Last Updated**: 2025-10-19
