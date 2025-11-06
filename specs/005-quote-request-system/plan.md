# Implementation Plan: Quote Request System

**Feature ID**: 005-quote-request-system  
**Version**: 1.0.0  
**Status**: Planning  
**Created**: 2025-11-01  
**Sprint Planning**: Phase 1 (MVP) - Sprints 1-2  

---

## 🎯 Implementation Overview

### Objective
Implement a complete quote request workflow that enables property managers to request quotes for maintenance work, WPSG staff to provide quotes, and seamless conversion of approved quotes to work orders with full audit trail.

### Success Criteria
- ✅ Client admins can create and submit quote requests
- ✅ WPSG staff can view, assess, and provide quotes
- ✅ Client admins can approve/decline quotes
- ✅ Approved quotes convert to work orders automatically
- ✅ Complete audit trail maintained for all actions
- ✅ Mobile-first UI with NextGen WOM branding
- ✅ Role-based access control enforced at API level

---

## 📋 Phase 1: MVP - Core Quote Workflow

**Timeline**: 2 Sprints (4 weeks)  
**Goal**: Implement basic quote request → provide → approve → convert workflow

### Sprint 1: Quote Request & Viewing (Week 1-2)

#### Backend Development

**1. Database Schema & Models**
- [ ] Create `quotes` table migration
  - Fields: id, quote_number, client_id, status, property_name, property_address, title, description, scope_of_work, contact_person, contact_email, is_urgent, required_by_date, created_by, created_at, updated_at, submitted_at
- [ ] Create `quote_messages` table migration
  - Fields: id, quote_id, user_id, message_type, message, created_at
- [ ] Create `quote_attachments` table migration
  - Fields: id, quote_id, user_id, file_type, file_name, file_url, description, uploaded_at
- [ ] Create Sequelize models: `Quote`, `QuoteMessage`, `QuoteAttachment`
- [ ] Define model associations (Quote hasMany Messages/Attachments, belongsTo User/Client)
- [ ] Add indexes: (client_id, status), (quote_number), (created_by)

**Estimated Effort**: 8 hours

---

**2. Quote Creation API**
- [ ] Create `backend/routes/quote.routes.js`
- [ ] Implement `POST /api/quotes` - Create new quote (client_admin, admin)
- [ ] Implement auto-generation of quote_number (format: QTE-YYYY-###)
- [ ] Implement `PATCH /api/quotes/:id` - Update draft quote
- [ ] Implement `POST /api/quotes/:id/submit` - Submit quote for review
- [ ] Add validation: required fields, character limits, date validation
- [ ] Implement client_id scoping for client_admin role
- [ ] Add middleware: `authMiddleware.isClientAdminOrAdmin`

**Estimated Effort**: 6 hours

---

**3. Quote Viewing API**
- [ ] Implement `GET /api/quotes` - List quotes with role-based filtering
  - Client: Filter by authorized_email (future - Phase 3)
  - Client_admin: Filter by client_id
  - Staff/Admin: No filter (all quotes)
- [ ] Implement `GET /api/quotes/:id` - Get quote details
- [ ] Implement `GET /api/quotes/summary` - Dashboard summary counts
- [ ] Add query filters: status, urgency, client_id, search
- [ ] Add pagination support
- [ ] Add middleware: `authMiddleware.canAccessQuote`

**Estimated Effort**: 5 hours

---

**4. File Upload Integration**
- [ ] Implement `POST /api/quotes/:id/attachments` - Upload photos/documents
- [ ] Configure multer for file handling (max 10 files, 10MB each)
- [ ] Integrate with AWS S3 (reuse existing photo service pattern)
- [ ] Implement `GET /api/quotes/:id/attachments` - List attachments
- [ ] Implement `DELETE /api/quotes/attachments/:id` - Delete attachment
- [ ] Add file type validation (images, PDF, doc, xlsx)

**Estimated Effort**: 4 hours

---

**5. Notification Integration**
- [ ] Create `notifyQuoteCreated()` function
- [ ] Create `notifyQuoteSubmitted()` function
- [ ] Integrate with existing notification service
- [ ] Send in-app notifications to WPSG staff on submission
- [ ] Send email notifications (integrate with n8n pattern)

**Estimated Effort**: 3 hours

---

#### Frontend Development

**6. Quote Request Form**
- [ ] Create `frontend/src/pages/Quotes/QuoteRequestForm.jsx`
- [ ] Implement form fields: property, title, description, scope, contact, urgency, required-by date
- [ ] Add form validation with react-hook-form + zod
- [ ] Implement photo/document upload component
- [ ] Add "Save Draft" and "Submit" buttons
- [ ] Implement auto-save every 30 seconds
- [ ] Add mobile-responsive layout (mobile-first)
- [ ] Apply NextGen WOM branding (deep-navy, nextgen-green colors)

**Estimated Effort**: 8 hours

---

**7. Quote List Page**
- [ ] Create `frontend/src/pages/Quotes/QuoteListPage.jsx`
- [ ] Implement quote list with cards (mobile) and table (desktop)
- [ ] Add status badges with correct colors (pending=blue, quoted=green, etc.)
- [ ] Implement filters: status, urgency, date range
- [ ] Add search functionality (quote number, property, description)
- [ ] Implement pagination controls
- [ ] Add "New Quote Request" button (role-based visibility)
- [ ] Show urgent quotes with red badge

**Estimated Effort**: 6 hours

---

**8. Quote Dashboard Widget**
- [ ] Create `frontend/src/components/Dashboard/QuoteSummaryWidget.jsx`
- [ ] Display status counts: Draft, Pending, Quoted, Approved, Declined
- [ ] Make status cards clickable (navigate to filtered list)
- [ ] Add "New Quote Request" button
- [ ] Implement role-based data fetching
- [ ] Apply responsive grid layout
- [ ] Integrate with main dashboard

**Estimated Effort**: 4 hours

---

**9. Quote Service Layer**
- [ ] Create `frontend/src/services/quoteService.js`
- [ ] Implement `createQuote(data)`
- [ ] Implement `getQuotes(filters)`
- [ ] Implement `getQuoteById(id)`
- [ ] Implement `updateQuote(id, data)`
- [ ] Implement `submitQuote(id)`
- [ ] Implement `getQuoteSummary()`
- [ ] Implement `uploadAttachments(quoteId, files)`
- [ ] Add error handling and toast notifications

**Estimated Effort**: 3 hours

---

### Sprint 2: Quote Provision & Approval (Week 3-4)

#### Backend Development

**10. Quote Response API**
- [ ] Implement `PATCH /api/quotes/:id/provide-quote` - Staff provides quote
  - Fields: estimated_cost, estimated_hours, quote_notes, quote_valid_until
  - Status change: Pending → Quoted
  - Create QuoteMessage with type 'quote_provided'
- [ ] Implement `PATCH /api/quotes/:id/request-info` - Staff requests info
  - Status change: Pending → Information Requested
- [ ] Implement `PATCH /api/quotes/:id/decline` - Staff declines quote
  - Require decline_reason field
  - Status change: → Declined
- [ ] Add validation for estimated_cost > 0, estimated_hours > 0
- [ ] Add middleware: `authMiddleware.isStaffOrAdmin`

**Estimated Effort**: 5 hours

---

**11. Quote Approval API**
- [ ] Implement `PATCH /api/quotes/:id/approve` - Client admin approves
  - Status change: Quoted → Approved
  - Validate quote not expired
  - Create QuoteMessage with type 'approved'
- [ ] Implement `PATCH /api/quotes/:id/decline-quote` - Client admin declines
  - Require decline_reason field
  - Status change: Quoted → Declined
- [ ] Add middleware: `authMiddleware.isClientAdminOrAdmin`
- [ ] Prevent approval if quote expired
- [ ] Trigger notifications on approval/decline

**Estimated Effort**: 4 hours

---

**12. Quote to Work Order Conversion**
- [ ] Implement `POST /api/quotes/:id/convert` - Convert to work order
  - Validate status is 'Approved'
  - Generate work order job_no
  - Create work order with quote data
  - Copy attachments to work order photos
  - Create work order note with quote reference
  - Update quote status to 'Converted'
  - Link quote and work order (bidirectional)
- [ ] Use database transaction for atomicity
- [ ] Add `created_from_quote_id` field to work_orders table
- [ ] Add middleware: `authMiddleware.isStaffOrAdmin`

**Estimated Effort**: 8 hours

---

**13. Quote Expiry System**
- [ ] Create scheduled job for quote expiry monitoring
- [ ] Implement `checkExpiredQuotes()` function
  - Find quotes with status='Quoted' and valid_until < now
  - Update status to 'Expired'
  - Send notifications
- [ ] Implement `PATCH /api/quotes/:id/renew` - Renew expired quote
  - Update validity period
  - Status change: Expired → Quoted
- [ ] Schedule job to run daily (or use cron pattern)

**Estimated Effort**: 4 hours

---

**14. Quote Messaging API**
- [ ] Implement `POST /api/quotes/:id/messages` - Add message
- [ ] Implement `GET /api/quotes/:id/messages` - List messages
- [ ] Add role-based access for messaging
- [ ] Trigger notifications on new message
- [ ] Track message_type: 'comment', 'quote_update', 'status_change'

**Estimated Effort**: 3 hours

---

#### Frontend Development

**15. Quote Detail Page**
- [ ] Create `frontend/src/pages/Quotes/QuoteDetailPage.jsx`
- [ ] Display quote header: title, quote_number, status badge, urgency flag
- [ ] Display property and contact information
- [ ] Display description and scope of work
- [ ] Show attachments gallery (photos and documents)
- [ ] Display quote timeline/history
- [ ] Add action buttons based on role and status
- [ ] Implement mobile-responsive layout

**Estimated Effort**: 6 hours

---

**16. Quote Provision Form (Staff)**
- [ ] Create `QuoteProvisionForm` component
- [ ] Implement fields: estimated_cost, estimated_hours, quote_notes, validity_period
- [ ] Add itemized cost breakdown (optional, array input)
- [ ] Add quote document upload
- [ ] Implement "Provide Quote" button
- [ ] Implement "Request More Info" button with message dialog
- [ ] Implement "Decline" button with reason textarea
- [ ] Add validation and error handling

**Estimated Effort**: 5 hours

---

**17. Quote Approval Interface (Client Admin)**
- [ ] Create `QuoteApprovalCard` component
- [ ] Display quote details prominently (cost, hours, scope, validity)
- [ ] Show itemized breakdown if provided
- [ ] Display quote validity date with expiry warning
- [ ] Implement "Approve Quote" button with confirmation dialog
- [ ] Implement "Decline Quote" button with reason textarea
- [ ] Disable actions if quote expired
- [ ] Show "Quote Expired" message with renewal request option

**Estimated Effort**: 4 hours

---

**18. Quote Messaging Component**
- [ ] Create `QuoteMessagesThread` component
- [ ] Display messages in timeline format (newest first)
- [ ] Show message author, timestamp, message type badge
- [ ] Implement message input form at bottom
- [ ] Add "Send Message" button
- [ ] Show typing indicator (optional)
- [ ] Auto-scroll to bottom on new message
- [ ] Mobile-optimized message UI

**Estimated Effort**: 4 hours

---

**19. Work Order Conversion Flow**
- [ ] Add "Convert to Work Order" button on approved quotes
- [ ] Create confirmation dialog with work order preview
- [ ] Show pre-populated work order form (editable)
- [ ] Implement conversion API call
- [ ] Handle success: navigate to work order detail page
- [ ] Show toast notification: "Quote converted to Work Order [job_no]"
- [ ] Update quote status badge to "Converted"
- [ ] Add "View Work Order" link on converted quotes

**Estimated Effort**: 5 hours

---

**20. Quote Status Badges & Icons**
- [ ] Create `QuoteStatusBadge` component
- [ ] Define status colors:
  - Draft: gray
  - Pending: blue
  - Information Requested: yellow
  - Quoted: green
  - Under Discussion: amber
  - Approved: bright green
  - Declined: red
  - Expired: dark red
  - Converted: nextgen-green
- [ ] Add urgency badge (red with flame icon)
- [ ] Implement in all quote list views

**Estimated Effort**: 2 hours

---

### Testing & QA

**21. Backend Testing**
- [ ] Write unit tests for Quote model
- [ ] Write unit tests for quote controllers
- [ ] Write integration tests for quote API endpoints
- [ ] Test role-based access control (all 4 roles)
- [ ] Test quote to work order conversion (transaction rollback scenarios)
- [ ] Test file upload validation
- [ ] Test quote expiry logic
- [ ] Test notification triggers

**Estimated Effort**: 8 hours

---

**22. Frontend Testing**
- [ ] Test quote request form (validation, submission, draft save)
- [ ] Test quote list page (filters, search, pagination)
- [ ] Test quote detail page (all status states)
- [ ] Test quote provision form (staff)
- [ ] Test quote approval interface (client_admin)
- [ ] Test messaging thread
- [ ] Test work order conversion flow
- [ ] Test mobile responsive layout (all pages)
- [ ] Test accessibility (keyboard navigation, screen reader)

**Estimated Effort**: 6 hours

---

**23. End-to-End Testing**
- [ ] Test complete quote workflow: Create → Submit → Provide → Approve → Convert
- [ ] Test quote decline flow (by staff)
- [ ] Test quote decline flow (by client_admin)
- [ ] Test request more info flow
- [ ] Test quote expiry and renewal
- [ ] Test multi-client data isolation
- [ ] Test notification delivery (in-app, email)
- [ ] Test file upload and download

**Estimated Effort**: 4 hours

---

### Documentation

**24. API Documentation**
- [ ] Document all quote API endpoints in `api-doc.md`
- [ ] Add request/response examples
- [ ] Document query parameters and filters
- [ ] Document error responses
- [ ] Add role-based access notes

**Estimated Effort**: 2 hours

---

**25. User Documentation**
- [ ] Create user guide for creating quote requests (client_admin)
- [ ] Create user guide for providing quotes (staff)
- [ ] Create user guide for approving quotes (client_admin)
- [ ] Document quote status meanings
- [ ] Add troubleshooting section
- [ ] Create screenshots/diagrams of workflow

**Estimated Effort**: 3 hours

---

## 📊 Phase 1 Summary

### Total Estimated Effort
- **Backend**: 43 hours (5.4 days)
- **Frontend**: 44 hours (5.5 days)
- **Testing**: 18 hours (2.3 days)
- **Documentation**: 5 hours (0.6 days)
- **Total**: 110 hours (~13.8 days)

### Resource Allocation
- **Backend Developer**: 1 FTE for 2 sprints
- **Frontend Developer**: 1 FTE for 2 sprints
- **QA Engineer**: 0.5 FTE for Sprint 2
- **Tech Writer**: 0.25 FTE for Sprint 2

### Deliverables
- ✅ Quote request creation and submission
- ✅ Quote viewing with role-based filtering
- ✅ Quote provision by WPSG staff
- ✅ Quote approval/decline by client admins
- ✅ Quote to work order conversion
- ✅ Basic messaging and notifications
- ✅ Dashboard widget for quote summary
- ✅ Mobile-responsive UI with NextGen WOM branding

---

## 🔄 Phase 2: Enhanced Communication (Sprint 3)

**Timeline**: 1 Sprint (2 weeks)  
**Goal**: Request info, decline workflows, messaging, audit trail

### Stories to Implement
- US2.3: Staff Requests More Information
- US3.3: Client Admin Declines Quote
- US3.4: Negotiate Quote via Messages
- US5.3: View Quote History and Timeline

### Key Tasks
- [ ] Enhance messaging system with rich notifications
- [ ] Implement quote revision tracking (version history)
- [ ] Build complete timeline view with all actions
- [ ] Add export timeline as PDF
- [ ] Improve request more info workflow
- [ ] Add client response to info requests

**Estimated Effort**: 40 hours (5 days)

---

## 🔄 Phase 3: Quote Management (Sprint 4)

**Timeline**: 1 Sprint (2 weeks)  
**Goal**: Housing coordinator access, drafts, revisions, search/filter, expiry

### Stories to Implement
- US1.2: Housing Coordinator Requests Quote
- US1.3: Save Quote Request as Draft
- US3.5: Staff Updates Quote
- US5.2: Filter and Search Quotes
- US5.4: Export Quotes Report
- US6.1: System Monitors Quote Expiry
- US6.2: Staff Renews Expired Quote

### Key Tasks
- [ ] Implement client role (housing coordinator) access
- [ ] Build draft management system
- [ ] Implement quote revision system with history
- [ ] Add advanced filtering and search
- [ ] Build CSV export functionality
- [ ] Implement scheduled expiry monitoring
- [ ] Add quote renewal workflow

**Estimated Effort**: 45 hours (5.6 days)

---

## 🔄 Phase 4: Polish & Optimization (Sprint 5)

**Timeline**: 1 Sprint (2 weeks)  
**Goal**: UX improvements, reporting, analytics, performance

### Stories to Implement
- US4.2: View Linked Work Order from Quote
- Analytics and reporting improvements
- Performance optimizations
- Mobile UX refinements

### Key Tasks
- [ ] Add work order link from quote detail
- [ ] Build analytics dashboard for quotes
- [ ] Implement quote metrics reporting
- [ ] Optimize database queries (indexes, pagination)
- [ ] Improve mobile UX based on feedback
- [ ] Add quote templates (out of scope but quick win)
- [ ] Performance testing and optimization

**Estimated Effort**: 30 hours (3.8 days)

---

## 🎯 Technical Architecture

### Database Changes

**New Tables**:
```sql
quotes (
  id, quote_number, client_id, status, 
  property_name, property_address, property_phone,
  title, description, scope_of_work,
  contact_person, contact_email, contact_phone,
  is_urgent, required_by_date,
  estimated_cost, estimated_hours, quote_notes, quote_valid_until,
  quoted_at, approved_at, declined_at, converted_at,
  converted_to_work_order_id,
  created_by, created_at, updated_at, submitted_at
)

quote_messages (
  id, quote_id, user_id, message_type, message,
  previous_cost, new_cost, previous_hours, new_hours,
  created_at
)

quote_attachments (
  id, quote_id, user_id, file_type, file_name, 
  file_url, file_size, mime_type, description,
  uploaded_at
)
```

**Modified Tables**:
```sql
ALTER TABLE work_orders 
ADD COLUMN created_from_quote_id INTEGER REFERENCES quotes(id),
ADD COLUMN quote_number VARCHAR(20);
```

---

### Backend Structure

```
backend/
├── models/
│   ├── quote.model.js
│   ├── quoteMessage.model.js
│   └── quoteAttachment.model.js
├── controllers/
│   └── quote.controller.js
├── routes/
│   └── quote.routes.js
├── middleware/
│   └── quoteAccess.middleware.js
├── services/
│   ├── quoteService.js
│   └── quoteNotificationService.js
└── migrations/
    ├── YYYYMMDD-create-quotes-table.js
    ├── YYYYMMDD-create-quote-messages-table.js
    ├── YYYYMMDD-create-quote-attachments-table.js
    └── YYYYMMDD-add-quote-fields-to-work-orders.js
```

---

### Frontend Structure

```
frontend/src/
├── pages/
│   └── Quotes/
│       ├── QuoteRequestForm.jsx
│       ├── QuoteListPage.jsx
│       └── QuoteDetailPage.jsx
├── components/
│   ├── Dashboard/
│   │   └── QuoteSummaryWidget.jsx
│   └── Quotes/
│       ├── QuoteCard.jsx
│       ├── QuoteStatusBadge.jsx
│       ├── QuoteProvisionForm.jsx
│       ├── QuoteApprovalCard.jsx
│       ├── QuoteMessagesThread.jsx
│       ├── QuoteTimeline.jsx
│       └── QuoteFilters.jsx
└── services/
    └── quoteService.js
```

---

## 🔐 Security Considerations

### Authentication & Authorization
- [ ] All quote endpoints require JWT authentication
- [ ] Role-based middleware on all routes
- [ ] Client role: Email-scoped access (authorized_email matching)
- [ ] Client_admin role: Organization-scoped (client_id matching)
- [ ] Staff/Admin role: Cross-client access
- [ ] Validate user permissions before any state change

### Data Validation
- [ ] Validate all user inputs (quote forms, messages)
- [ ] Sanitize file uploads (check mime types, virus scan)
- [ ] Prevent SQL injection (use parameterized queries)
- [ ] Prevent XSS attacks (sanitize message content)
- [ ] Rate limiting on API endpoints

### Audit Trail
- [ ] Log all quote state changes
- [ ] Log all message additions
- [ ] Log all approval/decline actions
- [ ] Log work order conversions
- [ ] Include user ID, timestamp, IP address in logs

---

## 📊 Success Metrics & Monitoring

### Performance Metrics
- Quote list load time < 2 seconds
- Quote detail load time < 1 second
- Search/filter response < 500ms
- File upload < 5 seconds for 5MB
- Work order conversion < 3 seconds

### Business Metrics
- Number of quotes created per week
- Average quote response time (submission → quoted)
- Quote approval rate (approved / total quotes)
- Quote conversion rate (converted / approved)
- Average quote value
- Quote expiry rate

### Monitoring Setup
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure performance monitoring (APM)
- [ ] Create dashboards for key metrics
- [ ] Set up alerts for critical errors
- [ ] Monitor database query performance

---

## 🚀 Deployment Strategy

### Phase 1 Deployment (MVP)

**Pre-Deployment Checklist**:
- [ ] All Phase 1 tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested in staging
- [ ] Environment variables configured
- [ ] API documentation updated
- [ ] User documentation complete

**Deployment Steps**:
1. [ ] Run database migrations in staging
2. [ ] Deploy backend to staging (Render)
3. [ ] Deploy frontend to staging (Netlify)
4. [ ] Run smoke tests in staging
5. [ ] Get stakeholder approval
6. [ ] Schedule production deployment window
7. [ ] Run database migrations in production
8. [ ] Deploy backend to production
9. [ ] Deploy frontend to production
10. [ ] Verify production deployment
11. [ ] Monitor logs for 24 hours
12. [ ] Communicate feature availability to users

**Rollback Plan**:
- [ ] Keep previous backend version running
- [ ] Database migration rollback scripts ready
- [ ] Frontend can revert via Netlify deploy history
- [ ] Communication plan for rollback scenario

---

## 🎓 Training & Communication

### Internal Training
- [ ] Train WPSG staff on providing quotes
- [ ] Train WPSG staff on work order conversion
- [ ] Document quote workflow in internal wiki
- [ ] Create demo video for staff

### Client Training
- [ ] Train VisionWest client_admins on requesting quotes
- [ ] Train VisionWest client_admins on approving quotes
- [ ] Document quote request process
- [ ] Create demo video for clients
- [ ] Schedule training sessions

### Communication Plan
- [ ] Announce feature to all users via email
- [ ] Update user guide and FAQ
- [ ] Create "What's New" announcement in app
- [ ] Schedule Q&A sessions for each client
- [ ] Provide support contact information

---

## 🔄 Future Enhancements (Post-Phase 4)

### Potential Features
1. **Quote Templates**: Pre-built templates for common work types
2. **Automatic Pricing**: AI-based cost estimation from description
3. **Multi-Contractor Quotes**: Request quotes from multiple contractors
4. **Budget Integration**: Track quotes against client budgets
5. **Quote Calendar**: Visual timeline of quote validity periods
6. **Advanced Analytics**: Quote trends, approval patterns, cost analysis
7. **Mobile App**: Native iOS/Android app for quotes
8. **Email Integration**: Create quotes from email requests
9. **Payment Integration**: Online payment for approved quotes
10. **Third-Party API**: Allow external systems to create quote requests

---

## 📝 Risk Management

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration failures | High | Low | Test migrations in staging, maintain rollback scripts |
| File upload S3 integration issues | Medium | Medium | Use existing photo service pattern, test thoroughly |
| Performance issues with large quote lists | Medium | Medium | Implement pagination, add database indexes |
| Work order conversion transaction failures | High | Low | Use database transactions, comprehensive error handling |
| Quote expiry job failures | Low | Medium | Add job monitoring, manual override capability |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User adoption slow | Medium | Medium | Comprehensive training, clear documentation |
| Client confusion on approval process | Medium | Medium | Simple UI, confirmation dialogs, training |
| Quote response time SLA not met | High | Low | Staff alerts, dashboard visibility, management oversight |
| Workflow too complex for users | High | Low | User testing before launch, iterative improvements |

---

## ✅ Phase 1 Acceptance Criteria

### Functional Requirements
- [ ] Client admins can create quote requests with all required fields
- [ ] Quotes can be saved as drafts and submitted later
- [ ] WPSG staff can view all pending quotes across all clients
- [ ] WPSG staff can provide quotes with cost/hours/notes
- [ ] WPSG staff can request more information from clients
- [ ] WPSG staff can decline quote requests with reason
- [ ] Client admins can view provided quotes with full details
- [ ] Client admins can approve quotes (confirmation required)
- [ ] Client admins can decline quotes with reason
- [ ] Approved quotes can be converted to work orders by staff
- [ ] Work orders inherit all quote data (property, contact, description)
- [ ] Quote-to-work-order link is bidirectional
- [ ] All quote state changes trigger appropriate notifications
- [ ] Dashboard shows quote summary with status breakdown
- [ ] Quote list supports filtering by status, urgency, date
- [ ] Quote list supports search by quote number, property, description

### Non-Functional Requirements
- [ ] All pages load within performance targets
- [ ] UI is fully responsive (mobile, tablet, desktop)
- [ ] All components follow NextGen WOM brand guidelines
- [ ] WCAG AA accessibility standards met
- [ ] Role-based access control enforced on all endpoints
- [ ] Multi-client data isolation working correctly
- [ ] All API responses follow standardized format
- [ ] Error messages are user-friendly and actionable
- [ ] File uploads work reliably with progress indication
- [ ] No console errors or warnings in browser

### Quality Requirements
- [ ] Code coverage > 80% for backend
- [ ] All integration tests passing
- [ ] All end-to-end tests passing
- [ ] No high or critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Browser compatibility verified (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing complete (iOS, Android)

---

## 📅 Sprint Schedule

### Sprint 1 (Week 1-2): Foundation
- **Days 1-3**: Database schema, models, migrations
- **Days 4-6**: Quote creation and viewing APIs
- **Days 7-8**: Quote request form (frontend)
- **Days 9-10**: Quote list and dashboard widget

### Sprint 2 (Week 3-4): Core Workflow
- **Days 1-2**: Quote provision API
- **Days 3-4**: Quote approval API
- **Days 5-6**: Quote to work order conversion
- **Days 7-8**: Quote detail page and provision form
- **Days 9-10**: Testing, bug fixes, documentation

---

## 🎯 Definition of Done (Phase 1)

A feature is considered DONE when:
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests pass
- [ ] Manual testing complete (desktop + mobile)
- [ ] UI matches NextGen WOM design system
- [ ] Accessibility requirements met
- [ ] API documentation updated
- [ ] User documentation created
- [ ] Deployed to staging
- [ ] Stakeholder demo complete
- [ ] Product Owner approval
- [ ] No critical or high bugs

---

## 📞 Stakeholders & Communication

### Key Stakeholders
- **Product Owner**: Final approval on features
- **VisionWest Client Admin**: Primary user feedback
- **WPSG Staff Lead**: Provider workflow validation
- **Tech Lead**: Architecture and technical decisions
- **QA Lead**: Test strategy and sign-off

### Communication Schedule
- **Daily Standups**: 15 min, team sync
- **Sprint Planning**: Start of each sprint, plan work
- **Sprint Review**: End of each sprint, demo to stakeholders
- **Sprint Retrospective**: End of each sprint, team improvement
- **Weekly Progress Update**: Email to all stakeholders

---

**Plan Created**: 2025-11-01  
**Last Updated**: 2025-11-01  
**Status**: Ready for Implementation  
**Next Step**: Sprint 1 Kickoff Meeting

