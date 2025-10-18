# Manual Work Order Entry - Testing Guide

**Feature**: 001-manual-work-order-entry
**Test Date**: 2025-10-18
**Status**: Ready for Testing

## Overview

This guide provides step-by-step instructions to test the manual work order creation feature with the updated requirements:
1. Williams Property Service is the default supplier (auto-filled)
2. Property address and phone are now mandatory
3. Authorized by contact details auto-populate from logged-in user
4. Before photos can be uploaded during work order creation

---

## Pre-requisites

- [ ] Backend server running on http://localhost:5002
- [ ] Frontend server running on http://localhost:5173
- [ ] Test user account with `client_admin` role
- [ ] Sample images for photo upload testing (JPEG/PNG, under 5MB each)

**Test Credentials** (use your client_admin account):
- Email: `admin@williamspropertyservices.co.nz` (or your test account)
- Password: (your password)

---

## Test Case 1: Form Field Validation

### Objective
Verify that the form properly validates all required fields and supplier fields are hidden.

### Steps
1. Log in with client_admin credentials
2. Navigate to "Create Work Order" page
3. Observe the form layout

### Expected Results
- ✅ **Job Number** field is visible and marked as required (*)
- ✅ **Property Name** field is visible and marked as required (*)
- ✅ **Property Address** field is visible and marked as required (*)
- ✅ **Property Phone** field is visible and marked as required (*)
- ✅ **Description** field is visible and marked as required (*)
- ✅ **Supplier fields** (name, phone, email) are NOT visible in the form
- ✅ Form shows sections: "Required Information", "Before Photos", "Authorization Details"

### Test Data
N/A - Visual inspection only

---

## Test Case 2: Auto-populated Authorized By Fields

### Objective
Verify that authorized by contact details are automatically populated from the logged-in user's profile.

### Steps
1. Log in with client_admin credentials
2. Navigate to "Create Work Order" page
3. Scroll to "Authorization Details" section
4. Observe the "Authorized By", "Authorized Contact", and "Authorized Email" fields

### Expected Results
- ✅ **Authorized By** field is pre-filled with your full name
- ✅ **Authorized Contact** field is pre-filled with your phone number (if available in profile)
- ✅ **Authorized Email** field is pre-filled with your email address
- ✅ Blue info box displays: "Authorization details are automatically filled with your profile information..."
- ✅ Fields are editable (you can still modify them if needed)

### Test Data
- Expected values should match your user profile data

---

## Test Case 3: Required Field Validation

### Objective
Verify that the form prevents submission when required fields are missing.

### Steps
1. Navigate to "Create Work Order" page
2. Leave all fields empty
3. Click "Create Work Order" button
4. Observe validation errors
5. Fill in Job Number only, click submit again
6. Continue filling fields one by one

### Expected Results
- ✅ Form displays validation errors for missing required fields
- ✅ Error message appears: "Job number is required" when job_no is empty
- ✅ Error message appears: "Property name is required" when property_name is empty
- ✅ Error message appears: "Property address is required" when property_address is empty
- ✅ Error message appears: "Property phone is required" when property_phone is empty
- ✅ Error message appears: "Description is required" when description is empty
- ✅ Form cannot be submitted until all required fields are filled

### Test Data
- Test by leaving fields empty

---

## Test Case 4: Create Work Order Without Photos

### Objective
Verify that a work order can be created successfully without uploading photos.

### Steps
1. Navigate to "Create Work Order" page
2. Fill in all required fields:
   - **Job Number**: `TEST-WO-001`
   - **Property Name**: `Sunset Apartments - Unit 4B`
   - **Property Address**: `123 Main Street, Auckland 1010`
   - **Property Phone**: `09 987 6543`
   - **Description**: `Leaking faucet in kitchen sink. Water dripping constantly.`
3. Leave optional fields (PO Number) empty
4. Do NOT upload any photos
5. Click "Create Work Order" button

### Expected Results
- ✅ Success toast message: "Work order created successfully"
- ✅ Redirects to work orders list page after ~1.5 seconds
- ✅ New work order appears in the list with job number `TEST-WO-001`
- ✅ Work order has `work_order_type: 'manual'` indicator
- ✅ Supplier is automatically set to "Williams Property Service"
- ✅ Supplier phone is "021 123 4567"
- ✅ Supplier email is "info@williamspropertyservices.co.nz"

### Verification
Check backend logs for:
```
Creating manual work order: { job_no: 'TEST-WO-001', property_name: '...', property_address: '...', property_phone: '...' }
Manual work order created: [ID]
```

---

## Test Case 5: Create Work Order With Before Photos

### Objective
Verify that photos can be uploaded during work order creation and are properly associated with the work order.

### Steps
1. Navigate to "Create Work Order" page
2. Fill in all required fields:
   - **Job Number**: `TEST-WO-002`
   - **Property Name**: `Riverside Tower - Unit 12A`
   - **Property Address**: `456 River Road, Wellington 6011`
   - **Property Phone**: `04 555 1234`
   - **Description**: `Broken window in living room. Glass cracked.`
3. Scroll to "Before Photos" section
4. Click "Gallery" button
5. Select 2-3 images from your computer
6. Verify photos appear in preview grid
7. Click "Create Work Order" button

### Expected Results
- ✅ Selected photos display in a preview grid (3 columns)
- ✅ Each photo preview shows thumbnail image
- ✅ Each photo has a red "X" button to remove it
- ✅ Photo count displays: "Selected Photos (3)" or similar
- ✅ Blue tip box explains: "Upload photos documenting the initial state..."
- ✅ Success toast message: "Work order and photos uploaded successfully"
- ✅ Redirects to work orders list page
- ✅ New work order `TEST-WO-002` appears in the list

### Verification
1. Click on the created work order to view details
2. Verify photos appear in the work order detail page
3. Check backend logs for:
```
Creating manual work order: { job_no: 'TEST-WO-002', ... }
Manual work order created: [ID]
Uploading 3 photos for work order [ID]
```

---

## Test Case 6: Photo Validation

### Objective
Verify that photo upload validates file types and sizes.

### Steps
1. Navigate to "Create Work Order" page
2. Try to upload non-image files (e.g., .pdf, .docx)
3. Try to upload very large images (> 5MB)

### Expected Results
- ✅ Alert displays: "Only image files are allowed" for non-image files
- ✅ Alert displays: "Image file size must be less than 5MB" for large files
- ✅ Invalid files are not added to preview grid
- ✅ Valid image files (JPEG, PNG, GIF) under 5MB are accepted

### Test Data
- Valid: .jpg, .jpeg, .png, .gif files under 5MB
- Invalid: .pdf, .docx, .txt files, or images over 5MB

---

## Test Case 7: Remove Selected Photos

### Objective
Verify that selected photos can be removed before submission.

### Steps
1. Navigate to "Create Work Order" page
2. Upload 3-4 photos using "Gallery" button
3. Click the red "X" button on one of the photo previews
4. Verify the photo is removed from the grid
5. Add another photo
6. Remove all photos one by one

### Expected Results
- ✅ Clicking "X" removes the photo from preview grid immediately
- ✅ Photo count updates correctly: "Selected Photos (2)", "Selected Photos (1)", etc.
- ✅ When all photos are removed, the count section disappears
- ✅ Can add photos again after removing them
- ✅ No memory leaks (object URLs are properly revoked)

---

## Test Case 8: Camera Capture (Mobile/Desktop with Webcam)

### Objective
Verify that the camera capture functionality works on devices with cameras.

### Steps
1. Open the application on a mobile device or desktop with webcam
2. Navigate to "Create Work Order" page
3. Scroll to "Before Photos" section
4. Click "Camera" button
5. Grant camera permissions if prompted
6. Take a photo using the camera
7. Accept the photo

### Expected Results
- ✅ Camera interface opens (native camera on mobile, webcam on desktop)
- ✅ Permission prompt appears if not previously granted
- ✅ Captured photo appears in preview grid
- ✅ Photo can be removed using "X" button
- ✅ Multiple photos can be captured

### Note
This test requires a device with a camera. On desktop without webcam, the button may trigger file picker instead.

---

## Test Case 9: Backend Default Values

### Objective
Verify that backend correctly sets default supplier details and auto-fills authorized by information.

### Steps
1. Create a work order using Test Case 4 or 5
2. Open browser DevTools Network tab
3. Find the POST request to `/api/work-orders/manual`
4. Examine the response payload

### Expected Results
Backend response includes:
```json
{
  "success": true,
  "message": "Work order created successfully",
  "data": {
    "id": [number],
    "job_no": "TEST-WO-XXX",
    "status": "pending",
    "work_order_type": "manual",
    ...
  }
}
```

### Database Verification
Check the database record:
- ✅ `supplier_name` = "Williams Property Service"
- ✅ `supplier_phone` = "021 123 4567"
- ✅ `supplier_email` = "info@williamspropertyservices.co.nz"
- ✅ `authorized_by` = your full name
- ✅ `authorized_contact` = your phone number
- ✅ `authorized_email` = your email address
- ✅ `property_address` is NOT NULL
- ✅ `property_phone` is NOT NULL
- ✅ `work_order_type` = "manual"
- ✅ `status` = "pending"

---

## Test Case 10: Edit Authorization Details

### Objective
Verify that auto-populated authorization details can be edited before submission.

### Steps
1. Navigate to "Create Work Order" page
2. Observe the auto-populated authorization fields
3. Modify "Authorized By" to a different name: `Jane Smith`
4. Modify "Authorized Contact" to: `09 555 9999`
5. Modify "Authorized Email" to: `jane.smith@example.com`
6. Fill in required fields and create work order

### Expected Results
- ✅ Fields accept new values (are editable)
- ✅ Work order is created with modified values
- ✅ Database record shows:
  - `authorized_by` = "Jane Smith"
  - `authorized_contact` = "09 555 9999"
  - `authorized_email` = "jane.smith@example.com"

---

## Test Case 11: Duplicate Job Number Prevention

### Objective
Verify that the system prevents creating work orders with duplicate job numbers.

### Steps
1. Create a work order with job number `TEST-DUPLICATE-001`
2. Try to create another work order with the same job number `TEST-DUPLICATE-001`

### Expected Results
- ✅ Error toast displays: "Work order with job number TEST-DUPLICATE-001 already exists"
- ✅ Form is not submitted
- ✅ User remains on create work order page
- ✅ No duplicate work order is created in database

---

## Test Case 12: Role-Based Access Control

### Objective
Verify that only users with `client_admin` role can access manual work order creation.

### Steps
1. Log out of the application
2. Log in with a regular `client` role user
3. Try to navigate to `/create-work-order` URL directly
4. Observe the behavior

### Expected Results
- ✅ Regular client users cannot see "Create Work Order" button in UI
- ✅ Direct URL access shows error: "You do not have permission to create work orders"
- ✅ User is redirected to work orders list page after 2 seconds
- ✅ Error toast displays permission message

---

## Test Case 13: Photo Upload Failure Handling

### Objective
Verify that the system handles photo upload failures gracefully.

### Steps
1. Fill in all required work order fields
2. Upload 2-3 photos
3. Temporarily stop the backend server (simulate photo upload failure)
4. Click "Create Work Order" button

### Expected Results
- ✅ Work order is created successfully
- ✅ Warning toast displays: "Work order created, but some photos failed to upload"
- ✅ User is redirected to work orders list
- ✅ Work order exists in the system (without photos)
- ✅ Console shows error: "Error uploading photos: ..."

### Note
Restart backend server after this test.

---

## Test Case 14: Mobile Responsiveness

### Objective
Verify that the manual work order form works correctly on mobile devices.

### Steps
1. Open the application on a mobile device (or use browser DevTools mobile emulation)
2. Navigate to "Create Work Order" page
3. Test all form interactions:
   - Filling text fields
   - Selecting photos from gallery
   - Capturing photos with camera
   - Scrolling through the form
   - Submitting the form

### Expected Results
- ✅ Form is fully responsive and usable on mobile screens
- ✅ All fields are easily tappable (adequate touch targets)
- ✅ Photo preview grid adjusts to mobile screen (3 columns)
- ✅ Buttons are appropriately sized for mobile
- ✅ Camera capture works on mobile devices
- ✅ No horizontal scrolling required
- ✅ Form submission works correctly

---

## Test Case 15: Notifications After Work Order Creation

### Objective
Verify that notifications are sent after manual work order creation.

### Steps
1. Create a manual work order (with or without photos)
2. Check notifications for:
   - The creating user
   - Other staff users
   - Admin users

### Expected Results
- ✅ In-app notification is created
- ✅ Email notification is sent to relevant users
- ✅ Notification title: "New Work Order Created (Manual)"
- ✅ Notification message includes: job number and creator name
- ✅ Backend logs show: "✅ In-app notification created for manual work order"
- ✅ Backend logs show: "✅ Email notification sent for manual work order"

---

## Post-Testing Checklist

After completing all test cases:

- [ ] All required fields validation works correctly
- [ ] Property address and phone are mandatory
- [ ] Supplier fields are hidden (auto-filled in backend)
- [ ] Authorized by details auto-populate from user profile
- [ ] Photos can be uploaded and previewed
- [ ] Photo validation works (file type and size)
- [ ] Work orders are created with correct default values
- [ ] Williams Property Service is set as default supplier
- [ ] Work order type is set to "manual"
- [ ] Duplicate job numbers are prevented
- [ ] Role-based access control works
- [ ] Photo upload failures are handled gracefully
- [ ] Mobile responsiveness is adequate
- [ ] Notifications are sent correctly

---

## Known Issues / Notes

_Document any issues found during testing here:_

1.
2.
3.

---

## Test Results Summary

**Test Date**: _____________
**Tested By**: _____________
**Test Environment**: _____________

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Form Field Validation | ⬜ Pass / ⬜ Fail | |
| TC2: Auto-populated Fields | ⬜ Pass / ⬜ Fail | |
| TC3: Required Field Validation | ⬜ Pass / ⬜ Fail | |
| TC4: Create WO Without Photos | ⬜ Pass / ⬜ Fail | |
| TC5: Create WO With Photos | ⬜ Pass / ⬜ Fail | |
| TC6: Photo Validation | ⬜ Pass / ⬜ Fail | |
| TC7: Remove Photos | ⬜ Pass / ⬜ Fail | |
| TC8: Camera Capture | ⬜ Pass / ⬜ Fail / ⬜ N/A | |
| TC9: Backend Default Values | ⬜ Pass / ⬜ Fail | |
| TC10: Edit Auth Details | ⬜ Pass / ⬜ Fail | |
| TC11: Duplicate Prevention | ⬜ Pass / ⬜ Fail | |
| TC12: Role-Based Access | ⬜ Pass / ⬜ Fail | |
| TC13: Photo Upload Failure | ⬜ Pass / ⬜ Fail | |
| TC14: Mobile Responsiveness | ⬜ Pass / ⬜ Fail | |
| TC15: Notifications | ⬜ Pass / ⬜ Fail | |

**Overall Result**: ⬜ All Tests Passed / ⬜ Some Tests Failed

---

## Quick Test Script

For quick smoke testing, run these minimal steps:

1. **Login** as client_admin
2. **Navigate** to Create Work Order page
3. **Verify** form shows required fields, hidden supplier fields, auto-populated auth fields
4. **Fill** required fields: job number, property name, address, phone, description
5. **Upload** 2 photos
6. **Submit** form
7. **Verify** success message and work order appears in list
8. **View** work order details and confirm photos are attached

If all steps pass ✅, basic functionality is working correctly.
