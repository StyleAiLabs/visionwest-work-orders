# Deployment Guide - Version 2.5.0

## Multi-Client Platform Deployment Checklist

**Version**: 2.5.0
**Release Date**: October 18, 2025
**Feature**: Multi-Client Work Order Management

---

## Pre-Deployment Checklist

### 1. Database Updates ✅ COMPLETE

- [x] Work orders FK constraint fixed (now references `clients` table)
- [x] Database ANALYZE run on users, work_orders, clients tables
- [x] Migration validation completed (100% P1 MVP requirements passed)
- [x] Data integrity verified (no NULL client_ids, no orphaned records)

### 2. Code Updates ✅ COMPLETE

- [x] Frontend version updated to 2.5.0 (package.json, SettingsPage.jsx)
- [x] Backend version updated to 2.5.0 (package.json)
- [x] Release notes added to ReleaseNotesPage.jsx
- [x] Multi-client features implemented and tested

---

## Deployment Steps

### Step 1: Backend Deployment (Render)

1. **Environment Variables** - No changes required
   - All environment variables remain the same
   - Database connection settings unchanged
   - JWT secret unchanged

2. **Deploy Backend**
   ```bash
   git push origin 002-multi-client-work-orders
   ```
   - Render will auto-deploy from the connected repository
   - Migrations will run automatically via `npm start` script

3. **Verify Backend Deployment**
   - Check Render deployment logs for success
   - Verify server is running: `GET https://your-backend.onrender.com/`
   - Test login endpoint: `POST https://your-backend.onrender.com/api/auth/login`

---

### Step 2: Frontend Deployment (Netlify)

**⚠️ CRITICAL: Update Environment Variable**

1. **Update Netlify Environment Variable**
   - Go to: Netlify Dashboard → Your Site → Site settings → Environment variables
   - Find or add: `VITE_API_URL`
   - **Current value** (incorrect): `http://localhost:5002/api`
   - **New value** (correct): `https://your-backend.onrender.com/api`

   **Example**:
   ```
   Variable name: VITE_API_URL
   Value: https://visionwest-backend-xyz.onrender.com/api
   ```

2. **Trigger Redeploy** (if environment variable was updated)
   - Go to: Deploys → Trigger deploy → Deploy site
   - This ensures the new environment variable is used

3. **Or Push Code**
   ```bash
   git push origin 002-multi-client-work-orders
   ```
   - Netlify will auto-deploy from the connected repository

4. **Verify Frontend Deployment**
   - Open production URL: `https://your-site.netlify.app`
   - Check browser console for any API errors
   - Verify API calls are going to the correct backend URL (not localhost)

---

### Step 3: Post-Deployment Validation

**Critical Tests**:

1. **Login Flow**
   - [ ] Navigate to `/login`
   - [ ] Login with existing Visionwest user
   - [ ] Verify JWT token includes `clientId` (check browser DevTools → Network → Login response)

2. **Admin Panel**
   - [ ] Login as admin user
   - [ ] Navigate to Settings → Admin Panel
   - [ ] Verify client list displays (should see VISIONWEST and potentially EMERGE)
   - [ ] Test client CRUD operations (Create, Edit, View, Delete)

3. **Client Data Isolation**
   - [ ] Login as non-admin user
   - [ ] Verify work orders list shows only user's client data
   - [ ] Verify no admin panel link in Settings (non-admin users)

4. **Work Order Operations**
   - [ ] Create new work order
   - [ ] Verify work order is assigned to user's client
   - [ ] View work order details
   - [ ] Update work order status

5. **n8n Webhook Integration**
   - [ ] Trigger n8n workflow to create work order
   - [ ] Verify work order created with VISIONWEST client_id
   - [ ] Verify Visionwest users can see the webhook-created work order

---

## Environment Variable Reference

### Frontend (.env or Netlify Environment Variables)

```bash
# DEVELOPMENT (local)
VITE_API_URL=http://localhost:5002/api

# STAGING (Netlify)
VITE_API_URL=https://visionwest-backend-staging.onrender.com/api

# PRODUCTION (Netlify)
VITE_API_URL=https://visionwest-backend-prod.onrender.com/api
```

### Backend (.env or Render Environment Variables)

```bash
# Database
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=5432

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# CORS (add your Netlify URLs)
CORS_ORIGIN=https://your-site.netlify.app

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket
```

---

## Rollback Procedure

If issues are detected after deployment:

### 1. Quick Rollback (Frontend Only)

If the issue is frontend-related:

```bash
# Revert to previous deployment in Netlify
Netlify Dashboard → Deploys → [Previous successful deploy] → Publish deploy
```

### 2. Full Rollback (Backend + Frontend)

If database or backend issues:

```bash
# 1. Run database rollback script
cd backend
node scripts/rollback-migration.js

# 2. Revert code
git revert <commit-hash>
git push origin 002-multi-client-work-orders

# 3. Redeploy previous version on Render and Netlify
```

---

## Monitoring & Support

### What to Monitor (First 24 Hours)

1. **Error Logs**
   - Render backend logs for database errors
   - Netlify function logs for API connection errors
   - Browser console errors on production site

2. **User Feedback**
   - Login issues
   - Work order access problems
   - Admin panel functionality

3. **Performance**
   - API response times (should be <500ms)
   - Page load times
   - Database query performance

### Common Issues & Solutions

#### Issue: "Network Error" on login
**Cause**: VITE_API_URL pointing to localhost
**Solution**: Update Netlify environment variable to production backend URL

#### Issue: Users can't see work orders
**Cause**: client_id NULL values or FK constraint issues
**Solution**: Run validation script:
```bash
cd backend
node scripts/validate-migration.js
```

#### Issue: Admin panel not accessible
**Cause**: User role not set to 'admin'
**Solution**: Update user role in database or verify JWT token includes correct role

---

## Success Criteria

Deployment is considered successful when:

- ✅ Users can login and receive JWT with clientId
- ✅ Work orders are client-scoped (users only see their org's data)
- ✅ Admin panel accessible for admin users
- ✅ Client CRUD operations working
- ✅ n8n webhook creates work orders for VISIONWEST client
- ✅ No errors in production logs
- ✅ All existing functionality preserved

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.5.0 | 2025-10-18 | Multi-client platform support |
| 2.4.1 | 2025-07-13 | Pagination improvements |
| 2.4.0 | 2025-07-13 | Photo management enhancements |

---

## Support Contacts

- **Technical Issues**: Check GitHub issues or contact development team
- **Database Issues**: Run `node scripts/validate-migration.js`
- **Environment Configuration**: Verify Netlify/Render dashboard settings

---

**Deployment Prepared By**: Claude Code
**Last Updated**: 2025-10-18
**Status**: Ready for Production Deployment
