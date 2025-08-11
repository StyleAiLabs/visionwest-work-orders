# VisionWest Work Orders System - AI Coding Agent Instructions

## Architecture Overview

This is a full-stack property maintenance work order management system with:
- **Frontend**: React + Vite PWA with Tailwind CSS (deployed on Netlify)
- **Backend**: Node.js + Express API with PostgreSQL (deployed on Render)
- **Integration**: n8n workflow for email processing and SMS notifications

## Core Business Logic

### Role-Based Access Control
The system has 4 user roles with specific access patterns:
- `client`: VisionWest tenants (filtered by `authorized_email` matching user's email)
- `client_admin`: VisionWest housing admins (see all `@visionwest.org.nz` work orders)
- `staff`: Williams Property staff (see all work orders)
- `admin`: Williams Property admins (full system access)

**Critical**: Work order filtering is implemented in `backend/controllers/workOrder.controller.js` using role-specific `whereClause` logic. This pattern must be consistent across `getSummary()`, `getAllWorkOrders()`, and `getAuthorizedPersons()`.

### Database Relationships (Sequelize)
All models in `backend/models/` follow this relationship structure:
```javascript
// Users create/update everything
db.user.hasMany(db.workOrder, { foreignKey: 'created_by', as: 'createdWorkOrders' });
db.workOrder.belongsTo(db.user, { foreignKey: 'created_by', as: 'creator' });

// Work orders have many related entities
db.workOrder.hasMany(db.statusUpdate, { foreignKey: 'work_order_id', as: 'statusUpdates' });
db.workOrder.hasMany(db.photo, { foreignKey: 'work_order_id', as: 'photos' });
```

## Development Workflows

### Environment Management
- **Development**: `npm run dev` (uses `sequelize.sync({ alter: true })`)
- **Staging**: `npm run dev:staging` (uses staging database with authentication only)
- **Production**: `npm start` (migrates then starts)

Environment switching: `node scripts/set-env.js [staging|development]` copies appropriate `.env.*` file.

### Database Seeding
- Production users: `npm run setup` (creates VisionWest users)
- Development data: `node utils/seeder.js` (test users and work orders)
- Test credentials in `backend/README.md` under "Development Notes"

### API Authentication
All routes use `authMiddleware.verifyToken` + role-specific middleware:
```javascript
router.use(authMiddleware.verifyToken);
router.get('/', authMiddleware.isAnyValidRole, controller.method);
router.patch('/:id/status', authMiddleware.handleWorkOrderStatusUpdate, controller.updateStatus);
```

Status updates have special logic: clients can only set status to `'cancelled'`.

## Project-Specific Patterns

### Frontend Service Layer
API calls go through `frontend/src/services/api.js` with automatic JWT token injection:
```javascript
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
// Auto-adds Authorization: Bearer <token>
```

### Work Order Data Structure
Work orders have complex nested data that gets formatted in `workOrder.controller.js`:
```javascript
// Core fields: job_no, status, property_name, authorized_email
// Nested objects: supplier{name,phone,email}, property{name,address,phone}
// Related arrays: photos[], notes[], statusUpdates[]
```

### VisionWest Color Scheme (Tailwind)
Custom colors defined in `frontend/tailwind.config.js`:
- `vwblue` (#0075bf) - Primary brand color
- `vworange` (#F26522) - Accent color  
- `vw.green` (#99ca3f) - Secondary brand color

### File Upload Pattern
Photos use multer with S3 storage in `routes/photo.routes.js`:
```javascript
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10MB } });
router.post('/work-order/:workOrderId', upload.array('photos', 5), controller.uploadPhotos);
```

## Integration Points

### SMS Service
`backend/services/smsService.js` sends notifications via external webhook. Test endpoint: `/api/webhook/test-sms`

### PWA Configuration
Vite PWA plugin in `frontend/vite.config.js` with VisionWest branding and API caching strategy for offline support.

### Deployment Specifics
- **Backend**: Render with `Procfile: web: node server.js` and automatic migrations
- **Frontend**: Netlify with SPA routing (`/*` → `/index.html`)
- **CORS**: Configured for multiple domains in `server.js`

## Key Files for Architecture Understanding

- `backend/models/index.js` - Database relationships and connections
- `backend/controllers/workOrder.controller.js` - Role-based filtering logic
- `backend/middleware/auth.middleware.js` - JWT and role validation
- `frontend/src/context/AuthContext.jsx` - Client-side auth state
- `backend/server.js` - Environment detection and database initialization
- `database-erd.mermaid` - Complete database schema visualization

When implementing features, always consider role-based access control and maintain consistency between dashboard summaries and work order listings.
