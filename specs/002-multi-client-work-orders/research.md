# Research: Multi-Client Work Order Management

**Feature**: Multi-Client Work Order Management
**Date**: 2025-10-17
**Purpose**: Document architectural decisions, best practices, and technical research for multi-tenant implementation

## Overview

This document captures research findings and technical decisions for transforming the VisionWest work order platform from single-tenant to multi-tenant (multi-client) architecture.

## Key Technical Decisions

### Decision 1: Client Scoping Strategy

**Decision**: Middleware-based automatic client scoping for all API endpoints

**Rationale**:
- **Consistency**: Every endpoint automatically filtered by client_id without developer intervention
- **Security**: Fail-secure default - forgot to filter? Middleware catches it
- **Maintainability**: Single point of control for multi-tenant logic
- **Performance**: Query-level filtering more efficient than application-level filtering

**Alternatives Considered**:
1. **Manual client filtering in each controller**
   - Rejected: Error-prone, easy to forget, inconsistent implementation
   - Risk: Developer oversight could leak data across clients

2. **Database-level row-level security (RLS)**
   - Rejected: PostgreSQL RLS adds complexity, harder to debug
   - Consideration: May revisit for additional security layer in future

3. **Separate databases per client**
   - Rejected: Operational complexity, backup/migration challenges
   - Cost: Linear scaling of database instances
   - Note: Common for enterprise SaaS but overkill for 10-100 clients

**Implementation Pattern**:
```javascript
// Middleware: backend/middleware/clientScoping.js
function clientScopingMiddleware(req, res, next) {
  // Extract client_id from JWT token (req.user.client_id)
  // Attach to request: req.clientId
  // Skip for webhook endpoints and admin with explicit client switching
}
```

**References**:
- Multi-Tenant Data Architecture: https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/storage-data
- Row-Level Security vs App-Level: https://www.citusdata.com/blog/2018/01/24/postgres-row-level-security-for-multitenancy/

### Decision 2: JWT Token Modification

**Decision**: Extend JWT payload to include `client_id` claim

**Rationale**:
- **Efficiency**: Client context available immediately after authentication
- **Stateless**: No database lookup required to determine user's client
- **Standard Practice**: JWT claims are designed for this use case
- **Backward Compatible**: Adding claims doesn't break existing token validation

**Alternatives Considered**:
1. **Store client_id in session/Redis**
   - Rejected: Adds state management complexity, requires Redis deployment
   - Benefit lost: Stateless JWT advantage eliminated

2. **Database lookup on every request**
   - Rejected: Performance impact (N+1 query problem)
   - Impact: 500ms budget includes DB query overhead

**Implementation Changes**:
```javascript
// backend/middleware/auth.middleware.js
// Existing: jwt.sign({ userId: user.id, role: user.role }, secret)
// New:      jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id }, secret)
```

**Security Consideration**:
- JWT signature prevents tampering of client_id
- Server MUST validate client_id matches user's actual client_id on sensitive operations
- Consider short token expiry (1-4 hours) to limit exposure if compromised

### Decision 3: Admin Client Context Switching

**Decision**: Session-based client context for admin users with explicit switching UI

**Rationale**:
- **Flexibility**: Admins need to view data for different clients
- **Audit Trail**: Track which admin accessed which client's data
- **User Experience**: Clear visual indicator of current client context

**Alternatives Considered**:
1. **URL-based client selection** (`/clients/:clientId/work-orders`)
   - Rejected: Cumbersome for frequent switching, breaks existing routing

2. **Separate admin account per client**
   - Rejected: Operational burden, defeats purpose of centralized management

3. **Query parameter** (`?client_id=123`)
   - Rejected: Easy to miss, doesn't persist across navigation

**Implementation Pattern**:
```javascript
// Frontend: context/ClientContext.jsx
const [selectedClientId, setSelectedClientId] = useState(
  localStorage.getItem('admin_selected_client') || user.client_id
);

// Backend: Modified middleware for admin role
if (req.user.role === 'admin' && req.headers['x-client-context']) {
  req.clientId = req.headers['x-client-context']; // Admin override
} else {
  req.clientId = req.user.clientId; // Normal user
}
```

**UX Considerations**:
- Mobile-first client switcher (dropdown/modal, NOT sidebar)
- Visual banner showing current client context
- Confirmation modal when switching to prevent accidents

### Decision 4: Database Migration Strategy

**Decision**: Four-step migration with nullable → required progression

**Rationale**:
- **Zero Downtime**: Application continues running during migration
- **Safety**: Can rollback at each step if issues detected
- **Validation**: Verify data integrity before enforcing constraints

**Migration Steps**:
1. **Add `clients` table** with Visionwest as first client
2. **Add nullable `client_id` columns** to `users` and `work_orders` tables
3. **Backfill data**: Assign all existing records to Visionwest client
4. **Add NOT NULL constraints and foreign keys** after verification

**Alternatives Considered**:
1. **Single-step migration with immediate NOT NULL**
   - Rejected: High risk of data loss if backfill fails
   - No rollback point between schema change and data migration

2. **Blue-green deployment with separate database**
   - Rejected: Overkill for this change, data synchronization complexity

**Sequelize Migration Pattern**:
```javascript
// Migration 1: Add clients table
await queryInterface.createTable('clients', { ... });
await queryInterface.bulkInsert('clients', [{
  name: 'Visionwest', code: 'VISIONWEST', ...
}]);

// Migration 2: Add columns (nullable)
await queryInterface.addColumn('users', 'client_id', {
  type: Sequelize.INTEGER,
  allowNull: true, // Initially nullable
  references: { model: 'clients', key: 'id' }
});

// Migration 3: Backfill (separate script for safety)
const visionwestClient = await Client.findOne({ where: { code: 'VISIONWEST' } });
await User.update({ client_id: visionwestClient.id }, { where: { client_id: null } });

// Migration 4: Enforce constraints
await queryInterface.changeColumn('users', 'client_id', {
  type: Sequelize.INTEGER,
  allowNull: false  // Now required
});
```

**Rollback Plan**:
- Each migration step has corresponding `down()` function
- Test rollback on staging environment
- Monitor application logs during migration window

### Decision 5: Foreign Key Cascade Behavior

**Decision**: `ON DELETE SET NULL` for user/work order → client relationship

**Rationale**:
- **Data Preservation**: Deleted clients don't cascade delete users/work orders
- **Audit Trail**: Orphaned records indicate historical client relationships
- **Recovery**: Accidentally deleted client can be restored without data loss

**Alternatives Considered**:
1. **ON DELETE CASCADE**
   - Rejected: Catastrophic data loss if client accidentally deleted
   - Risk: Entire organization's work orders gone in one action

2. **ON DELETE RESTRICT**
   - Rejected: Makes client deletion impossible (too restrictive)
   - Operational burden: Must manually reassign all users/work orders first

3. **Soft Delete (status column)**
   - Considered: May implement in addition to SET NULL
   - Benefit: Can "undelete" clients with all relationships intact

**Implementation**:
```javascript
// Sequelize model associations
Client.hasMany(User, { foreignKey: 'client_id', onDelete: 'SET NULL' });
Client.hasMany(WorkOrder, { foreignKey: 'client_id', onDelete: 'SET NULL' });
```

**Business Logic**:
- Application prevents client deletion if active users/work orders exist
- UI requires confirmation and shows count of affected records
- "Archive" feature preferred over deletion (soft delete)

### Decision 6: Indexing Strategy

**Decision**: Composite indexes on `(client_id, frequently_queried_column)`

**Rationale**:
- **Query Performance**: Most queries filter by client_id first, then other criteria
- **Cardinality**: client_id has low cardinality (10-100 values), benefits from composite index
- **Covering Index**: Some queries can be satisfied by index alone (no table lookup)

**Indexes to Create**:
```sql
-- Work orders: client_id + status (common filter)
CREATE INDEX idx_work_orders_client_status ON work_orders(client_id, status);

-- Work orders: client_id + job_no (uniqueness check)
CREATE INDEX idx_work_orders_client_job_no ON work_orders(client_id, job_no);

-- Users: client_id + role (role-based queries)
CREATE INDEX idx_users_client_role ON users(client_id, role);

-- Users: client_id + email (login lookup)
CREATE INDEX idx_users_client_email ON users(client_id, email);
```

**Performance Testing Required**:
- Baseline: Current work order list query performance
- Target: <10% degradation with client scoping
- Monitor: EXPLAIN ANALYZE on production-like data volumes

### Decision 7: Mobile-First Admin UI Components

**Decision**: Card-based layout with bottom sheet modals for mobile admin panel

**Rationale**:
- **Touch Targets**: 44x44px minimum (constitutional requirement)
- **One-Handed Operation**: Actions accessible with thumb
- **Visual Hierarchy**: Cards clearly separate client organizations
- **Progressive Enhancement**: Desktop gets additional features, not mobile as afterthought

**Component Architecture**:
```
ClientList.jsx
  - Mobile: Vertical scrolling cards, FAB for add client
  - Tablet: 2-column grid of cards
  - Desktop: 3-column grid with sidebar filters

ClientSwitcher.jsx
  - Mobile: Bottom sheet modal with search
  - Desktop: Dropdown with keyboard navigation

ClientForm.jsx
  - Mobile: Full-screen modal with header action buttons
  - Desktop: Centered modal (max-width: 600px)
```

**Design Patterns**:
- Material Design bottom sheets for mobile modals
- Tailwind breakpoints: sm (640px), md (768px), lg (1024px)
- Mobile-first CSS: Default styles for mobile, `@media (min-width)` for larger

**References**:
- Material Design Touch Targets: https://m2.material.io/design/usability/accessibility.html#layout-and-typography
- Mobile-First Admin Patterns: https://uxdesign.cc/mobile-first-admin-panels-876f1c38c5f4

## Best Practices Applied

### Multi-Tenant Security Checklist

1. **Always filter by client_id** - Middleware enforces this
2. **Validate client_id on writes** - Prevent cross-client modifications
3. **Include client_id in all audit logs** - Troubleshooting and compliance
4. **Test with multiple clients** - QA environment with 3+ test clients
5. **Monitor for client_id null/undefined** - Alert on orphaned records

### Sequelize Multi-Tenant Patterns

```javascript
// BAD: Manual filtering (easy to forget)
const workOrders = await WorkOrder.findAll({
  where: { status: 'pending', client_id: req.clientId }
});

// GOOD: Scoped model (automatic filtering)
const ClientWorkOrder = WorkOrder.scope({ method: ['forClient', req.clientId] });
const workOrders = await ClientWorkOrder.findAll({
  where: { status: 'pending' }
});

// Model definition with scope
WorkOrder.addScope('forClient', (clientId) => ({
  where: { client_id: clientId }
}));
```

### n8n Webhook Integration Preservation

**Critical**: Webhook endpoint MUST bypass client scoping middleware

```javascript
// backend/routes/workOrder.routes.js
router.post('/webhook/work-orders',
  verifyWebhookAuth,  // Custom auth for n8n (not JWT)
  async (req, res) => {
    // Hardcode Visionwest client_id for webhook-created work orders
    const visionwestClient = await Client.findOne({
      where: { code: 'VISIONWEST' }
    });
    req.body.client_id = visionwestClient.id;
    // ... rest of webhook handler
  }
);
```

**Testing Checklist**:
- [ ] n8n webhook creates work order → assigned to Visionwest client
- [ ] Visionwest users can see webhook-created work orders
- [ ] Other clients cannot see webhook-created work orders
- [ ] Webhook endpoint excluded from client scoping middleware

## Performance Considerations

### Query Optimization

**Before** (single-tenant):
```sql
SELECT * FROM work_orders WHERE status = 'pending' LIMIT 10;
-- Index: idx_work_orders_status
-- Performance: ~50ms
```

**After** (multi-tenant):
```sql
SELECT * FROM work_orders
WHERE client_id = 123 AND status = 'pending'
LIMIT 10;
-- Index: idx_work_orders_client_status (composite)
-- Target Performance: ~55ms (<10% degradation)
```

### Caching Strategy

**Client Metadata Caching**:
- Cache client name/code in localStorage (frontend)
- Cache client list for admins (5 min TTL)
- Invalidate on client create/update/delete

**Work Order List Caching**:
- PWA service worker caches per-client work order lists
- Cache key includes client_id: `work-orders-${clientId}`
- Existing offline strategy extends to multi-client

## Risk Mitigation

### Risk: Client Data Leakage

**Mitigations**:
1. Comprehensive test suite with multiple clients
2. Middleware coverage - fail-secure default
3. Security audit of all endpoints
4. Automated tests for cross-client access attempts

### Risk: Migration Data Loss

**Mitigations**:
1. Staging environment migration first
2. Database backup before production migration
3. Transactional migrations with rollback
4. Verification queries after each step

### Risk: Performance Degradation

**Mitigations**:
1. Load testing with production-like data volumes
2. Composite indexes on client_id + query columns
3. Query plan analysis (EXPLAIN ANALYZE)
4. Monitoring and alerting on slow queries

### Risk: n8n Integration Breakage

**Mitigations**:
1. Explicit webhook endpoint exclusion from middleware
2. Integration test suite for webhook scenarios
3. Staging environment testing with actual n8n workflow
4. Rollback plan if webhook fails post-deployment

## Open Questions & Future Considerations

### Resolved

✅ **Q: Should we support users belonging to multiple clients?**
- **A**: No for MVP. Users belong to exactly one client. Cross-client access limited to admin role with explicit context switching. Staff cross-client access is P2.

✅ **Q: How do we handle client deletion?**
- **A**: Soft delete preferred (status: 'archived'). Hard delete uses ON DELETE SET NULL to preserve data integrity.

✅ **Q: Should admin panel be mobile-first?**
- **A**: Yes, constitutional requirement. Field supervisors need mobile access.

### Future Enhancements (Out of Scope for P1)

- **Client-specific branding/theming**: Requires CSS variable system
- **Client-specific integrations**: n8n workflows per client
- **Client-specific SLA/reporting**: Dashboard customization
- **Billing/invoicing per client**: Separate feature entirely
- **Client self-service onboarding**: Signup flow + email verification

## References

- [Multi-Tenant SaaS Patterns (AWS)](https://aws.amazon.com/blogs/architecture/multi-tenancy-patterns-in-saas-architectures/)
- [PostgreSQL for Multi-Tenant Apps (Citus)](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)
- [Sequelize Scopes for Multi-Tenancy](https://sequelize.org/docs/v6/other-topics/scopes/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Mobile-First Design Principles](https://www.nngroup.com/articles/mobile-first-not-mobile-only/)

## Changelog

- 2025-10-17: Initial research document created
