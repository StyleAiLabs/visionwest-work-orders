# VisionWest Work Order Management System - Project Overview

## Project Purpose
The VisionWest Work Order Management System is a mobile-friendly web application designed to streamline the management of property maintenance work orders. It integrates with an existing n8n workflow that processes incoming email work orders and sends SMS notifications.

## Key Features
1. **Mobile-Optimized Interface**: Fully responsive design that works well on smartphones and tablets
2. **Work Order Dashboard**: Visual overview of pending, in-progress, and completed work orders
3. **Work Order Management**: Detailed views for each work order with status tracking
4. **Photo Management**: Ability to upload, view, and manage photos related to work orders
5. **Status Updates**: Dedicated workflow for updating work order statuses with notes
6. **Notification System**: Alerts for new work orders and status changes

## Technical Architecture

### Frontend
- **Framework**: React with Vite for fast development
- **Styling**: Tailwind CSS for responsive, mobile-first design
- **Routing**: React Router for navigation between screens
- **State Management**: React Context for authentication and data
- **Deployment**: Netlify for hosting the frontend application

### Backend (Planned)
- **API Framework**: Node.js with Express
- **Database**: PostgreSQL for relational data storage
- **Authentication**: JWT-based authentication system
- **File Storage**: Cloud storage for work order photos
- **Deployment**: Render for hosting the backend services

### Integration
- The system integrates with an existing n8n workflow that:
  - Monitors an email inbox for new work orders
  - Extracts data from PDF attachments
  - Uses AI (OpenAI) to structure the work order information
  - Sends SMS notifications to relevant personnel

## Current Status
- Frontend development is complete with fully functional:
  - Login screen
  - Dashboard
  - Work order list with filtering
  - Work order details view
  - Photo upload interface
  - Status update workflow
- The frontend is deployed on Netlify
- Database schema is designed and ready for implementation
- Backend development is planned as the next phase

## Next Steps
1. Implement the PostgreSQL database using the designed schema
2. Develop the backend API endpoints
3. Connect the frontend to the backend API
4. Integrate with the existing n8n workflow
5. Test the complete system
6. Deploy the backend to Render
7. Final end-to-end testing and launch

This project provides VisionWest with a modern, efficient system for managing property maintenance work orders, improving communication between stakeholders, and creating a more streamlined workflow for their maintenance team.