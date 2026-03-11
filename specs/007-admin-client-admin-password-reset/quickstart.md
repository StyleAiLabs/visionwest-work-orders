# Quickstart: Admin and Client Admin Password Reset

## 1. Backend setup
```bash
cd backend
npm install
npm run dev
```

## 2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

## 3. Test flows

### Admin reset flow
1. Login as `admin`.
2. Open `User Management`.
3. Click `Reset Password` for a target active user.
4. Confirm reset.
5. Verify success toast/message.
6. Verify target user receives reset email.

### Client Admin reset flow
1. Login as `client_admin`.
2. Open `User Management`.
3. Click `Reset Password` for a user in same client.
4. Confirm reset.
5. Verify target user receives email.
6. Verify active `admin` users are included as BCC recipients.

### Access control checks
1. Login as `staff` or `client`.
2. Ensure reset action is not visible and API returns 403 if called directly.

## 4. API endpoint
- `POST /api/users/:userId/reset-password`
- Auth: Bearer token
- Roles: `admin`, `client_admin`
- Response: success message and metadata (never include hashed password)
