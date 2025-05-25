# VisionWest Work Order Management System - Project Overview

## Project Purpose
The VisionWest Work Order Management System is a mobile-friendly web application designed to streamline the management of property maintenance work orders. It integrates with an existing n8n workflow that processes incoming email work orders and sends SMS notifications.

## Key Features
1. **Mobile-Optimized Interface**: Fully responsive design that works well on smartphones and tablets
2. **Progressive Web App (PWA)**: Installable on mobile devices with app-like experience
3. **Work Order Dashboard**: Visual overview of pending, in-progress, and completed work orders
4. **Work Order Management**: Detailed views for each work order with status tracking
5. **Photo Management**: Ability to upload, view, and manage photos related to work orders
6. **Status Updates**: Dedicated workflow for updating work order statuses with notes
7. **Notification System**: Real-time alerts for new work orders, status changes, and notes

## Technical Architecture

### Frontend
- **Framework**: React with Vite for fast development
- **Styling**: Tailwind CSS for responsive, mobile-first design
- **Routing**: React Router for navigation between screens
- **State Management**: React Context for authentication and data
- **PWA Support**: Service worker and manifest for installable web app
- **Deployment**: Netlify for hosting the frontend application

### Backend (Implemented)
- **API Framework**: Node.js with Express
- **Database**: PostgreSQL for relational data storage
- **Authentication**: JWT-based authentication system with role-based access control
- **File Storage**: Cloud storage for work order photos
- **Notification System**: In-app notifications for users
- **Deployment**: Render for hosting the backend services

### Integration
- The system integrates with an existing n8n workflow that:
  - Monitors an email inbox for new work orders
  - Extracts data from PDF attachments
  - Uses AI (OpenAI) to structure the work order information
  - Sends SMS notifications to relevant personnel
  - Creates work orders via webhook API

## Current Status
- Frontend development is complete with fully functional:
  - Login screen
  - Dashboard
  - Work order list with filtering
  - Work order details view
  - Photo upload interface
  - Status update workflow
  - Installable PWA capabilities
- The frontend is deployed on Netlify
- Backend API is implemented with:
  - Authentication endpoints
  - Work order management
  - Notes and status updates
  - Photo uploads and management
  - Notification system
- Database schema is implemented with Sequelize ORM
- Integration with n8n workflow is operational

## Next Steps
1. ~~Implement the PostgreSQL database using the designed schema~~ ✓ COMPLETED
2. ~~Develop the backend API endpoints~~ ✓ COMPLETED
3. ~~Connect the frontend to the backend API~~ ✓ COMPLETED
4. ~~Integrate with the existing n8n workflow~~ ✓ COMPLETED
5. Enhance offline capabilities for the PWA
6. Implement push notifications for mobile users
7. Final end-to-end testing and user acceptance testing

This project provides VisionWest with a modern, efficient system for managing property maintenance work orders, improving communication between stakeholders, and creating a more streamlined workflow for their maintenance team.