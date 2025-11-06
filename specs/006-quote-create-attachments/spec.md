# Feature Specification: Quote Creation with Attachments & Image Gallery

**Feature Branch**: `006-quote-create-attachments`
**Created**: 2025-11-06
**Status**: Draft
**Input**: User description: "existing quote attachment upload function available only on the edit screen. we need to have it on quote create screen as well. also images uploaded should display gallery thumbnails."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Admin Uploads Attachments During Quote Creation (Priority: P1)

A client admin creating a new quote request wants to attach supporting documents and photos immediately during creation, rather than having to save a draft first and then navigate to edit mode to add attachments.

**Why this priority**: This is the most critical user journey because it eliminates a significant workflow friction. Currently, users must complete a multi-step process (create draft → save → navigate to edit → upload files), which interrupts the natural flow of quote creation. This creates immediate value by allowing users to complete their entire request in one session.

**Independent Test**: Can be fully tested by creating a new quote, uploading files during creation, submitting the quote, and verifying all attachments are properly associated with the submitted quote. Delivers complete quote creation workflow without mode switching.

**Acceptance Scenarios**:

1. **Given** a client admin is on the "New Quote Request" page, **When** they fill in required quote details and select files to upload, **Then** the files are uploaded and associated with the quote draft immediately
2. **Given** a client admin has uploaded 3 files during quote creation, **When** they click "Submit" without saving as draft, **Then** the quote is created and all 3 attachments are included
3. **Given** a client admin uploads files and then modifies quote details, **When** they save the draft, **Then** both the quote data and attachments are persisted together
4. **Given** a client admin starts uploading a file during quote creation, **When** the upload is in progress, **Then** they see a progress indicator and cannot submit the form until upload completes

---

### User Story 2 - Client Admin Views Uploaded Images as Thumbnails (Priority: P2)

A client admin creating a quote with multiple photos wants to see visual thumbnails of uploaded images to verify they've attached the correct files, rather than just seeing text filenames.

**Why this priority**: Visual confirmation is important for quality assurance, especially for property maintenance quotes where photos are critical evidence. However, the basic upload functionality (P1) must work first before enhancing the display format.

**Independent Test**: Can be tested independently by uploading various image types (JPG, PNG) and one non-image document (PDF), then verifying images display as clickable thumbnails while documents show as file icons. Delivers improved user experience for photo-heavy quote requests.

**Acceptance Scenarios**:

1. **Given** a client admin uploads 3 JPG images during quote creation, **When** the upload completes, **Then** they see 3 image thumbnails (not filenames) in a gallery view
2. **Given** a client admin uploads 2 images and 1 PDF document, **When** viewing the attachments section, **Then** the 2 images display as thumbnails and the PDF shows as a document icon with filename
3. **Given** a client admin has uploaded an image thumbnail, **When** they click on the thumbnail, **Then** the full-size image opens in a new tab or lightbox viewer
4. **Given** a client admin uploads a very large image (4000x3000px), **When** viewing the thumbnail, **Then** the image is properly scaled down to thumbnail size without layout breakage

---

### User Story 3 - Client Admin Manages Attachments Before Submission (Priority: P3)

A client admin creating a quote wants to remove accidentally uploaded files or add additional files before submitting the quote, ensuring they have full control over attachments during the creation process.

**Why this priority**: Attachment management (delete, re-upload) is a nice-to-have feature for creation flow. The core value is uploading attachments during creation (P1) and viewing them properly (P2). Management capabilities can be added later since users can still manage attachments in edit mode after submission.

**Independent Test**: Can be tested by uploading 3 files during quote creation, deleting one, uploading a replacement, and verifying the final quote has only the 2 correct attachments. Delivers complete attachment lifecycle control during creation.

**Acceptance Scenarios**:

1. **Given** a client admin has uploaded 3 files during quote creation, **When** they click the delete button on one file, **Then** that file is removed from the upload list without affecting the other 2 files
2. **Given** a client admin deletes an uploaded file, **When** they select a new file to upload, **Then** the new file is added to the existing attachments list
3. **Given** a client admin has uploaded 5 files (the maximum), **When** they attempt to upload another file, **Then** they see an error message indicating the 5-file limit has been reached
4. **Given** a client admin has uploaded files during quote creation, **When** they click "Cancel" to abandon the quote, **Then** they are warned that uploaded files will be lost if they don't save as draft

---

### Edge Cases

- What happens when a user uploads files during quote creation but their session expires before submission?
- What happens when a user uploads a 9.5MB file (just under the 10MB limit) and the file upload completes but the subsequent quote save/submit fails?
- How does the system handle duplicate filename uploads (e.g., user uploads "photo.jpg" twice)?
- What happens when a user uploads an image file with a non-standard extension but valid image MIME type (e.g., .webp)?
- How does the system behave when a user navigates away from the quote creation page while files are uploading?
- What happens when network connectivity drops mid-upload and then reconnects?
- How are attachments handled if the user saves a draft, uploads files, but never submits the quote?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to upload attachments during quote creation (not only after saving a draft)
- **FR-002**: System MUST display uploaded image files as thumbnail previews in a gallery layout
- **FR-003**: System MUST display non-image files (PDF, documents) with appropriate file type icons and filenames
- **FR-004**: System MUST associate uploaded attachments with the quote draft immediately upon upload, even before form submission
- **FR-005**: System MUST persist attachments when user saves quote as draft during creation
- **FR-006**: System MUST include all uploaded attachments when user submits the quote directly without saving as draft first
- **FR-007**: System MUST prevent form submission while file uploads are in progress
- **FR-008**: System MUST show upload progress indicators for each file being uploaded
- **FR-009**: Users MUST be able to delete uploaded attachments before submitting the quote
- **FR-010**: System MUST enforce the existing file upload limits (10MB per file, 5 files maximum)
- **FR-011**: System MUST validate file types on the client side before upload (same types as edit mode: images, PDF, Word, Excel, Text)
- **FR-012**: System MUST display error messages for failed uploads (file too large, invalid type, network error)
- **FR-013**: Thumbnail images MUST be clickable to view full-size versions
- **FR-014**: System MUST handle the creation workflow where a quote is created first (if needed) to obtain a quote ID for attachment upload
- **FR-015**: System MUST maintain attachment associations even if user navigates away and returns to the draft quote

### Key Entities

- **Quote Draft**: A quote in "Draft" status that may not yet be persisted to the database but has attachments being uploaded
- **Quote Attachment**: File associated with a quote, containing file metadata (filename, size, type, URL), uploader information, and upload timestamp
- **Temporary Attachment**: Attachment uploaded during quote creation that needs to be associated with a quote ID (may require creating the quote draft first)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload attachments during quote creation without first saving a draft (100% of quote creation flows support immediate attachment upload)
- **SC-002**: Image attachments display as visual thumbnails within 500ms of upload completion
- **SC-003**: Users can complete quote creation with attachments in a single workflow (no navigation to edit mode required)
- **SC-004**: Upload progress and status is visible to users throughout the attachment upload process
- **SC-005**: 95% of attachments uploaded during quote creation are successfully associated with the submitted quote
- **SC-006**: Zero data loss of attachments when user saves draft or submits quote after uploading files during creation
- **SC-007**: Attachment management (upload, view thumbnails, delete) works identically in creation mode and edit mode from a user experience perspective
