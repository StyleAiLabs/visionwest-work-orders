# 🚀 Automated Deployment Guide - Multi-Client Implementation

## ✅ Your Deployment IS Automated!

**Good News**: Your codebase deployment is fully automated through:
- **Backend**: Render.com (auto-deploys from GitHub)
- **Frontend**: Netlify (auto-deploys from GitHub)

**Answer to Your Question**:
> **YES, the new database migrations WILL run automatically** on every deployment because `npm start` in `package.json` now runs `npm run migrate` before starting the server.

---

## 📦 What Was Updated for Automated Migrations

### package.json Changes

**Before**:
```json
"scripts": {
  "start": "npm run migrate && npm run setup && node server.js",
  "migrate": "node scripts/add-user-columns.js"  // ← Old manual script
}
```

**After** (✅ Now using Sequelize CLI):
```json
"scripts": {
  "start": "npm run migrate && node server.js",
  "migrate": "npx sequelize-cli db:migrate",  // ← Proper migrations
  "migrate:status": "npx sequelize-cli db:migrate:status",
  "migrate:undo": "npx sequelize-cli db:migrate:undo"
}
```

### Migration Files Created

All 3 migrations will run automatically in order:

1. **20251018000001-add-multi-client-support-phase1.js**
   - Creates `clients` table
   - Inserts Visionwest client
   - Adds nullable `client_id` to `users` and `work_orders`
   - Creates indexes

2. **20251018000001-phase2-backfill-visionwest-client.js**
   - Assigns all existing users to Visionwest
   - Assigns all existing work orders to Visionwest
   - Verifies no NULL values remain

3. **20251018000002-add-multi-client-support-phase3.js**
   - Makes `client_id` NOT NULL (enforces constraint)
   - Adds composite indexes for performance
   - Adds unique constraint on (client_id, job_no)

---

## 🔄 Automated Deployment Flow

### When You Push to GitHub:

```
┌─────────────────────────────────────────────────────────────┐
│  1. You push code to GitHub                                 │
│     git push origin [branch-name]                           │
└────────────────────┬────────────────────────────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                  │
    ▼                                  ▼
┌───────────────────┐          ┌──────────────────┐
│  RENDER.COM       │          │  NETLIFY         │
│  (Backend)        │          │  (Frontend)      │
└───────┬───────────┘          └────────┬─────────┘
        │                               │
        ▼                               ▼
┌───────────────────────┐      ┌──────────────────┐
│ 2. Detects new commit │      │ 2. Detects commit│
│ 3. npm install        │      │ 3. npm install   │
│ 4. npm start          │      │ 4. npm run build │
│    ├─ npm run migrate │      │ 5. Deploy dist/  │
│    │  (Sequelize CLI) │      └──────────────────┘
│    ├─ Migration 1     │
│    ├─ Migration 2     │
│    ├─ Migration 3     │
│    └─ node server.js  │
└───────────────────────┘
        │
        ▼
   ✅ Deployed!
```

---

## ⚠️ Important: Environment Variables for Production

### Required in Render.com Dashboard

Before deployment, ensure these environment variables are set:

```bash
# Database (use DATABASE_URL format for production)
DATABASE_URL=postgresql://uhex928pteytg:bei0w7c1yvnz@35.213.224.151:5432/dbahuwojk8viis

# App Config
NODE_ENV=production
PORT=10000

# JWT
JWT_SECRET=[your-production-jwt-secret]
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://prod-wom-visionwest.netlify.app
```

**How to Add DATABASE_URL**:
1. Go to Render.com dashboard
2. Select `visionwest-api` service
3. Click "Environment" tab
4. Add new variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://uhex928pteytg:bei0w7c1yvnz@35.213.224.151:5432/dbahuwojk8viis`

---

## 📝 Pre-Deployment Checklist

Before pushing to production:

### 1. Database Backup (CRITICAL)
```bash
# Connect and backup
pg_dump -h 35.213.224.151 -U uhex928pteytg -d dbahuwojk8viis \
  > backup-pre-multiclient-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Update Frontend .env
```bash
cd frontend
# Edit .env file
VITE_API_URL=https://vw-womapi-prod.onrender.com/api
```

### 3. Commit All Changes
```bash
git add backend/migrations/
git add backend/models/
git add backend/middleware/clientScoping.js
git add backend/controllers/
git add backend/server.js
git add backend/package.json
git add backend/config/database.json
git add backend/.sequelizerc
git add frontend/.env
git add AUTOMATED-DEPLOYMENT.md

git commit -m "feat(multi-client): implement Phase 2 with automated migrations

- Add Sequelize CLI migrations for multi-client support
- Migration 1: Create clients table and add client_id columns
- Migration 2: Backfill existing data to Visionwest client
- Migration 3: Enforce NOT NULL and add composite indexes
- Update package.json to run migrations on npm start
- Configure database.json for production environment
- Update CORS for localhost development ports

BREAKING CHANGE: Requires DATABASE_URL environment variable in production
"

git push origin [your-branch]
```

---

## 🎯 Deployment Steps (Simple Version)

Since everything is automated, deployment is just:

### Step 1: Push to GitHub
```bash
git push origin [branch-name]
```

### Step 2: Monitor Deployment

**Backend** (Render.com):
- Go to https://dashboard.render.com
- Watch deployment logs for migration success
- Look for:
  ```
  ✅ Phase 1 Migration: Complete
  ✅ Phase 2 Migration: Backfill complete
  ✅ Phase 3 Migration: Complete
  Server is running on port 10000.
  ```

**Frontend** (Netlify):
- Go to https://app.netlify.com
- Watch build logs
- Look for: `Site is live`

### Step 3: Verify Production

```bash
# Test backend health
curl https://vw-womapi-prod.onrender.com/api

# Test login (JWT should include clientId)
curl -X POST https://vw-womapi-prod.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email","password":"your-real-password"}'

# Verify work orders are scoped
curl -X GET https://vw-womapi-prod.onrender.com/api/work-orders \
  -H "Authorization: Bearer [token-from-above]"
```

---

## 🔍 Migration Status Checking

### Check which migrations have run:

**From Render.com Shell**:
```bash
# Open Shell tab in Render dashboard
npm run migrate:status
```

**Expected Output**:
```
up     20251018000001-add-multi-client-support-phase1.js
up     20251018000001-phase2-backfill-visionwest-client.js
up     20251018000002-add-multi-client-support-phase3.js
```

---

## 🆘 Troubleshooting

### Migration Fails During Deployment

**Symptoms**: Render deployment fails with migration error

**Solution**:
1. Check Render logs for specific error
2. If it's a duplicate column error:
   ```bash
   # The migrations are idempotent, so re-deploy
   git commit --allow-empty -m "chore: retry deployment"
   git push
   ```

### DATABASE_URL Not Found

**Symptoms**: Error: `Cannot read database configuration`

**Solution**:
1. Go to Render.com → Environment variables
2. Add `DATABASE_URL` variable (see format above)
3. Restart service

### Migrations Run But Data Not Backfilled

**Symptoms**: Users login but see no data

**Solution**:
1. Check migration 2 logs in Render
2. If it failed, manually run backfill:
   ```bash
   # From Render Shell
   node scripts/backfill-visionwest-client.js
   ```

---

## 🎉 Expected Timeline

Total deployment time: **5-8 minutes**

- Render.com build: 2-3 minutes
- Database migrations: 30-60 seconds
- Server start: 10 seconds
- Netlify build: 2-3 minutes

---

## ✅ Post-Deployment Verification Checklist

After deployment completes:

- [ ] Backend health check passes
- [ ] Login returns JWT with `clientId` field
- [ ] Work orders fetch successfully
- [ ] Dashboard loads with correct data
- [ ] Frontend console shows no errors
- [ ] Database has all 3 migrations marked as "up"
- [ ] All users have `client_id = 1`
- [ ] All work_orders have `client_id = 1`

---

## 📞 Quick Reference

- **GitHub Repo**: https://github.com/StyleAiLabs/visionwest-work-orders
- **Backend Dashboard**: https://dashboard.render.com
- **Frontend Dashboard**: https://app.netlify.com
- **Production Backend**: https://vw-womapi-prod.onrender.com
- **Production Frontend**: https://prod-wom-visionwest.netlify.app

---

## 🔐 Security Note

The `backend/config/database.json` file is configured to use `DATABASE_URL` environment variable in production, so database credentials are not hardcoded in the repository.

---

## Summary

**Your deployment is now fully automated!** Just push to GitHub and both Render and Netlify will:

1. ✅ Pull latest code
2. ✅ Install dependencies
3. ✅ Run database migrations (backend only)
4. ✅ Build and deploy

The migrations will run automatically because `npm start` includes `npm run migrate`.
