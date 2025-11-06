# Implementation Tasks: Quote Creation with Attachments & Image Gallery

**Feature**: 006-quote-create-attachments
**Branch**: `006-quote-create-attachments`
**Status**: Ready for Implementation

---

## Phase 1: P1 - Basic Attachment Upload During Creation (Must Have)

### Backend Tasks

- [ ] **T001**: Review existing attachment upload endpoint (`POST /api/quotes/:id/attachments`) to understand current implementation
- [ ] **T002**: Verify attachment upload works with newly created draft quotes (quote ID available immediately after creation)
- [ ] **T003**: Test attachment persistence when quote is in 'Draft' status
- [ ] **T004**: Verify attachment associations are maintained during quote submission (Draft → Submitted status change)

### Frontend Tasks - QuoteRequestForm Enhancement

- [ ] **T005**: Create local state in QuoteRequestForm to track uploaded attachments before quote is created
- [ ] **T006**: Add "Attachments" section to QuoteRequestForm below "Additional Details" section
- [ ] **T007**: Implement file input with same validation as QuoteAttachments component (file types, size limits)
- [ ] **T008**: Add file selection handler with client-side validation (10MB limit, allowed file types)
- [ ] **T009**: Implement upload flow: Save draft first (if new quote) → Get quote ID → Upload attachments
- [ ] **T010**: Add upload progress indicator for each file being uploaded
- [ ] **T011**: Store uploaded attachment metadata in component state after successful upload
- [ ] **T012**: Display uploaded files list (simple text list with filename and size for P1)
- [ ] **T013**: Disable Submit and Save Draft buttons while uploads are in progress
- [ ] **T014**: Handle upload errors with toast notifications (file too large, invalid type, network error)
- [ ] **T015**: Ensure attachments persist when user clicks "Save Draft"
- [ ] **T016**: Ensure attachments are included when user clicks "Submit" directly

### Testing Tasks

- [ ] **T017**: Test creating new quote with attachments and submitting directly (no draft save)
- [ ] **T018**: Test creating new quote, uploading attachments, saving as draft, then submitting later
- [ ] **T019**: Test uploading files at maximum size limit (9.9MB)
- [ ] **T020**: Test uploading maximum number of files (5 files)
- [ ] **T021**: Test file type validation (attempt invalid file type upload)
- [ ] **T022**: Test network error handling during upload
- [ ] **T023**: Verify attachments are visible in QuoteDetailPage after quote submission

---

## Phase 2: P2 - Image Thumbnail Gallery (Should Have)

### Frontend Tasks - Thumbnail Gallery Component

- [X] **T024**: Create ThumbnailGallery component for displaying uploaded images as thumbnails
- [X] **T025**: Implement thumbnail rendering for image files (JPG, PNG, GIF, WebP)
- [X] **T026**: Implement icon + filename display for non-image files (PDF, Word, Excel, Text)
- [X] **T027**: Add CSS grid layout for responsive thumbnail gallery (2-4 columns depending on screen size)
- [X] **T028**: Implement thumbnail sizing (consistent dimensions, e.g., 150x150px with object-fit cover)
- [X] **T029**: Add loading state for thumbnail images
- [X] **T030**: Handle broken image URLs gracefully (fallback to file icon)

### Frontend Tasks - Thumbnail Interaction

- [X] **T031**: Make thumbnails clickable to open full-size image in new tab
- [X] **T032**: Add hover effect on thumbnails (scale, shadow, or border highlight)
- [X] **T033**: Display filename overlay or tooltip on hover
- [X] **T034**: Add file size and upload timestamp below each thumbnail

### Frontend Tasks - Integration

- [X] **T035**: Replace simple file list in QuoteRequestForm with ThumbnailGallery component
- [X] **T036**: Pass uploaded attachments data to ThumbnailGallery component
- [X] **T037**: Ensure gallery updates in real-time as new files are uploaded
- [X] **T038**: Test gallery layout with various combinations (all images, mixed images/documents, all documents)

### Testing Tasks

- [X] **T039**: Test gallery with 5 images of different sizes and aspect ratios
- [X] **T040**: Test gallery with 2 images and 3 PDFs (mixed content)
- [X] **T041**: Test thumbnail click to open full-size image
- [X] **T042**: Test responsive layout on mobile, tablet, and desktop screen sizes
- [X] **T043**: Test gallery with very large image files (4000x3000px)

---

## Phase 3: P3 - Attachment Management During Creation (Could Have)

### Frontend Tasks - Delete Functionality

- [X] **T044**: Add delete button/icon to each file in the attachment list/gallery
- [X] **T045**: Implement delete handler that calls `DELETE /api/quotes/attachments/:id` endpoint
- [X] **T046**: Show confirmation dialog before deleting attachment ("Are you sure?")
- [X] **T047**: Remove deleted attachment from component state after successful deletion
- [X] **T048**: Update attachment counter after deletion
- [X] **T049**: Handle delete errors with toast notifications

### Frontend Tasks - Upload Limits

- [X] **T050**: Track number of uploaded attachments in component state
- [X] **T051**: Disable file input when 5 attachments are already uploaded
- [X] **T052**: Show warning message when attempting to exceed 5-file limit
- [X] **T053**: Update UI to show available upload slots (e.g., "3 of 5 files uploaded")

### Frontend Tasks - Navigation Warnings

- [X] **T054**: Add unsaved changes warning when user has uploaded files but hasn't saved draft
- [X] **T055**: Implement browser "beforeunload" event handler to warn about losing uploads
- [X] **T056**: Show confirmation dialog when user clicks "Cancel" with uploaded attachments
- [X] **T057**: Remove beforeunload handler after successful save or submit

### Testing Tasks

- [X] **T058**: Test deleting single attachment from gallery
- [X] **T059**: Test deleting all attachments and re-uploading
- [X] **T060**: Test hitting 5-file limit and attempting to upload more
- [X] **T061**: Test navigation warning when closing browser tab with uploaded files
- [X] **T062**: Test cancel button warning dialog functionality
- [X] **T063**: Verify warning is removed after successful save/submit

---

## Phase 4: Code Refactoring & Reusability (Optional)

### Refactoring Tasks

- [ ] **T064**: Extract common attachment logic from QuoteAttachments component into reusable hook (useAttachments)
- [ ] **T065**: Create shared AttachmentGallery component usable in both creation and edit modes
- [ ] **T066**: Refactor file upload logic into reusable service function
- [ ] **T067**: Consolidate attachment state management (consider using React Context if complexity grows)
- [ ] **T068**: Extract file validation logic into utility functions (validateFileType, validateFileSize)
- [ ] **T069**: Update QuoteAttachments component to use refactored shared components
- [ ] **T070**: Ensure QuoteDetailPage still works correctly with refactored components

### Testing Tasks

- [ ] **T071**: Regression test QuoteDetailPage attachment upload after refactoring
- [ ] **T072**: Test attachment functionality in both creation and edit modes after refactoring
- [ ] **T073**: Verify no duplicate code between creation and edit attachment flows

---

## Phase 5: Edge Cases & Error Handling

### Edge Case Tasks

- [ ] **T074**: Handle session expiration during file upload (redirect to login, preserve draft state)
- [ ] **T075**: Handle upload success but quote save failure (retry mechanism or orphan attachment cleanup)
- [ ] **T076**: Handle duplicate filename uploads (append timestamp or counter to filename)
- [ ] **T077**: Support non-standard image formats (.webp, .svg) if MIME type is valid
- [ ] **T078**: Handle concurrent uploads (multiple files uploading simultaneously)
- [ ] **T079**: Implement upload retry mechanism for network failures
- [ ] **T080**: Handle backend S3 upload failures gracefully
- [ ] **T081**: Clean up orphaned attachments (attachments uploaded but quote never submitted/saved)

### Testing Tasks

- [ ] **T082**: Simulate session expiration during upload
- [ ] **T083**: Simulate network interruption mid-upload
- [ ] **T084**: Test uploading two files with identical names
- [ ] **T085**: Test uploading .webp and .svg image formats
- [ ] **T086**: Test uploading 5 files simultaneously
- [ ] **T087**: Verify orphaned attachments are cleaned up (background job or scheduled task)

---

## Phase 6: Accessibility & UX Polish

### Accessibility Tasks

- [ ] **T088**: Add proper ARIA labels to file input and upload buttons
- [ ] **T089**: Ensure keyboard navigation works for file input and delete buttons
- [ ] **T090**: Add screen reader announcements for upload progress and completion
- [ ] **T091**: Ensure thumbnail gallery is navigable with keyboard (tab through thumbnails)
- [ ] **T092**: Add alt text for thumbnail images
- [ ] **T093**: Ensure focus management after file deletion

### UX Polish Tasks

- [ ] **T094**: Add drag-and-drop file upload support
- [ ] **T095**: Add file preview before upload (show selected files before clicking "Upload")
- [ ] **T096**: Animate thumbnail appearance when upload completes
- [ ] **T097**: Add success animation/checkmark when file uploads successfully
- [ ] **T098**: Improve upload progress indicator (show percentage or progress bar)
- [ ] **T099**: Add empty state message in attachments section ("No files uploaded yet")
- [ ] **T100**: Add helpful tooltips for file size/type requirements

### Testing Tasks

- [ ] **T101**: Test screen reader compatibility with attachment upload flow
- [ ] **T102**: Test keyboard-only navigation through entire quote creation with attachments
- [ ] **T103**: Test drag-and-drop file upload on desktop browsers
- [ ] **T104**: Verify animations and transitions work smoothly on mobile devices

---

## Summary

**Total Tasks**: 104 tasks
- **Phase 1 (P1 - Must Have)**: 23 tasks
- **Phase 2 (P2 - Should Have)**: 20 tasks
- **Phase 3 (P3 - Could Have)**: 20 tasks
- **Phase 4 (Refactoring)**: 10 tasks
- **Phase 5 (Edge Cases)**: 14 tasks
- **Phase 6 (Accessibility & UX)**: 17 tasks

**Recommended Implementation Order**:
1. Start with Phase 1 (P1) - Core functionality to enable attachment upload during creation
2. Move to Phase 2 (P2) - Image thumbnail gallery for better visual feedback
3. Implement Phase 3 (P3) - Full attachment management capabilities
4. Consider Phase 4 (Refactoring) if code duplication becomes problematic
5. Address Phase 5 (Edge Cases) before production deployment
6. Polish with Phase 6 (Accessibility & UX) for production-ready quality

**Estimated Effort**:
- Phase 1: 2-3 days
- Phase 2: 1-2 days
- Phase 3: 1-2 days
- Phase 4: 1-2 days (optional)
- Phase 5: 2-3 days
- Phase 6: 2-3 days

**Total Estimated Effort**: 9-15 days (depending on scope)
