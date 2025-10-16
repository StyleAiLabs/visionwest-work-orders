# Quickstart Guide: Manual Work Order Entry

**Feature**: Manual Work Order Entry
**Branch**: `001-manual-work-order-entry`
**For**: Developers implementing this feature

## Overview

This feature adds manual work order creation and editing capabilities for users with the `client_admin` role (tenancy managers). The implementation spans both frontend (React forms) and backend (Express API endpoints).

## Prerequisites

Before starting implementation:

1. ✅ Feature specification reviewed (`spec.md`)
2. ✅ Implementation plan reviewed (`plan.md`)
3. ✅ Research findings reviewed (`research.md`)
4. ✅ Data model understood (`data-model.md`)
5. ✅ API contracts reviewed (`contracts/`)
6. ✅ Constitution compliance verified (all gates passed)

## Development Environment Setup

```bash
# Ensure you're on the feature branch
git checkout 001-manual-work-order-entry

# Backend setup
cd backend
npm install
npm run dev  # Starts backend on http://localhost:3001

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev  # Starts frontend on http://localhost:5173
```

## Implementation Phases

### Phase 1: Backend API (P1 - Create Work Order)

**Estimated Time**: 2-3 hours

#### Step 1: Create Route Handler

**File**: `backend/routes/workOrder.routes.js`

```javascript
// Add new route for manual work order creation
router.post('/', verifyToken, isClientAdmin, workOrderController.createManualWorkOrder);
```

#### Step 2: Install and Configure Nodemailer

**Install dependency**:
```bash
cd backend
npm install nodemailer
```

**Add environment variables** to `backend/.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_NOTIFICATION_RECIPIENT=mark@williamspropertyservices.co.nz
```

**Create email utility** `backend/utils/emailService.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendWorkOrderCreatedEmail = async (workOrder, createdBy) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_NOTIFICATION_RECIPIENT,
      subject: `New Work Order Created - ${workOrder.job_no}`,
      html: `
        <h2>New Work Order Created (Manual Entry)</h2>
        <p><strong>Job Number:</strong> ${workOrder.job_no}</p>
        <p><strong>Property:</strong> ${workOrder.property_name}</p>
        <p><strong>Supplier:</strong> ${workOrder.supplier_name}</p>
        <p><strong>Description:</strong> ${workOrder.description}</p>
        <p><strong>Created By:</strong> ${createdBy.full_name}</p>
        <p><strong>Date:</strong> ${workOrder.date}</p>
      `
    });
    console.log('Work order email sent successfully');
  } catch (error) {
    console.error('Failed to send work order email:', error);
    // Don't throw - email failure shouldn't block work order creation
  }
};
```

#### Step 3: Implement Controller Logic

**File**: `backend/controllers/workOrder.controller.js`

Create `createManualWorkOrder` function:
- Validate required fields (job_no, supplier_name, property_name, description)
- Check for duplicate job_no
- Create work order with `work_order_type = 'manual'`
- Set `created_by` to authenticated user ID
- Set `status = 'pending'`
- Send in-app notifications
- **Send email notification (asynchronous)**
- Return success response

In the controller, import the email service and call it after creating the work order:

```javascript
const emailService = require('../utils/emailService');

exports.createManualWorkOrder = async (req, res) => {
  try {
    // ... validation and work order creation logic ...

    // Create work order
    const workOrder = await WorkOrder.create({ /* ... */ });

    // Send notifications
    await notifyUsersAboutWorkOrder(workOrder.id, req.userId);

    // Send email notification (asynchronous, non-blocking)
    const createdBy = await User.findByPk(req.userId);
    emailService.sendWorkOrderCreatedEmail(workOrder, createdBy);

    return res.status(201).json({ /* success response */ });
  } catch (error) {
    // error handling
  }
};
```

**Reference**: See `contracts/create-work-order.md` for full API contract

#### Step 4: Add Role Middleware (if not exists)

**File**: `backend/middleware/auth.middleware.js`

```javascript
exports.isClientAdmin = (req, res, next) => {
    if (req.userRole !== 'client_admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Only tenancy managers (client_admin role) can create manual work orders'
        });
    }
    next();
};
```

#### Step 5: Test Backend Endpoint

```bash
# Test with curl
curl -X POST http://localhost:3001/api/work-orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_no": "TEST-001",
    "supplier_name": "Test Supplier",
    "property_name": "Test Property",
    "description": "Test description"
  }'
```

### Phase 2: Frontend Form (P1 - Create Work Order)

**Estimated Time**: 3-4 hours

#### Step 1: Create Work Order Service

**File**: `frontend/src/services/workOrderService.js`

```javascript
export const createWorkOrder = async (formData) => {
  const response = await fetch('/api/work-orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
};
```

#### Step 2: Create Form Component

**File**: `frontend/src/components/WorkOrderForm.jsx`

Use React Hook Form for state management:
- Implement controlled inputs for all fields
- Add validation for required fields
- Apply Tailwind classes for mobile-first design
- Ensure touch targets are minimum 44x44px (`h-11` class)
- Implement error display for validation failures

**Key Tailwind Classes**:
```jsx
<input
  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:border-blue-500"
  type="text"
  {...register('job_no', { required: true })}
/>
```

#### Step 3: Create Page Component

**File**: `frontend/src/pages/CreateWorkOrder.jsx`

- Import WorkOrderForm component
- Handle form submission
- Display success/error messages
- Navigate back to work order list on success

#### Step 4: Add Route

**File**: `frontend/src/App.jsx` (or router configuration)

```jsx
<Route path="/work-orders/create" element={<CreateWorkOrder />} />
```

#### Step 5: Add "Create" Button

**File**: `frontend/src/pages/WorkOrderList.jsx`

Add floating action button (FAB) for client_admin users only:

```jsx
{user.role === 'client_admin' && (
  <Link
    to="/work-orders/create"
    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
  >
    <PlusIcon className="h-6 w-6" />
  </Link>
)}
```

### Phase 3: Edit Work Order (P2)

**Estimated Time**: 2-3 hours

#### Backend Steps

1. Add PUT route: `router.put('/:id', verifyToken, isClientAdmin, workOrderController.editWorkOrder)`
2. Implement `editWorkOrder` controller function
3. Compare old vs. new values, create audit trail note
4. Send update notifications

**Reference**: See `contracts/edit-work-order.md`

#### Frontend Steps

1. Create `EditWorkOrder.jsx` page component
2. Fetch existing work order data
3. Pre-populate WorkOrderForm with existing data
4. Add route: `/work-orders/:id/edit`
5. Add "Edit" button on work order detail page (client_admin only)

### Phase 4: Autocomplete (P3 - Enhancement)

**Estimated Time**: 3-4 hours

#### Backend Steps

1. Add GET route: `router.get('/suggestions', verifyToken, workOrderController.getSuggestions)`
2. Implement query with GROUP BY and ORDER BY match_count
3. Return suggestions limited to 10 results

**Reference**: See `contracts/autocomplete-suggestions.md`

#### Frontend Steps

1. Create debounced input handler (300ms delay)
2. Fetch suggestions on input change
3. Display dropdown with suggestions
4. Auto-fill related fields on selection
5. Allow free text entry if no match

## Testing Checklist

### Backend Testing

- [ ] Create work order with all required fields
- [ ] Create work order with optional fields
- [ ] Verify email sent to mark@williamspropertyservices.co.nz after creation
- [ ] Check email contains correct work order details
- [ ] Attempt creation with missing required fields (should fail with 400)
- [ ] Attempt creation with duplicate job_no (should fail with 400)
- [ ] Attempt creation as non-client_admin user (should fail with 403)
- [ ] Edit work order with partial updates
- [ ] Edit work order creates audit trail note
- [ ] Autocomplete returns property suggestions
- [ ] Autocomplete returns supplier suggestions

### Frontend Testing

- [ ] Form validation shows errors for missing required fields
- [ ] Form submission creates work order successfully
- [ ] Success message displays after creation
- [ ] Work order appears in list immediately after creation
- [ ] "Create" button only visible to client_admin users
- [ ] Edit form pre-populates with existing data
- [ ] Edit saves changes successfully
- [ ] Autocomplete dropdown displays suggestions
- [ ] Autocomplete auto-fills related fields on selection

### Mobile Testing (Constitution Requirement)

- [ ] Test on actual iOS device (iPhone)
- [ ] Test on actual Android device
- [ ] Verify responsive breakpoints: 320px, 375px, 390px, 414px
- [ ] Verify touch targets minimum 44x44px
- [ ] Test form usability on 3G connection
- [ ] Verify offline PWA caching of form page

### Integration Testing

- [ ] Verify n8n webhook still works (create email work order)
- [ ] Verify manual and email work orders appear together in list
- [ ] Verify notifications sent to all relevant users
- [ ] Verify work_order_type discriminator shows correct values

## Common Issues & Solutions

### Issue: 403 Forbidden when creating work order

**Solution**: Verify user has `client_admin` role in JWT token. Check backend middleware is correctly extracting role from token.

### Issue: Duplicate job number not detected

**Solution**: Ensure database has UNIQUE constraint on `job_no` column. Check controller performs duplicate check before insert.

### Issue: Form not mobile-friendly

**Solution**: Apply Tailwind mobile-first classes. Use `h-11` or `p-3` for minimum 44px touch targets. Test on actual device, not just browser devtools.

### Issue: Autocomplete too slow

**Solution**: Add database indexes on `property_name` and `supplier_name`. Increase debounce delay to 500ms. Consider caching frequent suggestions.

## File Checklist

### Backend Files

- [ ] `backend/routes/workOrder.routes.js` - New routes
- [ ] `backend/controllers/workOrder.controller.js` - New controller functions
- [ ] `backend/middleware/auth.middleware.js` - Role check middleware
- [ ] `backend/utils/emailService.js` - Email notification utility
- [ ] `backend/utils/notificationHelper.js` - Extracted notification functions (optional refactor)
- [ ] `backend/.env` - Email configuration environment variables

### Frontend Files

- [ ] `frontend/src/pages/CreateWorkOrder.jsx` - New page
- [ ] `frontend/src/pages/EditWorkOrder.jsx` - New page
- [ ] `frontend/src/pages/WorkOrderList.jsx` - Updated (add FAB button)
- [ ] `frontend/src/components/WorkOrderForm.jsx` - New reusable form component
- [ ] `frontend/src/services/workOrderService.js` - New/updated service

### Database

- [ ] Optional: Add index on `work_order_type` column
- [ ] Optional: Add indexes on `property_name` and `supplier_name` (for autocomplete performance)

## Next Steps After Implementation

1. **Run `/speckit.tasks`** to generate detailed task breakdown
2. **Implement tasks in priority order** (P1 → P2 → P3)
3. **Test each user story independently** before moving to next
4. **Deploy to staging** and validate PWA functionality
5. **Get stakeholder approval** on MVP (P1) before continuing to P2/P3

## Reference Documentation

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Findings](./research.md)
- [Data Model](./data-model.md)
- [API Contract - Create](./contracts/create-work-order.md)
- [API Contract - Edit](./contracts/edit-work-order.md)
- [API Contract - Autocomplete](./contracts/autocomplete-suggestions.md)
- [Project Constitution](../.specify/memory/constitution.md)
- [n8n Webhook Contract](../../integration/n8n-webhook-contract.md)

## Questions or Issues?

Refer back to the constitution for architectural decisions and principles. All implementation choices should align with the 5 core principles, especially:

1. Mobile-First Design (test on real devices)
2. Progressive Enhancement (PWA caching)
3. Integration Integrity (don't break n8n webhook)
4. User Story-Driven (implement P1 first)
5. Security & Data Protection (enforce client_admin role)
