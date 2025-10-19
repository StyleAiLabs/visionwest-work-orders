# Research & Technical Decisions: Admin Client Filter

**Feature**: 004-add-client-filter
**Date**: 2025-10-19
**Phase**: Phase 0 - Research

## Overview

This document captures technical research findings and architectural decisions for implementing the admin client filter feature. The research focused on understanding existing filtering patterns, client scoping mechanisms, and best practices for filter UI implementation.

## Technical Decisions

### Decision 1: Backend API Approach

**Decision**: Reuse existing `X-Client-Context` header mechanism for admin client filtering

**Rationale**:
- The backend already implements client context switching via the `X-Client-Context` header in `backend/middleware/clientScoping.js`
- The `workOrderService.js` already supports passing `clientId` parameter to API calls
- No new authentication or authorization logic needed
- Maintains consistency with existing multi-tenant architecture

**Alternatives Considered**:
1. **New query parameter `?client_id=X`**: Rejected because it duplicates the existing header-based approach and requires additional middleware modifications
2. **Separate admin-only endpoint `/api/admin/work-orders`**: Rejected as over-engineering; existing endpoint already handles admin access with proper headers

**Implementation Notes**:
- Backend work order controller already respects `X-Client-Context` header
- Frontend service `workOrderService.getWorkOrders(filters, clientId)` already implements the pattern
- Only need to add UI layer to expose this functionality to admin users

---

### Decision 2: Frontend Component Architecture

**Decision**: Create standalone `ClientFilter.jsx` component following the pattern of `AuthorizedPersonFilter.jsx`

**Rationale**:
- Consistent with existing filter component design
- Reusable and maintainable
- Easy to test independently
- Mobile-first design can be encapsulated within component

**Alternatives Considered**:
1. **Inline filter in WorkOrdersPage**: Rejected because it reduces reusability and violates separation of concerns
2. **Global filter context provider**: Rejected as over-engineering for P1 MVP; can be added in P2/P3 if state management becomes complex

**Component API**:
```jsx
<ClientFilter
  selectedClientId={clientId}
  onClientChange={(clientId) => handleClientChange(clientId)}
  userRole={user.role}
/>
```

---

### Decision 3: Client List Endpoint Design

**Decision**: Create new endpoint `GET /api/clients` returning active clients sorted alphabetically

**Rationale**:
- Simple, RESTful design
- Clients table already exists with all necessary fields (id, name, code, status)
- Sorting alphabetically matches user expectation for dropdown lists
- Active status filter prevents showing deactivated/deleted clients

**Alternatives Considered**:
1. **Embed client list in work orders response**: Rejected because it adds unnecessary data to every work order query
2. **Client list with work order counts**: Deferred to P2/P3 enhancement; P1 focuses on basic filtering

**Response Schema**:
```json
{
  "clients": [
    {
      "id": 1,
      "name": "VWCT",
      "code": "VWCT",
      "status": "active"
    }
  ]
}
```

---

### Decision 4: Pagination Reset Behavior

**Decision**: Reset to page 1 and recalculate total pages whenever client filter changes

**Rationale**:
- Standard UX pattern for filter changes
- Prevents confusion from staying on page 5 when filtered results only have 2 pages
- Matches behavior of other filter implementations
- Clarified during specification phase

**Implementation**:
- Frontend: Reset `page` state to 1 in `handleClientChange`
- Backend: Work order query automatically returns correct total count based on filters
- Pagination component re-renders with new total pages

---

### Decision 5: Authorized Person Filter Interaction

**Decision**: Automatically clear authorized person filter when switching clients if selected person doesn't exist in new client

**Rationale**:
- Prevents displaying empty results with active but meaningless filter
- Better UX than showing "no results" with confusing filter state
- Clarified during specification phase

**Implementation Approach**:
1. Frontend maintains list of authorized persons per client
2. When client changes, check if current authorized person exists in new client's list
3. If not found, clear authorized person filter and show all work orders for new client
4. If found (person works with multiple clients), maintain selection

---

### Decision 6: Default Client Selection

**Decision**: Default to "All Clients" option on initial page load

**Rationale**:
- Admin users typically need overview of all work orders across clients
- Avoids arbitrarily focusing on one client
- Provides complete picture before drilling down
- Clarified during specification phase

**Implementation**:
- "All Clients" represented as `clientId = null` or `clientId = 'all'` in state
- When "All Clients" selected, do NOT include `X-Client-Context` header
- Backend returns work orders from all clients when header is absent (for admin users)

---

### Decision 7: Mobile-First UI Design

**Decision**: Implement dropdown as native HTML `<select>` with Tailwind styling for mobile optimization

**Rationale**:
- Native `<select>` provides optimal mobile experience (OS-native picker)
- Better touch targets and accessibility than custom dropdown
- Consistent with existing AuthorizedPersonFilter implementation
- Supports keyboard navigation

**Alternatives Considered**:
1. **Custom React dropdown library (e.g., react-select)**: Rejected as over-engineering; adds bundle size and complexity
2. **Custom dropdown with Headless UI**: Deferred to P2/P3 if advanced features needed

**Mobile Considerations**:
- Label positioned above select for narrow screens
- Full width on mobile (w-full), fixed width on desktop (w-64)
- Minimum touch target height: 44px
- Large font size for readability (text-base minimum)

---

### Decision 8: Empty State Messaging

**Decision**: Display "No work orders found for [Client Name]" when filtered client has no work orders

**Rationale**:
- Clear communication of empty state
- Shows user their filter is active (not a system error)
- Contextual message includes selected client name
- Clarified during specification phase

**Implementation**:
- Frontend checks if `workOrders.length === 0 && clientId !== null`
- Renders empty state component with client name interpolated
- Maintains filter UI so user can easily switch to different client

---

## Best Practices Applied

### React State Management
- Use local component state for P1 MVP (useState hooks)
- Lift state to parent (WorkOrdersPage) to coordinate filters
- Avoid premature optimization with global state management

### API Design
- Follow REST conventions
- Use existing authentication/authorization patterns
- Minimal payload sizes for mobile networks
- Leverage existing backend infrastructure

### Security
- Admin-only feature enforced via existing RBAC
- No additional authentication logic needed
- Client list endpoint requires JWT token with admin role
- Existing middleware handles authorization

### Mobile Performance
- Native UI controls for optimal mobile experience
- Minimize re-renders with proper React keys
- Debounce not needed (dropdown is discrete selection, not text input)
- Leverage existing pagination to limit data transfer

### Testing Strategy
- Manual testing on physical iOS/Android devices
- Test all responsive breakpoints (320px, 375px, 390px, 414px)
- Verify touch interactions (tap, scroll in dropdown)
- Integration testing with existing work order list
- Verify n8n webhook unaffected

---

## Open Questions Resolved

1. **Q: Should client filter be a separate route?**
   A: No, extend existing `/work-orders` page with additional filter control

2. **Q: Should we cache client list locally?**
   A: No for P1 MVP; fetch on page load. Can add caching in P2/P3 if performance issue identified

3. **Q: How to handle admin switching clients rapidly?**
   A: Each selection triggers new API call; no debouncing needed as dropdowns are discrete actions

4. **Q: Should dashboard summary counts respect client filter?**
   A: Yes, per FR-007. Dashboard should show counts for selected client only

---

## Dependencies Confirmed

### Existing Infrastructure (No Changes Needed)
- PostgreSQL clients table (id, name, code, status)
- PostgreSQL work_orders table with client_id foreign key
- Sequelize ORM models (Client, WorkOrder)
- JWT authentication middleware
- Client scoping middleware (clientScoping.js)
- Existing work order controller and routes

### New Components Required
- `frontend/src/components/workOrders/ClientFilter.jsx`
- `frontend/src/services/clientService.js`
- `backend/controllers/client.controller.js`
- `backend/routes/client.routes.js`

### Modified Components Required
- `frontend/src/pages/WorkOrdersPage.jsx` (add client filter state)
- `frontend/src/components/workOrders/AuthorizedPersonFilter.jsx` (clear when client changes)
- `frontend/src/services/workOrderService.js` (ensure clientId parameter used)
- `backend/controllers/workOrder.controller.js` (verify X-Client-Context handling)

---

## Risk Assessment

### Low Risk
- ✓ Reusing existing patterns and infrastructure
- ✓ No database schema changes
- ✓ No breaking changes to existing APIs
- ✓ Additive feature (doesn't modify existing behavior for non-admin users)

### Medium Risk
- ⚠️ Authorized person filter clearing logic (edge case handling)
- ⚠️ Mobile UI testing requires physical devices

### Mitigation Strategies
- Thoroughly test filter interaction scenarios
- Create manual testing checklist for mobile devices
- Test with multiple clients and varying work order distributions
- Verify performance with large client lists (50+ clients)

---

## Performance Considerations

### Expected Performance
- Client list fetch: <200ms (small dataset, ~10-50 clients)
- Filtered work order fetch: <500ms (existing query with additional WHERE clause)
- UI rendering: <100ms (simple dropdown component)
- Total filter application: <2 seconds (per success criteria)

### Optimization Opportunities (Deferred to P2/P3)
- Cache client list in localStorage
- Prefetch client list on login
- Add client work order counts to dropdown (requires JOIN query)
- Implement optimistic UI updates

---

## Conclusion

All technical decisions support a straightforward implementation that reuses existing infrastructure, maintains consistency with established patterns, and delivers the P1 MVP functionality without unnecessary complexity. The feature is well-scoped, low-risk, and ready for Phase 1 design artifact generation.
