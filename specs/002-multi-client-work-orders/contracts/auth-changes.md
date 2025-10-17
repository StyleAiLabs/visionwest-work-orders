# API Contract: Authentication Changes

**Feature**: Multi-Client Work Order Management
**Version**: 1.0.0
**Date**: 2025-10-17

## Overview

This contract defines changes to the authentication system to support multi-client (multi-tenant) architecture. The primary change is extending JWT tokens to include client context, enabling automatic client scoping across all API endpoints.

## JWT Token Structure Changes

### Current JWT Payload (Single-Tenant)

```json
{
  "userId": 123,
  "role": "staff",
  "iat": 1697558400,
  "exp": 1697644800
}
```

### New JWT Payload (Multi-Tenant)

```json
{
  "userId": 123,
  "clientId": 1,
  "role": "staff",
  "iat": 1697558400,
  "exp": 1697644800
}
```

**New Field**:
| Field    | Type    | Description                                    |
|----------|---------|------------------------------------------------|
| clientId | integer | Client organization ID the user belongs to     |

## Login Endpoint Changes

### Endpoint

```
POST /api/auth/login
```

**No changes to request/response format**. The response continues to return a JWT token, but the token payload now includes `clientId`.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "staff",
    "client_id": 1,
    "client": {
      "id": 1,
      "name": "Visionwest",
      "code": "VISIONWEST"
    }
  }
}
```

**Extended Response Fields**:
- `user.client_id`: Client organization ID
- `user.client`: Client organization details (name, code)

## Registration Endpoint Changes

### Endpoint

```
POST /api/auth/register
```

### Request Body (Extended)

```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "Jane Smith",
  "role": "client",
  "client_id": 2
}
```

**New Field**:
| Field     | Type    | Required | Description                               |
|-----------|---------|----------|-------------------------------------------|
| client_id | integer | Yes      | Client organization ID for the new user   |

**Validation Rules**:
- `client_id` must reference an existing active client
- Only `admin` role users can register users for any client
- `client_admin` role users can only register users for their own client
- Regular users (`client`, `staff`) cannot register new users

### Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 124,
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "client",
    "client_id": 2,
    "client": {
      "id": 2,
      "name": "ABC Property Management",
      "code": "ABC_PROP"
    }
  }
}
```

## JWT Verification Changes

### Middleware: `authenticateToken`

**File**: `backend/middleware/auth.middleware.js`

**Current Behavior**:
- Verifies JWT signature
- Attaches `req.user = { userId, role }` to request

**New Behavior**:
- Verifies JWT signature
- Attaches `req.user = { userId, clientId, role }` to request
- Validates that `clientId` exists in database (optional security check)

**Pseudocode**:
```javascript
// Extract and verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Attach to request
req.user = {
  userId: decoded.userId,
  clientId: decoded.clientId,  // NEW
  role: decoded.role
};

// Optional: Validate client_id matches user's actual client
// Protects against token tampering/replay attacks
const user = await User.findByPk(decoded.userId);
if (user.client_id !== decoded.clientId) {
  throw new Error('Invalid client context in token');
}
```

## Client Scoping Middleware

### New Middleware: `clientScopingMiddleware`

**File**: `backend/middleware/clientScoping.js`

**Purpose**: Automatically attach client context to all API requests for data isolation.

**Behavior**:
1. Extract `clientId` from JWT token (`req.user.clientId`)
2. For `admin` role users, check for `X-Client-Context` header override
3. Attach `req.clientId` to request object
4. Skip for webhook endpoints (e.g., `/api/webhook/work-orders`)

**Pseudocode**:
```javascript
function clientScopingMiddleware(req, res, next) {
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
    req.isAdminSwitchedContext = true; // For audit logging
  } else {
    // Normal user - use client from token
    req.clientId = req.user.clientId;
  }

  next();
}
```

**Applied To**: All routes except:
- Authentication routes (`/api/auth/*`)
- Webhook routes (`/api/webhook/*`)
- Health check routes (`/api/health`)

## Header: X-Client-Context

**Purpose**: Allow `admin` role users to view/manage data for different clients.

**Usage**:
```http
GET /api/work-orders
Authorization: Bearer <admin_jwt_token>
X-Client-Context: 2
```

**Access Control**:
- Only available for users with `role: admin`
- Returns `403 Forbidden` if non-admin user provides this header
- Validates that target client ID exists
- All actions logged with both admin user ID and target client ID

**Response Indication**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "client_id": 2,
    "client_name": "ABC Property Management",
    "admin_context_switched": true
  }
}
```

## Security Considerations

### Token Expiry

**Recommendation**: Reduce token expiry from 24 hours to 4 hours

**Rationale**:
- Limits exposure window if token compromised
- Forces periodic re-authentication with fresh client context
- Balances security with user convenience

**Implementation**:
```javascript
const token = jwt.sign(
  { userId, clientId, role },
  process.env.JWT_SECRET,
  { expiresIn: '4h' }  // Changed from '24h'
);
```

### Token Tampering Prevention

**Risk**: Attacker modifies `clientId` in JWT token to access other clients' data

**Mitigation**: JWT signature validation prevents tampering
- Server signs token with secret key
- Any modification invalidates signature
- Server rejects tokens with invalid signatures

**Additional Layer**: Server-side client_id validation
```javascript
// Optional: Verify clientId matches user's actual client
const user = await User.findByPk(req.user.userId);
if (user.client_id !== req.user.clientId) {
  throw new Error('Token client mismatch - possible tampering');
}
```

### Admin Context Abuse Prevention

**Risk**: Admin user accidentally performs destructive actions in wrong client context

**Mitigations**:
1. Frontend confirmation modal when switching clients
2. Visual banner showing current client context
3. Audit logging of all admin actions with target client ID
4. Rate limiting on context switching (max 10 switches per minute)

## Backward Compatibility

### Migration Period

During database migration, users may have `client_id = null` temporarily.

**Handling**:
```javascript
// If user has no client_id yet, reject authentication
if (!user.client_id) {
  return res.status(503).json({
    success: false,
    message: 'System migration in progress. Please try again in a few minutes.'
  });
}
```

### Token Refresh Strategy

**Problem**: Existing JWT tokens do not include `clientId`

**Solution**: Force re-authentication after deployment
1. Deploy new authentication code
2. All existing tokens lack `clientId` claim
3. Middleware detects missing `clientId` and returns `401 Unauthorized`
4. Frontend redirects to login page
5. User logs in again, receives new token with `clientId`

**User Impact**: All users must log in again once after deployment (one-time inconvenience)

## Testing Requirements

### Unit Tests

1. **JWT Token Generation**
   - [ ] Token includes `clientId` claim
   - [ ] Token signature is valid
   - [ ] Token expiry is set correctly (4 hours)

2. **JWT Token Verification**
   - [ ] Valid token with `clientId` is accepted
   - [ ] Invalid signature is rejected
   - [ ] Expired token is rejected
   - [ ] Token without `clientId` is rejected (post-migration)

3. **Client Scoping Middleware**
   - [ ] Normal user receives `req.clientId` from token
   - [ ] Admin with `X-Client-Context` header receives target `clientId`
   - [ ] Non-admin with `X-Client-Context` header receives `403 Forbidden`
   - [ ] Webhook endpoints bypass middleware

### Integration Tests

1. **Login Flow**
   - [ ] User logs in → token includes correct `clientId`
   - [ ] User from client A cannot access client B's data using direct URL

2. **Admin Context Switching**
   - [ ] Admin switches context → subsequent requests filtered by target client
   - [ ] Admin without `X-Client-Context` sees own client's data
   - [ ] Admin with invalid `X-Client-Context` receives error

3. **Cross-Client Access Prevention**
   - [ ] Client A user requests client B work order → `404 Not Found`
   - [ ] Tampered token (modified clientId) is rejected

## Error Responses

### 401 Unauthorized: Missing clientId

**Scenario**: User has old token without `clientId` claim

```json
{
  "success": false,
  "message": "Authentication token is outdated. Please log in again.",
  "code": "TOKEN_MISSING_CLIENT_ID"
}
```

### 403 Forbidden: Invalid Admin Context Switch

**Scenario**: Non-admin user provides `X-Client-Context` header

```json
{
  "success": false,
  "message": "Admin role required for client context switching",
  "code": "FORBIDDEN_CONTEXT_SWITCH"
}
```

### 400 Bad Request: Invalid Client Context

**Scenario**: Admin provides `X-Client-Context` with non-existent client ID

```json
{
  "success": false,
  "message": "Invalid client context. Client ID 999 does not exist.",
  "code": "INVALID_CLIENT_CONTEXT"
}
```

## Audit Logging

All authentication events must be logged with client context:

```json
{
  "timestamp": "2025-10-17T14:30:00.000Z",
  "event": "LOGIN_SUCCESS",
  "user_id": 123,
  "client_id": 1,
  "role": "staff",
  "ip_address": "192.168.1.100"
}
```

For admin context switching:

```json
{
  "timestamp": "2025-10-17T14:35:00.000Z",
  "event": "ADMIN_CONTEXT_SWITCH",
  "admin_user_id": 456,
  "admin_client_id": 1,
  "target_client_id": 2,
  "target_client_name": "ABC Property Management",
  "ip_address": "192.168.1.100"
}
```

## Changelog

- 2025-10-17: Initial authentication contract for multi-client architecture
