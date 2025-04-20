# VisionWest Work Order Management System - Backend API

This is the backend API for the VisionWest Work Order Management System.

## Prerequisites

- Node.js (v14.x or higher)
- npm or yarn
- Access to a PostgreSQL database (remote or local)

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Configure the environment variables by copying the `.env.example` to `.env` and updating the values as necessary:

```bash
cp .env.example .env
# Then edit the .env file with your database credentials
```

The application is already configured to connect to a remote PostgreSQL database. If you need to modify the database connection details, update the `.env` file.

## Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

This will start the server with nodemon, which will automatically restart the server when changes are made.

### Production Mode

```bash
npm start
# or
yarn start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user information (requires authentication)

### Work Orders

- `GET /api/work-orders/summary` - Get work order summary for dashboard
- `GET /api/work-orders` - Get all work orders (with filtering)
- `GET /api/work-orders/:id` - Get work order by ID
- `POST /api/work-orders` - Create new work order
- `PATCH /api/work-orders/:id/status` - Update work order status
- `POST /api/work-orders/:id/notes` - Add note to work order

### Alerts/Notifications

- `GET /api/alerts` - Get all notifications for authenticated user
- `GET /api/alerts/unread-count` - Get count of unread notifications
- `PATCH /api/alerts/:id` - Mark notification as read
- `PATCH /api/alerts/mark-all-read` - Mark all notifications as read

### Photos

- `GET /api/photos/work-order/:workOrderId` - Get all photos for a work order
- `POST /api/photos/work-order/:workOrderId` - Upload photos for a work order
- `DELETE /api/photos/:id` - Delete a photo

## Querying Work Orders

The work order endpoint supports various filtering options:

- `?status=pending|in-progress|completed` - Filter by status
- `?date=today` - Show only today's work orders
- `?sort=latest` - Sort by most recent
- `?search=keyword` - Search in job number, property name or description
- `?page=1&limit=10` - Pagination

Example: `/api/work-orders?status=pending&sort=latest&page=1&limit=10`

## API Response Format

All API responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... } // The response data object or array
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // Optional array of validation errors
}
```

## File Upload

For photo uploads, the API accepts multipart/form-data requests with:
- 'photos' field containing the image files (max 5 files, 10MB each)
- 'description' field (optional) with a description of the photos

Example:
```
POST /api/photos/work-order/1
Content-Type: multipart/form-data

photos: [file1.jpg, file2.jpg]
description: "Photos of the damaged roof area"
```

## Authentication

All API endpoints except for login require authentication using JWT. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Development Notes

- The database is automatically seeded with test users when running in development mode:
  - Client (VisionWest): client@visionwest.org (password: password123)
  - Admin (Williams Property): admin@williamspropertyservices.co.nz (password: password123)
  - Staff (Williams Property): staff@williamspropertyservices.co.nz (password: password123)

- In development mode, the database schema is automatically synchronized using `sequelize.sync({ alter: true })`. This should not be used in production.

## License

ISC