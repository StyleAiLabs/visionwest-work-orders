# Production Database Migrations Needed

## Current Status
The production database is **missing several columns and tables** that were added in development. This is causing 500 errors.

## Temporarily Disabled Features

To fix the immediate 500 errors, the following model fields have been **temporarily commented out**:

### WorkOrder Model
- `created_from_quote_id` (column doesn't exist in production)
- `quote_number` (column doesn't exist in production)

### Model Associations
- Quote ↔ WorkOrder relationship (uses missing foreign key)

## Required Migrations (In Order)

Run these migrations in production to restore full functionality:

```bash
# Connect to production database
NODE_ENV=production npx sequelize-cli db:migrate

# This will run ALL pending migrations:
# 1. 20251102000001-create-quotes-table.js
# 2. 20251102000002-create-quote-messages-table.js
# 3. 20251102000003-create-quote-attachments-table.js
# 4. 20251102000004-add-quote-fields-to-work-orders.js ⭐ CRITICAL
# 5. 20251102000005-add-itemized-breakdown-to-quotes.js
# 6. 20251102000006-add-work-type-to-quotes.js
# 7. 20251102000007-add-converted-to-quote-message-type-enum.js
# 8. 20251107000001-add-timestamps-to-photos.js
```

## After Running Migrations

Once migrations complete successfully, **uncomment** the following:

### 1. backend/models/workOrder.model.js (lines 100-115)
```javascript
// Uncomment these fields:
created_from_quote_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
        model: 'quotes',
        key: 'id'
    },
    comment: 'Reference to the quote that was converted to this work order'
},
quote_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Quote reference number (format: QTE-YYYY-###) for easy identification'
},
```

### 2. backend/models/index.js (lines 121-122)
```javascript
// Uncomment these associations:
db.quote.belongsTo(db.workOrder, { foreignKey: 'converted_to_work_order_id', as: 'workOrder' });
db.workOrder.hasOne(db.quote, { foreignKey: 'converted_to_work_order_id', as: 'sourceQuote' });
```

### 3. backend/models/photo.model.js
```javascript
// Change from:
timestamps: false

// To:
timestamps: true,
createdAt: 'createdAt',
updatedAt: 'updatedAt'
```

## Verification After Migration

1. Check that all migrations ran:
```sql
SELECT * FROM "SequelizeMeta" ORDER BY name;
```

Expected to see:
- 20251102000001-create-quotes-table.js
- 20251102000002-create-quote-messages-table.js
- 20251102000003-create-quote-attachments-table.js
- 20251102000004-add-quote-fields-to-work-orders.js ⭐
- 20251102000005-add-itemized-breakdown-to-quotes.js
- 20251102000006-add-work-type-to-quotes.js
- 20251102000007-add-converted-to-quote-message-type-enum.js
- 20251107000001-add-timestamps-to-photos.js

2. Verify columns exist:
```sql
\d work_orders
-- Should show: created_from_quote_id, quote_number

\d photos
-- Should show: createdAt, updatedAt
```

3. Test API endpoint:
```bash
curl https://vw-womapi-prod.onrender.com/api/work-orders?sort=latest&limit=5
# Should return 200 OK
```

## Current Fix (Temporary)

The hotfix deployed temporarily **disables** quote-related features to allow the core work orders functionality to work. Once migrations run, uncomment the fields to restore full functionality.

---

**Created:** 2025-11-07
**Priority:** HIGH - Run migrations ASAP to restore full functionality
