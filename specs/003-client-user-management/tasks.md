# Tasks: Client User Management

**Input**: Design documents from `/specs/003-client-user-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/user-api.yaml
**Feature Branch**: `003-client-user-management`
**Version Bump**: 2.6.0 → 2.7.0 (minor - new feature)

**Organization**: Tasks are grouped by user story (P1, P2, P3) to enable independent implementation and testing of each story. Follow the P1 MVP validation pattern: Backend → Frontend → Manual Testing → Integration Testing.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/` directory (Express API)
- **Frontend**: `frontend/` directory (React SPA)
- **Migrations**: `backend/migrations/`
- **Existing files**: Marked as EXISTING - will be extended/modified

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project setup and dependency installation

- [X] T001 Verify current branch is `003-client-user-management` using `git branch --show-current`
- [X] T002 [P] Install backend dependency libphonenumber-js in backend/package.json for phone validation
- [X] T003 [P] Verify backend dependencies (bcrypt, jsonwebtoken, nodemailer, sequelize) are installed
- [X] T004 [P] Verify frontend dependencies (react, vite, tailwindcss, react-router-dom) are installed
- [X] T005 Add FRONTEND_URL environment variable to backend/.env (value: http://localhost:5173 for dev)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration and shared utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create database migration file backend/migrations/YYYYMMDDHHMMSS-add-unique-email-client-index.js to add compound unique index on (LOWER(email), client_id)
- [X] T007 Run migration using `npx sequelize-cli db:migrate` from backend/ directory to create index
- [X] T008 Verify index created by connecting to PostgreSQL and running `\d users` to see user_email_client_idx
- [X] T009 Create backend/utils/passwordGenerator.js utility with generateSecurePassword() function using crypto.randomBytes
- [X] T010 Update backend/utils/emailService.js with sendNewUserCredentialsEmail(user, temporaryPassword) function using Brevo API (with nodemailer fallback) and brand-compliant HTML template following NextGen WOM brand guidelines (Deep Navy #0e2640 header, NextGen Green #8bc63b CTA button, Rich Black #010308 text on Pure White #ffffff background)
- [X] T011 Test password generator by running `node -e "console.log(require('./utils/passwordGenerator').generateSecurePassword())"` from backend/
- [X] T012 Create database migration file backend/migrations/YYYYMMDDHHMMSS-add-password-changed-field.js to add password_changed BOOLEAN field to users table (defaults to false)
- [X] T013 Run migration using `npx sequelize-cli db:migrate` from backend/ directory to add password_changed field
- [X] T014 Update backend/models/user.model.js to add password_changed field definition in Sequelize model

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create New Client User (Priority: P1) 🎯 MVP

**Goal**: Enable client admins to create new user accounts for their organization with auto-generated passwords sent via email

**Independent Test**: Login as client_admin, click "Add User", fill form (name, email, role, phone), submit, verify user appears in list and receives credentials email

### Backend Implementation for User Story 1

- [X] T015 [US1] Create backend/controllers/user.controller.js with listUsers(), getUserById(), createUser(), updateUser(), deleteUser() functions
- [X] T016 [US1] Implement createUser() function in user.controller.js with input validation (full_name, email, role, phone_number)
- [X] T017 [US1] Add email uniqueness check in createUser() using Sequelize Op.iLike to check (LOWER(email), client_id)
- [X] T018 [US1] Add phone number validation in createUser() using E.164 format regex `^\+[1-9]\d{1,14}$`
- [X] T019 [US1] Add role constraint validation in createUser() to allow only 'client' or 'client_admin' roles
- [X] T020 [US1] Implement password generation and bcrypt hashing in createUser() with work factor 10, set password_changed=false for new users
- [X] T021 [US1] Add User.create() call in createUser() with client_id from req.clientId (JWT token) and password_changed=false
- [X] T022 [US1] Add async email sending call to sendNewUserCredentialsEmail() in createUser() (non-blocking, using Brevo API with brand-compliant template)
- [X] T023 [US1] Implement listUsers() function in user.controller.js with pagination (page, limit query params)
- [X] T024 [US1] Add WHERE filter in listUsers() for client_id = req.clientId and is_active = true
- [X] T025 [US1] Add ORDER BY full_name ASC and LIMIT/OFFSET pagination in listUsers()
- [X] T026 [US1] Implement getUserById() function in user.controller.js with client_id filter for multi-tenant isolation
- [X] T027 [US1] Create backend/routes/user.routes.js with Express router for user management endpoints
- [X] T028 [US1] Add middleware stack to user.routes.js: verifyToken → isClientAdmin → addClientScope
- [X] T029 [US1] Register routes in user.routes.js: GET /, POST /, GET /:userId, PATCH /:userId, DELETE /:userId
- [X] T030 [US1] Register user.routes in backend/server.js as `app.use('/api/users', userRoutes)`
- [X] T031 [US1] Add middleware in backend/middleware/auth.middleware.js to check password_changed field and enforce password change on first login (requirePasswordChange)
- [X] T032 [US1] Update login endpoint in backend/controllers/auth.controller.js to check password_changed flag and return requirePasswordChange=true in response
- [X] T033 [US1] Create changePassword() function in backend/controllers/auth.controller.js with password validation and bcrypt hashing
- [X] T034 [US1] Add POST /api/auth/change-password route in backend/routes/auth.routes.js
- [X] T035 [US1] Update changePassword() to set password_changed=true after successful password change
- [ ] T036 [US1] Test backend endpoints using curl or Postman: POST /api/users to create user (verify 201 response)
- [ ] T037 [US1] Test backend endpoints: GET /api/users?page=1&limit=50 (verify 200 response with pagination)
- [ ] T038 [US1] Test backend validation: POST /api/users with duplicate email (verify 400 error response)
- [ ] T039 [US1] Test backend validation: POST /api/users with invalid role 'admin' (verify 400 error response)
- [ ] T040 [US1] Test backend validation: POST /api/users with invalid phone format (verify 400 error response)
- [ ] T041 [US1] Test password change flow: Login as new user, verify requirePasswordChange=true in response
- [ ] T042 [US1] Test password change flow: Call POST /api/auth/change-password with new password, verify password_changed=true

### Frontend Implementation for User Story 1

- [ ] T033 [P] [US1] Create frontend/src/services/userService.js with API functions: listUsers(), getUserById(), createUser(), updateUser()
- [ ] T034 [P] [US1] Implement createUser(userData) in userService.js with POST /api/users using axios
- [ ] T035 [P] [US1] Implement listUsers(page, limit) in userService.js with GET /api/users?page=X&limit=Y
- [ ] T036 [P] [US1] Implement getUserById(userId) in userService.js with GET /api/users/:userId
- [ ] T037 [US1] Create frontend/src/components/CreateUserForm.jsx with form fields: full_name, email, role, phone_number
- [ ] T038 [US1] Add form validation in CreateUserForm.jsx for required fields (full_name, email, role)
- [ ] T039 [US1] Add email format validation in CreateUserForm.jsx with regex check
- [ ] T040 [US1] Add phone number format validation in CreateUserForm.jsx with E.164 format hint text
- [ ] T041 [US1] Add role selection dropdown in CreateUserForm.jsx with options: 'Client User', 'Client Admin'
- [ ] T042 [US1] Implement form submission in CreateUserForm.jsx calling userService.createUser()
- [ ] T043 [US1] Add error handling in CreateUserForm.jsx to display API error messages
- [ ] T044 [US1] Add loading state in CreateUserForm.jsx with disabled submit button during submission
- [ ] T045 [US1] Create frontend/src/components/UserList.jsx with responsive layout (cards on mobile, table on desktop)
- [ ] T046 [US1] Implement mobile card layout in UserList.jsx with user info (name, email, role badge, phone)
- [ ] T047 [US1] Implement desktop table layout in UserList.jsx with columns: Name, Email, Phone, Role, Actions
- [ ] T048 [US1] Add role badge styling in UserList.jsx: blue for client_admin, gray for client
- [ ] T049 [US1] Add loading spinner in UserList.jsx for isLoading state
- [ ] T050 [US1] Add empty state message in UserList.jsx when no users found
- [ ] T051 [US1] Create frontend/src/pages/UserManagementPage.jsx as main container for user management UI
- [ ] T052 [US1] Add role check in UserManagementPage.jsx: redirect to /dashboard if user.role !== 'client_admin'
- [ ] T053 [US1] Add useEffect hook in UserManagementPage.jsx to fetch users on mount using listUsers()
- [ ] T054 [US1] Add "Create New User" button in UserManagementPage.jsx to toggle showCreateForm state
- [ ] T055 [US1] Add conditional rendering in UserManagementPage.jsx: show CreateUserForm when showCreateForm = true
- [ ] T056 [US1] Add success message display in UserManagementPage.jsx after user creation (auto-clear after 5 seconds)
- [ ] T057 [US1] Add error message display in UserManagementPage.jsx for API failures
- [ ] T058 [US1] Implement handleCreateSuccess callback in UserManagementPage.jsx to refresh user list and show success message
- [ ] T059 [US1] Add UserList component in UserManagementPage.jsx with users prop and onEditUser callback
- [ ] T060 [US1] Add route in frontend/src/App.jsx: `<Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />`
- [ ] T061 [US1] Add navigation menu item in frontend sidebar/nav component for "User Management" (visible only to client_admin role)
- [ ] T062 [US1] Add icon for "User Management" menu item (use UsersIcon or similar from icon library)

### Manual Testing for User Story 1

- [ ] T063 [US1] Test on iOS Safari: Login as client_admin, navigate to /users, verify page loads
- [ ] T064 [US1] Test on iOS Safari: Click "Create New User" button (verify touch target size ≥44x44px)
- [ ] T065 [US1] Test on iOS Safari: Fill form fields on mobile (verify fields are large enough, keyboard appropriate)
- [ ] T066 [US1] Test on iOS Safari: Submit form, verify success message appears
- [ ] T067 [US1] Test on iOS Safari: Verify new user appears in card layout list
- [ ] T068 [US1] Test on iOS Safari: Verify credentials email was received (check email inbox)
- [ ] T069 [US1] Test on Android Chrome: Repeat T063-T068 tests on Android device
- [ ] T070 [US1] Test on Desktop Chrome (1920x1080): Verify user list displays as table (not cards)
- [ ] T071 [US1] Test on Desktop Chrome: Verify create form displays properly in section/modal
- [ ] T072 [US1] Test validation: Try creating user with existing email (verify error message)
- [ ] T073 [US1] Test validation: Try creating user with invalid email format (verify error message)
- [ ] T074 [US1] Test validation: Try creating user with invalid phone (no + prefix) (verify error message)
- [ ] T075 [US1] Test validation: Submit form with missing required fields (verify error messages)
- [ ] T076 [US1] Test role-based access: Login as 'client' role user, try to access /users (verify redirect to /dashboard)
- [ ] T077 [US1] Test multi-tenant isolation: Login as client_admin for Org A, create users, verify only Org A users visible

### Integration Testing for User Story 1

- [ ] T078 [US1] Verify n8n webhook still works: Trigger email → PDF extraction → webhook (verify work order created)
- [ ] T079 [US1] Verify existing login/logout still works after user management feature added
- [ ] T080 [US1] Verify work order list/view still works (no regressions)
- [ ] T081 [US1] Verify settings page still accessible (no regressions)
- [ ] T082 [US1] Check browser console for errors on all pages (should be none)

**Checkpoint**: User Story 1 (P1 MVP) is complete - client admins can create users and view user list

---

## Phase 4: User Story 2 - Update User Role (Priority: P2)

**Goal**: Enable client admins to update user roles to adjust permissions as responsibilities change

**Independent Test**: Select existing user, click "Edit Role", change role from 'client' to 'client_admin', save, verify role updated and permissions reflect change

### Backend Implementation for User Story 2

- [ ] T083 [US2] Implement updateUser() function in backend/controllers/user.controller.js for PATCH /api/users/:userId
- [ ] T084 [US2] Add role update logic in updateUser() with validation for 'client' or 'client_admin' only
- [ ] T085 [US2] Add self-role-change prevention in updateUser(): check if userId === req.userId, reject if updating own role
- [ ] T086 [US2] Add user lookup in updateUser() with WHERE id = userId AND client_id = req.clientId (multi-tenant isolation)
- [ ] T087 [US2] Add User.update() call in updateUser() with role field update
- [ ] T088 [US2] Return updated user object in updateUser() response (without password field)
- [ ] T089 [US2] Test backend endpoint: PATCH /api/users/:userId with role update (verify 200 response)
- [ ] T090 [US2] Test backend validation: Try changing own role (verify 400 error "You cannot change your own role")
- [ ] T091 [US2] Test backend validation: Try assigning 'admin' role (verify 400 error "You can only assign Client User or Client Admin roles")

### Frontend Implementation for User Story 2

- [ ] T092 [P] [US2] Create frontend/src/components/EditUserModal.jsx for editing user details with modal/dialog
- [ ] T093 [US2] Add role selection field in EditUserModal.jsx with current role pre-selected
- [ ] T094 [US2] Add role dropdown in EditUserModal.jsx with options: 'Client User', 'Client Admin'
- [ ] T095 [US2] Implement updateUser(userId, updates) in frontend/src/services/userService.js with PATCH /api/users/:userId
- [ ] T096 [US2] Add form submission in EditUserModal.jsx calling userService.updateUser() with { role: selectedRole }
- [ ] T097 [US2] Add error handling in EditUserModal.jsx to display API error messages (e.g., self-role-change error)
- [ ] T098 [US2] Add success callback in EditUserModal.jsx to close modal and refresh user list
- [ ] T099 [US2] Update UserList.jsx to add onEditUser prop callback for "Edit" button click
- [ ] T100 [US2] Update UserManagementPage.jsx to add EditUserModal with showEditModal state
- [ ] T101 [US2] Add handleEditUser function in UserManagementPage.jsx to open EditUserModal with selected user
- [ ] T102 [US2] Add handleUpdateSuccess callback in UserManagementPage.jsx to refresh user list after update

### Manual Testing for User Story 2

- [ ] T103 [US2] Test role update: Select user with 'client' role, change to 'client_admin', verify update successful
- [ ] T104 [US2] Test role update: Login as updated user, verify they can now access user management page
- [ ] T105 [US2] Test self-role-change prevention: Try to change own role (verify error message appears)
- [ ] T106 [US2] Test on mobile (iOS/Android): Verify edit modal opens and role selection works on touch devices
- [ ] T107 [US2] Test validation: Try assigning invalid role via API directly (verify 400 error from backend)

**Checkpoint**: User Story 2 (P2) is complete - client admins can update user roles

---

## Phase 5: User Story 3 - Update User Contact Details (Priority: P3)

**Goal**: Enable client admins to update user contact information (name, email, phone) to keep team directory current

**Independent Test**: Select user, click "Edit Contact Details", update name/email/phone, save, verify changes persisted and displayed in user list

### Backend Implementation for User Story 3

- [ ] T108 [US3] Extend updateUser() function in backend/controllers/user.controller.js to handle contact detail updates
- [ ] T109 [US3] Add email update logic in updateUser() with duplicate email check (exclude current user from uniqueness check)
- [ ] T110 [US3] Add phone number validation in updateUser() for E.164 format when provided
- [ ] T111 [US3] Add full_name update logic in updateUser() with validation (2-100 characters)
- [ ] T112 [US3] Update User.update() call in updateUser() to include full_name, email, phone_number fields
- [ ] T113 [US3] Test backend endpoint: PATCH /api/users/:userId with contact updates (verify 200 response)
- [ ] T114 [US3] Test backend validation: Try updating email to existing email in same org (verify 400 duplicate error)
- [ ] T115 [US3] Test backend validation: Try updating phone with invalid format (verify 400 error)

### Frontend Implementation for User Story 3

- [ ] T116 [US3] Extend EditUserModal.jsx to add contact detail fields: full_name, email, phone_number
- [ ] T117 [US3] Pre-fill contact detail fields in EditUserModal.jsx with current user values
- [ ] T118 [US3] Add email format validation in EditUserModal.jsx with regex check
- [ ] T119 [US3] Add phone number format validation in EditUserModal.jsx with E.164 format hint
- [ ] T120 [US3] Update form submission in EditUserModal.jsx to include contact fields in updateUser() call
- [ ] T121 [US3] Add loading state in EditUserModal.jsx during form submission
- [ ] T122 [US3] Add error handling in EditUserModal.jsx for duplicate email and invalid phone errors
- [ ] T123 [US3] Update UserList.jsx to display updated contact details after edit (name, email, phone)

### Manual Testing for User Story 3

- [ ] T124 [US3] Test contact update: Update user's full_name, verify change appears in user list
- [ ] T125 [US3] Test contact update: Update user's email, verify change appears and no duplicate error
- [ ] T126 [US3] Test contact update: Update user's phone_number, verify change appears with correct formatting
- [ ] T127 [US3] Test validation: Try updating email to duplicate (verify error message)
- [ ] T128 [US3] Test validation: Try updating phone with invalid format (verify error message)
- [ ] T129 [US3] Test on mobile (iOS/Android): Verify contact edit form works on touch devices with appropriate keyboards
- [ ] T130 [US3] Test desktop: Verify contact edit modal displays properly and form validation works

**Checkpoint**: User Story 3 (P3) is complete - client admins can update user contact details

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, version management, and deployment readiness

- [ ] T131 [P] Update frontend/package.json version from 2.6.0 to 2.7.0
- [ ] T132 [P] Update backend/package.json version from 2.6.0 to 2.7.0
- [ ] T133 Update Settings page (frontend/src/pages/SettingsPage.jsx) to display version 2.7.0
- [ ] T134 Create release notes file in release-notes/2.7.0.md documenting new user management feature
- [ ] T135 [P] Run final integration test: Verify n8n webhook still works after all changes
- [ ] T136 [P] Run final mobile test: Test complete user management flow on iOS Safari
- [ ] T137 [P] Run final mobile test: Test complete user management flow on Android Chrome
- [ ] T138 Review CORS configuration in backend/server.js to ensure frontend origin is allowed
- [ ] T139 Verify all environment variables documented in backend/.env.example (EMAIL_*, FRONTEND_URL)
- [ ] T140 Run backend server locally and verify no console errors: `cd backend && npm run dev`
- [ ] T141 Run frontend server locally and verify no console errors: `cd frontend && npm run dev`
- [ ] T142 Test complete user journey: Create user → Update role → Update contact → Verify all work
- [ ] T143 Check browser DevTools Network tab: Verify all API calls return expected status codes
- [ ] T144 Check browser DevTools Console: Verify no errors or warnings on any page
- [ ] T145 Verify mobile responsiveness: Test at 320px, 375px, 414px widths (use browser responsive mode)
- [ ] T146 Verify touch targets on mobile: All buttons and interactive elements ≥44x44px
- [ ] T147 Test email delivery in staging/dev environment: Create user and verify credentials email received within 5 minutes
- [ ] T148 Review code for hardcoded values: Verify all configuration uses environment variables
- [ ] T149 Check for console.log statements: Remove or convert to proper logging
- [ ] T150 Final git status check: Ensure no untracked files or uncommitted changes before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - MVP feature
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (extends edit functionality)
- **User Story 3 (Phase 5)**: Depends on User Story 2 completion (extends edit functionality further)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP DELIVERABLE**
- **User Story 2 (P2)**: Depends on User Story 1 (reuses EditUserModal structure)
- **User Story 3 (P3)**: Depends on User Story 2 (extends same edit modal with more fields)

### Within Each User Story

- Backend implementation before frontend implementation (API must exist first)
- Controllers before routes (controllers are used by routes)
- Services and utilities before controllers (controllers depend on utilities)
- Frontend components before pages (pages compose components)
- Manual testing after implementation (verify functionality works)
- Integration testing after manual testing (verify no regressions)

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004 can run in parallel (different package.json files)

**Phase 2 (Foundational)**:
- T009 and T010 can run in parallel (different files: passwordGenerator.js and emailService.js)

**User Story 1 - Frontend**:
- T033, T034, T035, T036 can run in parallel (all in userService.js, but different functions)
- After userService complete: T037-T044 (CreateUserForm), T045-T050 (UserList), T051-T062 (UserManagementPage) can work in parallel by different developers

**User Story 2 - Frontend**:
- T092 can start in parallel with backend T083-T088 (frontend component stub)

**User Story 3 - Frontend**:
- T116-T123 extend existing EditUserModal.jsx (must be sequential)

**Phase 6 (Polish)**:
- T131, T132, T135, T136, T137 can run in parallel (different files/tasks)

---

## Parallel Example: User Story 1 Backend

```bash
# After T011 complete, launch backend tasks in parallel:
Task T012: Create user.controller.js (file 1)
Task T024: Create user.routes.js (file 2) - can start stub while controller is being filled

# After T032 complete (backend done), launch frontend tasks in parallel:
Task T033-T036: userService.js functions (file 3)
Task T037-T044: CreateUserForm.jsx (file 4)
Task T045-T050: UserList.jsx (file 5)
Task T051-T062: UserManagementPage.jsx (file 6)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T011) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 Backend (T012-T032)
4. Complete Phase 3: User Story 1 Frontend (T033-T062)
5. Complete Phase 3: User Story 1 Testing (T063-T082)
6. **STOP and VALIDATE**: User Story 1 should be fully functional independently
7. Deploy P1 MVP if ready for production

### Incremental Delivery

1. Foundation (Phase 1 + 2) → Database migration and utilities ready
2. P1 MVP (Phase 3) → Client admins can create users → **Deploy/Demo**
3. P2 Enhancement (Phase 4) → Client admins can update roles → **Deploy/Demo**
4. P3 Enhancement (Phase 5) → Client admins can update contacts → **Deploy/Demo**
5. Polish (Phase 6) → Version bump, release notes, final validation → **Deploy to Production**

### Parallel Team Strategy

With multiple developers:

1. **Phase 1-2**: Team completes Setup + Foundational together (blocking for all)
2. **Phase 3 (US1)**:
   - Developer A: Backend (T012-T032)
   - After T032: Developer B can start Frontend (T033-T062) in parallel with Developer A doing manual testing
3. **Phase 4-5 (US2-US3)**: Can be done sequentially or by different developers if desired
4. **Phase 6**: Team completes polish tasks together

---

## Notes

- **[P]** marker = tasks that can run in parallel (different files, no dependencies)
- **[US1/US2/US3]** marker = maps task to specific user story for traceability
- **MVP = User Story 1 (P1)** - This alone delivers value and should be tested independently
- Verify backend endpoints work before building frontend (use curl/Postman for T028-T032)
- Test on actual mobile devices (iOS Safari, Android Chrome) before considering P1 complete
- Email credentials should arrive within 5 minutes (SC-005 from spec.md)
- User list should handle 500 users without performance degradation (SC-006 from spec.md)
- Commit after completing each user story phase (not after every task - too granular)
- Stop at any checkpoint to validate story independently before proceeding
- No tests requested in spec.md - manual testing only

---

## Success Criteria Validation

Before marking feature complete, verify these from spec.md:

- [ ] **SC-001**: Client admins can create user account in under 1 minute
- [ ] **SC-002**: Client admins can update role/contact in under 30 seconds
- [ ] **SC-003**: 100% of user management operations restricted to client_admin role
- [ ] **SC-004**: All user changes persist correctly with zero data loss
- [ ] **SC-005**: New users receive credentials email within 5 minutes
- [ ] **SC-006**: User management handles 500 users per org without performance degradation

---

**Total Tasks**: 150
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 6 tasks
- Phase 3 (User Story 1): 70 tasks (Backend: 21, Frontend: 30, Testing: 19)
- Phase 4 (User Story 2): 25 tasks (Backend: 9, Frontend: 11, Testing: 5)
- Phase 5 (User Story 3): 24 tasks (Backend: 8, Frontend: 9, Testing: 7)
- Phase 6 (Polish): 20 tasks

**Parallel Opportunities**: 15+ tasks marked [P] can run in parallel
**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 81 tasks
**Estimated Implementation Time**: 7-10 hours for P1 MVP
