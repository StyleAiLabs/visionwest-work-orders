# Testing Guide: Client Management API (Phase 4 - T030-T049)

This guide covers testing the newly implemented client management features.

## Prerequisites

1. **Backend server running on port 5002**
   ```bash
   cd backend
   npm run dev
   ```

2. **Admin user account** - You'll need admin credentials to test

## Backend API Testing (T030-T039)

### Option 1: Automated Test Script

Run the comprehensive test script:

```bash
cd backend
node scripts/test-client-api.js
```

**Before running**, update the admin credentials in `test-client-api.js`:
```javascript
email: 'your-admin@example.com',
password: 'your-password'
```

This will test:
- ✅ List all clients (GET /api/clients)
- ✅ Get client by ID (GET /api/clients/:id)
- ✅ Get client statistics (GET /api/clients/:id/stats)
- ✅ Create new client (POST /api/clients)
- ✅ Update client (PUT /api/clients/:id)
- ✅ Delete/archive client (DELETE /api/clients/:id)
- ✅ Search and filter functionality

### Option 2: Manual API Testing with cURL

#### 1. Login as Admin
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Save the returned token for subsequent requests.

#### 2. List All Clients
```bash
curl -X GET "http://localhost:5002/api/clients" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

With search and filters:
```bash
curl -X GET "http://localhost:5002/api/clients?status=active&search=vision&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Get Client by ID
```bash
curl -X GET "http://localhost:5002/api/clients/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Get Client Statistics
```bash
curl -X GET "http://localhost:5002/api/clients/1/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Create New Client
```bash
curl -X POST http://localhost:5002/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Property Management",
    "code": "ABC_PROP",
    "primary_contact_name": "John Doe",
    "primary_contact_email": "john@abcprop.com",
    "primary_contact_phone": "+64 21 123 4567",
    "status": "active"
  }'
```

#### 6. Update Client
```bash
curl -X PUT http://localhost:5002/api/clients/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Property Management Ltd",
    "status": "inactive"
  }'
```

#### 7. Delete Client
```bash
curl -X DELETE "http://localhost:5002/api/clients/2?confirm=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Responses

**Successful List Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Visionwest",
      "code": "VISIONWEST",
      "status": "active",
      "user_count": 10,
      "work_order_count": 150
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "code",
      "message": "Code must be unique"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "No token provided!"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Require Admin Role!"
}
```

## Frontend Testing (T040-T049)

**Status**: Components created (T040-T044), integration pending (T045-T049)

### Current Status
✅ **Completed:**
- T040: clientService.js - API service layer
- T041: ClientContext.jsx - Context management
- T042: ClientList.jsx - Client list component
- T043: ClientForm.jsx - Create/edit form
- T044: ClientSwitcher.jsx - Context switcher

⏳ **Remaining:**
- T045: AdminPanel page
- T046: Update workOrderService with X-Client-Context header
- T047: Add /admin route to App.jsx
- T048: Add context banner
- T049: End-to-end testing

### Once Frontend Integration is Complete

1. **Login as admin user**
   - Navigate to http://localhost:5173/login
   - Use admin credentials

2. **Access Admin Panel**
   - Navigate to http://localhost:5173/admin
   - Should see client list

3. **Test Client Management**
   - Create new client
   - Edit existing client
   - View client statistics
   - Search and filter clients

4. **Test Context Switching**
   - Use ClientSwitcher dropdown
   - Switch to different client
   - Verify work orders are filtered
   - Check context banner appears

5. **Test Permissions**
   - Logout and login as non-admin
   - Try to access /admin (should be blocked)
   - Verify client switcher not visible

## Security Testing

### Authorization Tests

1. **Non-admin user cannot access client endpoints:**
```bash
# Login as regular user
TOKEN=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Try to access clients (should fail with 403)
curl -X GET http://localhost:5002/api/clients \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `403 Forbidden`

2. **Unauthenticated request fails:**
```bash
curl -X GET http://localhost:5002/api/clients
```

Expected: `401 Unauthorized`

3. **Cannot modify Visionwest client code:**
```bash
curl -X PUT http://localhost:5002/api/clients/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "NEWCODE"}'
```

Expected: `400 Bad Request - Code cannot be modified`

4. **Cannot delete Visionwest client:**
```bash
curl -X DELETE "http://localhost:5002/api/clients/1?confirm=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected: `403 Forbidden - Cannot delete the Visionwest client`

## Integration Testing

### Admin Context Switching Flow

1. Login as admin
2. View work orders (should see own client's orders)
3. Switch to different client using ClientSwitcher
4. View work orders (should see selected client's orders)
5. Clear context
6. View work orders (should return to own client's orders)

### X-Client-Context Header

When admin switches context, API calls should include:
```
X-Client-Context: 2
```

Verify in browser DevTools > Network tab > Request Headers

## Troubleshooting

### "No token provided" Error
- Ensure you're logged in
- Check localStorage has 'token' item
- Token should be in format: `Bearer <jwt_token>`

### "Require Admin Role" Error
- User must have `role: 'admin'` in database
- Check: `SELECT role FROM users WHERE email = 'your@email.com';`

### Client Switcher Not Showing
- Only visible for admin users
- Check `user.role === 'admin'` in AuthContext

### Work Orders Not Filtering by Client
- T046 not yet implemented (workOrderService X-Client-Context header)
- Complete T046-T049 for full functionality

## Database Verification

Check clients table:
```sql
SELECT id, name, code, status,
       (SELECT COUNT(*) FROM users WHERE client_id = clients.id) as user_count,
       (SELECT COUNT(*) FROM work_orders WHERE client_id = clients.id) as wo_count
FROM clients;
```

Check user roles:
```sql
SELECT id, email, role, client_id FROM users WHERE role = 'admin';
```

## Next Steps

1. ✅ Backend API complete (T030-T039)
2. ✅ Frontend components created (T040-T044)
3. ⏳ Integrate components (T045-T049)
4. ⏳ End-to-end testing
5. ⏳ Production deployment

## Support

For issues or questions:
1. Check server logs: `backend/` terminal output
2. Check browser console: DevTools > Console
3. Review API responses: DevTools > Network tab
4. Check database state with SQL queries
