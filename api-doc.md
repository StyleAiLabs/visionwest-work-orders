# VisionWest Work Order Management System - API Documentation

This document provides a brief overview of the available API endpoints for frontend integration. All API requests should be made to the base URL of the backend server.

## Base URL
```
https://api.visionwest-workorders.com
```

## Authentication

### Login
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "role": "staff",
    "full_name": "Full Name",
    "phone_number": "0123456789"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```
GET /api/auth/me
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "role": "staff",
    "full_name": "Full Name",
    "phone_number": "0123456789",
    "is_active": true
  }
}
```

### Logout
```
POST /api/auth/logout
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Logout successful!"
}
```

## Work Orders

### Get Dashboard Summary
```
GET /api/work-orders/summary
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 5,
    "inProgress": 3,
    "completed": 7,
    "total": 15
  }
}
```

### Get Work Orders List
```
GET /api/work-orders
```
**Headers:**
```
Authorization: Bearer {token}
```
**Query Parameters:**
- `status` - Filter by status (pending, in-progress, completed)
- `date` - Filter by date (today)
- `sort` - Sort order (latest)
- `search` - Search term for job number, property name, or description
- `page` - Page number for pagination
- `limit` - Number of items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "jobNo": "RBWO010965",
      "date": "04 Apr 2025",
      "status": "pending",
      "property": "VisionWest Community Trust",
      "description": "Cleaning rubbish/debris off the roof...",
      "authorizedBy": "Danell Anderson"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Work Order Details
```
GET /api/work-orders/:id
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "jobNo": "RBWO010965",
    "date": "04 Apr 2025",
    "status": "pending",
    "supplier": {
      "name": "Williams Property Services",
      "phone": "0275 888 000",
      "email": "info@williamspropertyservices.co.nz"
    },
    "property": {
      "name": "VisionWest Community Trust",
      "phone": "021 352 190"
    },
    "description": "Cleaning rubbish/debris off the roof...",
    "poNumber": "PO120327",
    "authorizedBy": {
      "name": "Danell Anderson",
      "contact": "022 015 9961",
      "email": "danell.anderson@visionwest.org.nz"
    },
    "photos": [...],
    "notes": [...],
    "statusUpdates": [...]
  }
}
```

### Create Work Order
```
POST /api/work-orders
```
**Headers:**
```
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "job_no": "RBWO010999",
  "date": "2025-04-10",
  "supplier_name": "Williams Property Services",
  "supplier_phone": "0275 888 000",
  "supplier_email": "info@williamspropertyservices.co.nz",
  "property_name": "VisionWest Community Trust",
  "property_phone": "021 352 190",
  "description": "Fix broken door handle",
  "po_number": "PO120399",
  "authorized_by": "Danell Anderson",
  "authorized_contact": "022 015 9961",
  "authorized_email": "danell.anderson@visionwest.org.nz"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Work order created successfully!",
  "data": {
    "id": 10,
    "jobNo": "RBWO010999",
    "status": "pending"
  }
}
```

### Update Work Order Status
```
PATCH /api/work-orders/:id/status
```
**Headers:**
```
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "status": "in-progress",
  "notes": "Started work on fixing the door handle"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Work order status updated successfully!",
  "data": {
    "id": 10,
    "status": "in-progress"
  }
}
```

### Add Note to Work Order
```
POST /api/work-orders/:id/notes
```
**Headers:**
```
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "note": "Contacted tenant to arrange access"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Note added successfully!",
  "data": {
    "id": 5,
    "note": "Contacted tenant to arrange access",
    "createdBy": "Staff User",
    "createdAt": "2025-04-10T09:30:00Z"
  }
}
```

### Delete Work Order (Admin only)
```
DELETE /api/work-orders/:workOrderId
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Work order and all related data deleted successfully"
}
```

## Photos

### Get Work Order Photos
```
GET /api/photos/work-order/:workOrderId
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "url": "https://bucket.s3.amazonaws.com/work-orders/RBWO010965/1234567890-image.jpg",
      "filename": "image.jpg",
      "description": "Roof before cleaning",
      "uploadedAt": "2025-04-05T10:30:00Z",
      "uploadedBy": {
        "id": 3,
        "name": "Staff User",
        "email": "staff@example.com"
      }
    }
  ]
}
```

### Upload Photos
```
POST /api/photos/work-order/:workOrderId
```
**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Form Data:**
- `photos` - Array of image files (max 5, 10MB each)
- `description` - Optional description for the photos

**Response:**
```json
{
  "success": true,
  "message": "2 photo(s) uploaded successfully!",
  "data": [
    {
      "id": 3,
      "url": "https://bucket.s3.amazonaws.com/work-orders/RBWO010965/1234567890-image1.jpg",
      "filename": "image1.jpg",
      "description": "After cleaning",
      "uploadedAt": "2025-04-10T14:45:00Z",
      "uploadedBy": {
        "id": 3,
        "name": "Staff User",
        "email": "staff@example.com"
      }
    }
  ]
}
```

### Delete Photo
```
DELETE /api/photos/:id
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Photo deleted successfully!"
}
```

## Notifications/Alerts

### Get Notifications
```
GET /api/alerts
```
**Headers:**
```
Authorization: Bearer {token}
```
**Query Parameters:**
- `filter` - Filter type (all, unread, work-order, status-change, completion, urgent)
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "work-order",
      "title": "New Work Order Created",
      "message": "Job #RBWO010965 has been created for roof inspection.",
      "read": false,
      "time": "2 hours ago",
      "workOrderId": 1,
      "workOrderJobNo": "RBWO010965"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Unread Count
```
GET /api/alerts/unread-count
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "count": 3
}
```

### Mark Notification as Read
```
PATCH /api/alerts/:id
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read successfully!"
}
```

### Mark All Notifications as Read
```
PATCH /api/alerts/mark-all-read
```
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read successfully!"
}
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error message details",
  "errors": ["Validation error 1", "Validation error 2"] // Optional array of validation errors
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication Notes

1. Store the JWT token securely after login (e.g., in HttpOnly cookies or localStorage)
2. Include the token in the Authorization header for all protected requests
3. Handle token expiration by redirecting to login when 401 responses are received

## Example Usage (JavaScript)

```javascript
// Login example
async function login(email, password) {
  try {
    const response = await fetch('https://api.visionwest-workorders.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Get work orders with authentication
async function getWorkOrders(status = null, page = 1) {
  try {
    // Build query string
    let url = 'https://api.visionwest-workorders.com/api/work-orders?page=' + page;
    if (status) {
      url += '&status=' + status;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    
    const data = await response.json();
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to fetch work orders:', error);
    throw error;
  }
}
```