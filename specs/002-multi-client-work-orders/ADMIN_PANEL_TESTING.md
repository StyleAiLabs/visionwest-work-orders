# Admin Panel Testing Guide

## Test Environment Setup

**Prerequisites:**
- Backend running on http://localhost:5002
- Frontend running on http://localhost:5173
- Test admin credentials:
  - Email: `admin@williamspropertyservices.co.nz`
  - Password: `password123`

---

## Test Scenarios

### 1. Authentication & Access Control

#### Test 1.1: Admin Login and Redirect
- [ ] Navigate to http://localhost:5173/admin while logged out
- [ ] Verify redirect to /login
- [ ] Login with admin credentials
- [ ] Verify redirect back to /admin
- [ ] Expected: Admin Panel loads successfully

#### Test 1.2: Non-Admin Access Prevention
- [ ] Login as non-admin user (if available)
- [ ] Try to access /admin
- [ ] Expected: Redirect to /dashboard

#### Test 1.3: Session Persistence
- [ ] Login as admin and access /admin
- [ ] Refresh the page
- [ ] Expected: Remain on admin panel (no logout)

---

### 2. Navigation Testing

#### Test 2.1: Dashboard to Admin Panel
- [ ] Login as admin
- [ ] Go to Dashboard
- [ ] Verify shield icon visible in header (with purple indicator)
- [ ] Click shield icon
- [ ] Expected: Navigate to /admin

#### Test 2.2: Admin Panel to Dashboard
- [ ] On Admin Panel
- [ ] Click back arrow (top left)
- [ ] Expected: Navigate to /dashboard

#### Test 2.3: Admin Panel to Settings
- [ ] On Admin Panel
- [ ] Click settings gear icon (top right)
- [ ] Expected: Navigate to /settings

#### Test 2.4: Settings to Admin Panel
- [ ] On Settings page (as admin)
- [ ] Scroll to "Administration" section
- [ ] Verify "Admin Panel" button visible
- [ ] Click "Admin Panel" button
- [ ] Expected: Navigate to /admin

---

### 3. Client List Display

#### Test 3.1: Initial Load
- [ ] Navigate to /admin
- [ ] Verify client list loads
- [ ] Verify "Visionwest" client displayed
- [ ] Verify client card shows:
  - Client name
  - Client code (VISIONWEST)
  - Status badge (Active)
  - User count
  - Work order count

#### Test 3.2: Empty State (if no clients)
- [ ] If no clients exist
- [ ] Verify "No clients found" message
- [ ] Verify "Create Client" button visible

#### Test 3.3: Loading State
- [ ] Refresh page
- [ ] Observe loading spinner
- [ ] Expected: Spinner displays while loading

---

### 4. Search Functionality

#### Test 4.1: Search by Name
- [ ] Type "Vision" in search box
- [ ] Expected: Visionwest client displayed
- [ ] Type "xyz" (non-existent)
- [ ] Expected: "No clients found" with "Clear filters" button

#### Test 4.2: Search by Code
- [ ] Type "VISION" in search box
- [ ] Expected: Visionwest client displayed
- [ ] Clear search
- [ ] Expected: All clients displayed

#### Test 4.3: Search Clear
- [ ] Enter search term with no results
- [ ] Click "Clear filters" button
- [ ] Expected: Search cleared, all clients displayed

---

### 5. Filter Functionality

#### Test 5.1: Filter by Status
- [ ] Select "Active" from status dropdown
- [ ] Expected: Only active clients displayed
- [ ] Select "Inactive"
- [ ] Expected: Only inactive clients (or none)
- [ ] Select "Archived"
- [ ] Expected: Only archived clients (or none)
- [ ] Select "All Status"
- [ ] Expected: All clients displayed

#### Test 5.2: Combined Search and Filter
- [ ] Enter search term
- [ ] Select status filter
- [ ] Expected: Both filters applied
- [ ] Clear filters
- [ ] Expected: All clients displayed

---

### 6. Create Client Functionality

#### Test 6.1: Open Create Form
- [ ] Click "Create Client" button
- [ ] Expected: Full-screen modal opens
- [ ] Verify form fields:
  - Client Name (required)
  - Client Code (required)
  - Primary Contact Name
  - Primary Contact Email
  - Primary Contact Phone
  - Status dropdown

#### Test 6.2: Form Validation - Required Fields
- [ ] Leave Client Name empty
- [ ] Leave Client Code empty
- [ ] Click "Create Client"
- [ ] Expected: Validation errors displayed

#### Test 6.3: Form Validation - Code Format
- [ ] Enter "test client" in Client Code (lowercase)
- [ ] Tab out or blur field
- [ ] Expected: Code auto-converts to "TEST CLIENT" (uppercase)
- [ ] Try special characters: "test@#$"
- [ ] Expected: Validation error (alphanumeric, underscore, hyphen only)

#### Test 6.4: Form Validation - Email Format
- [ ] Enter invalid email: "notanemail"
- [ ] Tab out
- [ ] Expected: Email validation error

#### Test 6.5: Successful Client Creation
- [ ] Fill form with valid data:
  - Name: "Test Client Organization"
  - Code: "TESTCLIENT"
  - Contact Name: "John Doe"
  - Contact Email: "john@test.com"
  - Contact Phone: "021 123 4567"
  - Status: "active"
- [ ] Click "Create Client"
- [ ] Expected:
  - Success message
  - Modal closes
  - New client appears in list
  - Client card shows correct data

#### Test 6.6: Duplicate Code Prevention
- [ ] Try to create client with code "VISIONWEST"
- [ ] Expected: Error message about duplicate code

#### Test 6.7: Cancel Creation
- [ ] Click "Create Client"
- [ ] Fill some fields
- [ ] Click "Cancel" or X button
- [ ] Expected: Modal closes, no client created

---

### 7. Edit Client Functionality

#### Test 7.1: Open Edit Form
- [ ] Click on any client card
- [ ] Expected: Edit form opens
- [ ] Verify form pre-filled with client data
- [ ] Verify "Edit Client" title

#### Test 7.2: Code Field Immutability
- [ ] In edit form
- [ ] Try to edit Client Code field
- [ ] Expected: Field is disabled/read-only

#### Test 7.3: Update Client Name
- [ ] Change Client Name
- [ ] Click "Update Client"
- [ ] Expected:
  - Success message
  - Modal closes
  - Client list updates with new name

#### Test 7.4: Update Contact Information
- [ ] Edit Primary Contact Name
- [ ] Edit Primary Contact Email
- [ ] Edit Primary Contact Phone
- [ ] Click "Update Client"
- [ ] Expected: All changes saved

#### Test 7.5: Update Status
- [ ] Change status from "active" to "inactive"
- [ ] Click "Update Client"
- [ ] Expected:
  - Client updated
  - Status badge reflects new status

#### Test 7.6: Cancel Edit
- [ ] Open edit form
- [ ] Make changes
- [ ] Click "Cancel"
- [ ] Expected: Changes discarded, modal closes

---

### 8. Delete Client Functionality

#### Test 8.1: Delete Confirmation Modal
- [ ] Click on delete icon on a client card
- [ ] Expected: Confirmation modal appears
- [ ] Verify modal shows:
  - Warning icon
  - Client name
  - Warning message
  - Cancel and Delete buttons

#### Test 8.2: Cancel Deletion
- [ ] Open delete confirmation
- [ ] Click "Cancel"
- [ ] Expected: Modal closes, client not deleted

#### Test 8.3: Prevent Deletion with Active Users
- [ ] Try to delete Visionwest client (has users)
- [ ] Click "Delete"
- [ ] Expected: Error message showing user count and work order count

#### Test 8.4: Successful Deletion
- [ ] Create a new test client (no users/work orders)
- [ ] Delete the test client
- [ ] Click "Delete"
- [ ] Expected:
  - Client status changes to "archived"
  - Client removed from active list (or shown as archived)

#### Test 8.5: Visionwest Protection
- [ ] Try to delete Visionwest client
- [ ] Expected: Special warning message about Visionwest client

---

### 9. Responsive Design Testing

#### Test 9.1: Mobile View (320px - 768px)
- [ ] Resize browser to 375px width
- [ ] Verify:
  - Client cards stack vertically (1 column)
  - Search and filter controls responsive
  - Create button full-width
  - Form modal full-screen
  - Touch-friendly button sizes

#### Test 9.2: Tablet View (768px - 1024px)
- [ ] Resize to 768px width
- [ ] Verify:
  - Client cards in 2-column grid
  - Header elements properly spaced
  - Form modal adequate width

#### Test 9.3: Desktop View (1024px+)
- [ ] Resize to 1440px width
- [ ] Verify:
  - Client cards in 3-column grid
  - Maximum width constraint (max-w-7xl)
  - Proper spacing and alignment

---

### 10. Error Handling

#### Test 10.1: Network Error
- [ ] Stop backend server
- [ ] Try to create/update/delete client
- [ ] Expected: User-friendly error message

#### Test 10.2: Invalid Data Response
- [ ] (Backend testing) Send invalid data
- [ ] Expected: Validation errors displayed

#### Test 10.3: Session Expiration
- [ ] Wait for JWT to expire (or manually clear token)
- [ ] Try to perform action
- [ ] Expected: Redirect to login

---

### 11. Performance Testing

#### Test 11.1: Large Dataset
- [ ] Create 50+ clients (use script if available)
- [ ] Verify pagination works
- [ ] Verify search performance
- [ ] Verify scroll performance

#### Test 11.2: Rapid Interactions
- [ ] Quickly open/close modals multiple times
- [ ] Expected: No UI freezing or errors

---

### 12. Integration Testing

#### Test 12.1: Client Creation → User Assignment
- [ ] Create new client
- [ ] Register new user with new client_id
- [ ] Login as new user
- [ ] Verify user sees correct client context

#### Test 12.2: Admin Context Switching (if implemented)
- [ ] Use ClientSwitcher component
- [ ] Switch to different client
- [ ] Verify work orders filtered correctly

---

## Test Results Template

```
## Test Run: [Date/Time]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

### Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

### Failed Tests
1. [Test ID]: [Brief description]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Severity: [Critical/High/Medium/Low]

### Blocked Tests
1. [Test ID]: [Reason for blocking]

### Notes
[Any additional observations]
```

---

## Automated Testing Recommendations

### Backend API Tests
```javascript
// Test client creation
POST /api/clients
- Valid data → 201 Created
- Invalid data → 400 Bad Request
- Duplicate code → 400 Bad Request
- Non-admin user → 403 Forbidden

// Test client retrieval
GET /api/clients
- Admin user → 200 OK with clients
- Non-admin user → 403 Forbidden
- Pagination works → Correct page/limit

// Test client update
PUT /api/clients/:id
- Valid update → 200 OK
- Code change attempt → 400 Bad Request
- Non-existent client → 404 Not Found

// Test client deletion
DELETE /api/clients/:id
- Client with users → 400 Bad Request
- Valid deletion → 200 OK (archived)
```

### Frontend Component Tests
```javascript
// ClientList.test.jsx
- Renders client cards correctly
- Search filters clients
- Status filter works
- Pagination works
- Loading state displays

// ClientForm.test.jsx
- Validation works
- Code auto-uppercase
- Email validation
- Required fields
- Submit/cancel behavior

// AdminPanel.test.jsx
- Renders for admin users
- Navigation buttons work
- Modal open/close
```

---

## Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces elements
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Form labels properly associated
- [ ] Error messages announced

---

## Security Testing

- [ ] Admin-only routes protected
- [ ] Client data properly scoped
- [ ] XSS prevention in form inputs
- [ ] CSRF protection
- [ ] SQL injection prevention
- [ ] JWT validation working
