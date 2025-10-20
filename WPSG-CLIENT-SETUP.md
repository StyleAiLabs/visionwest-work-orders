# WPSG Client Setup Guide

## Problem
After multi-client migration, the admin/staff users with `@williamspropertyservices.co.nz` emails get assigned to VisionWest client by default, causing 500 errors on login:

```
User has no associated client organization. Please contact support.
```

## Solution
Run the `create-wpsg-client.js` script to:
1. Create Williams Property Services Group (WPSG) client
2. Assign Williams Property admin/staff users to WPSG client

## Steps for Dev Branch (Demo Server)

### 1. Deploy to Demo Server
```bash
# Make sure you're on dev branch
git checkout dev

# Push changes
git push origin dev
```

### 2. Run Setup Script on Render Demo Server

**Option A: Via Render Shell (Recommended)**
1. Go to Render Dashboard → Your Backend Service (demo)
2. Click "Shell" tab
3. Run:
```bash
npm run setup:wpsg
```

**Option B: Via One-Time Job**
1. Go to Render Dashboard → Your Backend Service (demo)
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. After deployment, go to Shell and run:
```bash
npm run setup:wpsg
```

### 3. Verify Setup

Check the output for:
```
✅ Database connection established
✅ WPSG client created: { id: 2, name: 'Williams Property Services Group', code: 'WPSG' }
✅ Updated admin@williamspropertyservices.co.nz (admin) -> WPSG client
✅ Updated staff@williamspropertyservices.co.nz (staff) -> WPSG client
✅ 2 users now belong to WPSG:
   - admin@williamspropertyservices.co.nz (admin)
   - staff@williamspropertyservices.co.nz (staff)
✅ Setup complete!
```

### 4. Test Login
Try logging in with:
- Email: `admin@williamspropertyservices.co.nz`
- Password: `password@123` (or your actual password)

Should now work without 500 errors!

## Steps for Main Branch (Production Server)

**ONLY run this after successful testing on dev/demo!**

### 1. Merge dev to main
```bash
git checkout main
git merge dev
git push origin main
```

### 2. Run Setup Script on Render Production Server

Same process as dev:
1. Go to Render Dashboard → Your Backend Service (production)
2. Click "Shell" tab
3. Run:
```bash
npm run setup:wpsg
```

### 3. Verify Production Setup

Same verification steps as dev.

## What This Script Does

```javascript
// 1. Creates WPSG client
{
  name: 'Williams Property Services Group',
  code: 'WPSG',
  status: 'active',
  primary_contact_email: 'admin@williamspropertyservices.co.nz'
}

// 2. Finds all Williams Property users
WHERE email LIKE '%williamspropertyservices%' OR email LIKE '%@wpsg.nz'

// 3. Updates their client_id to WPSG
UPDATE users SET client_id = <wpsg_client_id>
```

## Rollback (if needed)

If something goes wrong, you can manually revert users back to VisionWest:

```sql
-- Get VisionWest client ID
SELECT id FROM clients WHERE code = 'VISIONWEST';

-- Revert users (replace <visionwest_id> with actual ID)
UPDATE users 
SET client_id = <visionwest_id>
WHERE email LIKE '%@williamspropertyservices.co.nz';

-- Delete WPSG client (optional)
DELETE FROM clients WHERE code = 'WPSG';
```

## Database State After Setup

### Clients Table
```
| id | name                                  | code       | status |
|----|---------------------------------------|------------|--------|
| 1  | Visionwest                           | VISIONWEST | active |
| 2  | Williams Property Services Group     | WPSG       | active |
```

### Users Table (relevant rows)
```
| email                                    | role  | client_id |
|------------------------------------------|-------|-----------|
| admin@williamspropertyservices.co.nz    | admin | 2         |
| staff@williamspropertyservices.co.nz    | staff | 2         |
| admin@visionwest.org.nz                 | client_admin | 1   |
| tenant@visionwest.org.nz                | client | 1         |
```

## Troubleshooting

### "WPSG client already exists"
This is fine - the script is idempotent and will skip creation if it exists.

### "No Williams Property users found"
Check if users exist:
```sql
SELECT email, role, client_id FROM users 
WHERE email LIKE '%williamspropertyservices%';
```

If no users found, you may need to create them first using the appropriate user creation script.

### Login still fails
Check:
1. User has `client_id` set (not NULL)
2. Client with that ID exists and is `status='active'`
3. User's `is_active = true`

Query to debug:
```sql
SELECT u.email, u.role, u.is_active, u.client_id, c.name as client_name, c.status as client_status
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'admin@williamspropertyservices.co.nz';
```

## Related Files
- Script: `backend/scripts/create-wpsg-client.js`
- Package.json: Added `setup:wpsg` command
- Auth Controller: `backend/controllers/auth.controller.js` (line 45-56 checks client association)

## Version
- Added in: v2.8.0
- Date: October 20, 2025
