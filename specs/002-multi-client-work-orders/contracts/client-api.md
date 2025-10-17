# API Contract: Client Management

**Feature**: Multi-Client Work Order Management
**Version**: 1.0.0
**Date**: 2025-10-17

## Overview

This contract defines the REST API endpoints for managing client organizations. These endpoints are restricted to users with the `admin` role (global administrators).

## Base URL

```
https://api.visionwest.example.com/api/clients
```

## Authentication

All endpoints require JWT authentication with `admin` role.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. List All Clients

**Request**:
```
GET /api/clients
```

**Query Parameters**:
| Parameter | Type    | Required | Description                          |
|-----------|---------|----------|--------------------------------------|
| status    | string  | No       | Filter by status: 'active', 'inactive', 'archived' |
| page      | integer | No       | Page number (default: 1)             |
| limit     | integer | No       | Results per page (default: 20, max: 100) |
| search    | string  | No       | Search by name or code               |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Visionwest",
      "code": "VISIONWEST",
      "status": "active",
      "primary_contact_name": "Admin",
      "primary_contact_email": "admin@visionwest.com",
      "primary_contact_phone": "+1234567890",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "user_count": 25,
      "work_order_count": 1500
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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User role is not 'admin'

---

### 2. Get Client by ID

**Request**:
```
GET /api/clients/:id
```

**Path Parameters**:
| Parameter | Type    | Description             |
|-----------|---------|-------------------------|
| id        | integer | Client ID               |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Visionwest",
    "code": "VISIONWEST",
    "status": "active",
    "primary_contact_name": "Admin",
    "primary_contact_email": "admin@visionwest.com",
    "primary_contact_phone": "+1234567890",
    "settings": {},
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z",
    "user_count": 25,
    "work_order_count": 1500
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User role is not 'admin'
- `404 Not Found`: Client ID does not exist

---

### 3. Create Client

**Request**:
```
POST /api/clients
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "ABC Property Management",
  "code": "ABC_PROP",
  "primary_contact_name": "John Doe",
  "primary_contact_email": "john@abcprop.com",
  "primary_contact_phone": "+1234567890",
  "status": "active"
}
```

**Field Validation**:
| Field                   | Type   | Required | Constraints                                    |
|-------------------------|--------|----------|------------------------------------------------|
| name                    | string | Yes      | 1-255 characters, trimmed                      |
| code                    | string | Yes      | 1-50 characters, uppercase, alphanumeric+_-    |
| primary_contact_name    | string | No       | 1-255 characters                               |
| primary_contact_email   | string | No       | Valid email format                             |
| primary_contact_phone   | string | No       | 10-20 characters                               |
| status                  | string | No       | 'active' (default), 'inactive', 'archived'     |

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 2,
    "name": "ABC Property Management",
    "code": "ABC_PROP",
    "status": "active",
    "primary_contact_name": "John Doe",
    "primary_contact_email": "john@abcprop.com",
    "primary_contact_phone": "+1234567890",
    "settings": {},
    "created_at": "2025-10-17T12:00:00.000Z",
    "updated_at": "2025-10-17T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors (missing required fields, invalid format)
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
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User role is not 'admin'
- `409 Conflict`: Client code already exists

---

### 4. Update Client

**Request**:
```
PUT /api/clients/:id
Content-Type: application/json
```

**Path Parameters**:
| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | Client ID   |

**Request Body** (partial updates allowed):
```json
{
  "name": "ABC Property Management Ltd",
  "primary_contact_email": "contact@abcprop.com",
  "status": "inactive"
}
```

**Field Validation**: Same as Create endpoint (all fields optional for update)

**Note**: `code` field is immutable and cannot be updated

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": 2,
    "name": "ABC Property Management Ltd",
    "code": "ABC_PROP",
    "status": "inactive",
    "primary_contact_name": "John Doe",
    "primary_contact_email": "contact@abcprop.com",
    "primary_contact_phone": "+1234567890",
    "settings": {},
    "created_at": "2025-10-17T12:00:00.000Z",
    "updated_at": "2025-10-17T14:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors, attempt to modify `code`
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User role is not 'admin'
- `404 Not Found`: Client ID does not exist

---

### 5. Delete Client

**Request**:
```
DELETE /api/clients/:id
```

**Path Parameters**:
| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | Client ID   |

**Business Rules**:
- Cannot delete client with active users or work orders
- Soft delete preferred (set status='archived') over hard delete
- Must confirm deletion via query parameter `?confirm=true`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Client archived successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Missing confirmation parameter
  ```json
  {
    "success": false,
    "message": "Cannot delete client with active users or work orders",
    "details": {
      "user_count": 5,
      "work_order_count": 120
    }
  }
  ```
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User role is not 'admin' OR attempting to delete Visionwest client
- `404 Not Found`: Client ID does not exist

---

### 6. Get Client Statistics

**Request**:
```
GET /api/clients/:id/stats
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "client_id": 1,
    "user_count": 25,
    "work_order_count": 1500,
    "work_orders_by_status": {
      "pending": 120,
      "in_progress": 45,
      "completed": 1300,
      "cancelled": 35
    },
    "users_by_role": {
      "client": 15,
      "client_admin": 5,
      "staff": 5
    },
    "oldest_work_order": "2024-01-15T10:30:00.000Z",
    "newest_work_order": "2025-10-17T08:15:00.000Z"
  }
}
```

---

## Admin Client Context Switching

Admins can view data for specific clients by including a custom header in requests to work order endpoints:

**Header**:
```
X-Client-Context: <client_id>
```

**Example**:
```
GET /api/work-orders
Authorization: Bearer <admin_jwt>
X-Client-Context: 2
```

This returns work orders for client ID 2, even though the admin user belongs to a different client.

**Security**:
- Only available for `admin` role users
- All actions are logged with both admin user ID and target client ID
- Frontend must visually indicate when admin is in switched context

---

## Backward Compatibility

### Existing Endpoints

All existing work order endpoints automatically scoped by client_id from JWT token:
- `GET /api/work-orders` → Filtered by `client_id`
- `POST /api/work-orders` → Auto-assigns `client_id`
- `GET /api/work-orders/:id` → Validates work order belongs to user's client
- `PUT /api/work-orders/:id` → Validates work order belongs to user's client

### Webhook Endpoint (Protected)

The n8n webhook endpoint remains unchanged and is excluded from client scoping:

```
POST /api/webhook/work-orders
```

- Does NOT require client_id in request
- Automatically assigns to Visionwest client (code: 'VISIONWEST')
- Uses separate authentication mechanism (not JWT)
- Must NOT be affected by client scoping middleware

---

## Rate Limiting

Client management endpoints are subject to rate limiting:
- 100 requests per minute per admin user
- 429 Too Many Requests response if exceeded

---

## Changelog

- 2025-10-17: Initial API contract for client management endpoints
