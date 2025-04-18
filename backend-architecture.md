## Backend Architecture Overview

Based on the project documentation and frontend code, the backend needs to be built with:

- **Node.js with Express** as the API framework
- **PostgreSQL** for the relational database
- **JWT-based authentication** for user management
- **Cloud storage** for work order photos
- **Integration with n8n workflow** that processes incoming email work orders

## Database Analysis

Looking at the ERD diagram, we have several key entities:

1. **USERS** - Stores user information including roles
2. **WORK_ORDERS** - Central entity for work orders with status tracking
3. **STATUS_UPDATES** - History of status changes
4. **PHOTOS** - Photo uploads linked to work orders
5. **WORK_ORDER_NOTES** - Notes associated with work orders
6. **NOTIFICATIONS** - In-app notifications for users
7. **SMS_NOTIFICATIONS** - Outbound SMS notifications

The relationships are well-defined and should provide a solid foundation for the API.

## Required API Endpoints

Based on the frontend implementation, we'll need the following API endpoints:

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user info

### Work Orders
- GET `/api/work-orders` - List work orders with filtering options
- GET `/api/work-orders/:id` - Get specific work order details
- POST `/api/work-orders` - Create new work order
- PATCH `/api/work-orders/:id` - Update work order details
- PATCH `/api/work-orders/:id/status` - Update work order status

### Photos
- GET `/api/work-orders/:id/photos` - Get photos for a work order
- POST `/api/work-orders/:id/photos` - Upload photos for a work order
- DELETE `/api/photos/:id` - Delete a photo

### Notes
- GET `/api/work-orders/:id/notes` - Get notes for a work order
- POST `/api/work-orders/:id/notes` - Add notes to a work order
- PATCH `/api/notes/:id` - Update a note

### Notifications
- GET `/api/alerts` - Get user notifications
- GET `/api/alerts/unread-count` - Get count of unread notifications
- PATCH `/api/alerts/:id` - Mark notification as read
- PATCH `/api/alerts/mark-all-read` - Mark all notifications as read

## Backend Implementation Steps

Here's how we should approach the backend development:

1. **Set up the project structure**:
   - Create an Express.js application structure
   - Configure environment variables for database connection, JWT secrets, etc.
   - Set up middleware for authentication, error handling, etc.

2. **Implement the database**:
   - Set up PostgreSQL database
   - Create migration scripts based on the ERD
   - Implement data models using an ORM like Sequelize or Knex.js

3. **Implement authentication**:
   - Create user registration/login endpoints
   - Implement JWT generation and validation
   - Set up user role-based access control

4. **Develop API endpoints**:
   - Implement CRUD operations for work orders
   - Create endpoints for photos, notes, and notifications
   - Add filtering, sorting, and pagination where needed

5. **Set up file storage**:
   - Implement file upload for photos
   - Configure cloud storage (AWS S3, Google Cloud Storage, etc.)
   - Create secure URL generation for frontend access

6. **Implement notification system**:
   - Create notification generation logic
   - Set up SMS integration for outbound messages
   - Implement real-time updates (optional, using WebSockets)

7. **Integrate with n8n workflow**:
   - Create API endpoints for n8n to consume
   - Implement webhook handlers for email-based work order creation
   - Process AI-structured data from OpenAI

8. **Testing and documentation**:
   - Write unit and integration tests
   - Create API documentation using Swagger/OpenAPI
   - Set up CI/CD pipeline for testing

## Considerations for Integration with n8n

The existing n8n workflow does:
- Monitor email inbox for new work orders
- Extract data from PDF attachments
- Use OpenAI to structure work order information
- Send SMS notifications

The backend will need to:
- Provide endpoints that n8n can call to create new work orders
- Accept structured data from the AI processing
- Trigger notifications through the database that can be reflected in the frontend

## Deployment Plan

As mentioned in the README, the plan is to deploy the backend to Render. We should:

1. Set up a production-ready PostgreSQL instance
2. Configure environment variables for Render deployment
3. Set up continuous deployment from the Git repository
4. Configure proper CORS settings for the deployed frontend on Netlify
5. Implement proper logging and monitoring
