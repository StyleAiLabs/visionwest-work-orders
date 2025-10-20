# WPSG Client Setup - Production Deployment Guide

## Overview
This guide walks through setting up the Williams Property Services Group (WPSG) client on the production Render server.

## Background
WPSG is **not a client organization** - it's the **supplier/service provider**. The WPSG client entry in the database is used solely for **user management** of Williams Property staff (admin and staff users).

**Key Points:**
- WPSG users (admin/staff) can view and manage work orders across **ALL clients**
- No work orders should be assigned to `client_id = 8` (WPSG)
- WPSG is excluded from client filter dropdowns in the frontend

## Prerequisites
- SSH access to Render production server
- Environment variables properly configured (DB credentials)
- Latest code deployed to production

## Step-by-Step Deployment

### 1. Connect to Render Production Shell
```bash
# Via Render Dashboard: Select your service → Shell tab
# Or use Render CLI if configured
```

### 2. Navigate to Backend Directory
```bash
cd /opt/render/project/src/backend
# Or wherever your backend code is deployed
```

### 3. Check Current Migration Status
```bash
npm run migrate:status
```

Expected output should show which migrations are pending/completed.

### 4. Run Database Migrations
```bash
npm run migrate
```

This will run all pending migrations, including:
- Multi-client support migrations
- `password_changed` field addition
- Unique email-client index
- `is_urgent` field for work orders

**Important:** Migrations are idempotent - they won't re-run if already applied.

### 5. Verify Migration Success
```bash
npm run migrate:status
```

All migrations should now show as `up`.

### 6. Run WPSG Client Setup
```bash
npm run setup:wpsg
```

**Note:** As of the latest version, this script now automatically runs migrations first, so you could skip step 4 and just run this command.

### 7. Verify WPSG Setup

The script will output:
```
✅ WPSG client created: { id: 2, name: 'Williams Property Services Group', code: 'WPSG' }
✅ 4 users now belong to WPSG:
   - admin@williamspropertyservices.co.nz (admin)
   - staff@williamspropertyservices.co.nz (staff)
   - [other Williams Property users]
```

### 8. Test Login
1. Navigate to your production frontend URL
2. Login as `admin@williamspropertyservices.co.nz`
3. Verify you can:
   - See all work orders across all clients
   - Use the client filter dropdown (should NOT show WPSG)
   - Update work order statuses
   - Access admin panel

## Troubleshooting

### Error: "column password_changed does not exist"
**Cause:** Migrations haven't been run yet.

**Solution:** Run `npm run migrate` before `npm run setup:wpsg`

### Error: "WPSG client already exists"
**Not an error** - The script detects existing WPSG client and skips creation. It will still update user assignments.

### Error: "No Williams Property users found"
**Check:** Are there users with `@williamspropertyservices.co.nz` emails in the database?

**Solution:** Verify user emails in the database or create them manually first.

### Frontend Still Shows WPSG in Filter
**Cause:** Frontend using cached data or old code version.

**Solution:**
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
3. Verify backend code is latest version with WPSG exclusion in `client.controller.js`

## Database Schema Changes

### Clients Table
```sql
-- WPSG client entry
INSERT INTO clients (name, code, status, ...) 
VALUES ('Williams Property Services Group', 'WPSG', 'active', ...);
```

### Users Table Updates
```sql
-- Williams Property users assigned to WPSG
UPDATE users 
SET client_id = 8 
WHERE email LIKE '%williamspropertyservices%';
```

## Rollback Instructions

If you need to rollback the WPSG setup:

```bash
# Undo last migration
npm run migrate:undo

# Or undo all migrations (CAUTION!)
npm run migrate:undo:all
```

**Note:** Rolling back will lose data. Only do this in emergencies.

## Post-Deployment Verification Checklist

- [ ] WPSG client exists in `clients` table (code: 'WPSG')
- [ ] Williams Property users have `client_id = 8`
- [ ] Admin/staff can login successfully
- [ ] Dashboard shows combined stats across all clients
- [ ] Work order list shows all clients' work orders
- [ ] Client filter dropdown does NOT include WPSG
- [ ] Status update button appears for admin users
- [ ] Work order cancellation works for admin users

## Related Documentation

- `WPSG-CLARIFICATION.md` - Explains what WPSG is and why it exists
- `WPSG-IMPLEMENTATION-SUMMARY.md` - Technical implementation details
- `ACCESS-CONTROL-MODEL.md` - Full role-based access control documentation
- `DEPLOYMENT_GUIDE.md` - General deployment instructions

## Support

If issues persist after following this guide:
1. Check server logs on Render dashboard
2. Verify database connection and credentials
3. Review migration files in `backend/migrations/`
4. Check GitHub issues or contact development team
