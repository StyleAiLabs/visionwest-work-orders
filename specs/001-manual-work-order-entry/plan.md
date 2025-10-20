# Implementation Plan: Work Order Cancellation

**Branch**: `001-manual-work-order-entry` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-manual-work-order-entry/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds work order cancellation capability to the NextGen WOM system, allowing client, client_admin, and admin users to cancel work orders that are no longer needed. Cancellation is implemented as a permanent status change with confirmation dialog, audit trail, and role-based access control. The feature integrates with the existing status management system and follows all constitution principles for mobile-first design, multi-client isolation, and brand consistency.

## Technical Context

**Language/Version**: Node.js 18+ (backend), React 18+ (frontend)
**Primary Dependencies**: Express 4.x, Sequelize 6.x ORM, PostgreSQL 15+, React Router v6, Tailwind CSS 3.x
**Storage**: PostgreSQL (work_orders table with status ENUM, work_order_notes table for audit trail)
**Testing**: Backend manual testing via Postman/curl, Frontend browser testing (mobile Chrome/Safari)
**Target Platform**: Web (Progressive Web App) - Mobile-first responsive design
**Project Type**: Web application (frontend + backend monorepo)
**Performance Goals**: Status update response < 500ms, UI confirmation dialog < 100ms render, audit trail visible < 2 seconds
**Constraints**: Cancellation is permanent (no undo), confirmation dialog required (prevent accidents), detail page only (no list view cancellation)
**Scale/Scope**: Extends existing work order management (31 work orders currently, scalable to 10k+ multi-tenant)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Mobile-First Design**: Confirmation dialog uses mobile-friendly touch targets (44px+ buttons), status dropdown accessible on mobile, works on smartphone screens
- [x] **Multi-Client Data Isolation**: Cancellation respects existing client_id filtering in workOrder.controller.js, no changes to multi-tenant architecture needed
- [x] **Role-Based Access**: Uses existing auth.middleware.js permissions - client, client_admin, and admin only (staff excluded per spec clarification)
- [x] **Brand Consistency**: Confirmation dialog uses NextGen WOM colors (deep-navy for header, nextgen-green for confirm, red for cancel button), no hardcoded colors
- [x] **Environment Parity**: Status change logic identical across dev/staging/production, only database connection differs
- [x] **Release Documentation**: Version bump to 2.8.0 (MINOR - new cancellation feature), release notes prepared documenting cancellation capability
- [x] **Integration Resilience**: Cancellation is synchronous database operation (no external services), audit trail creation follows existing pattern in updateWorkOrderStatus

*If any checks fail, document in Complexity Tracking table below.*

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── controllers/
│   └── workOrder.controller.js      # Modify updateWorkOrderStatus() to handle cancellation
├── middleware/
│   └── auth.middleware.js           # Verify handleWorkOrderStatusUpdate allows cancellation
├── models/
│   └── workOrder.model.js           # Verify status ENUM includes 'cancelled'
└── routes/
    └── workOrder.routes.js          # No changes needed (PATCH /:id/status already exists)

frontend/
├── src/
│   ├── components/
│   │   └── workOrders/
│   │       ├── WorkOrderSummary.jsx         # Add cancel button/dropdown in status section
│   │       └── ConfirmCancelDialog.jsx      # New: confirmation dialog component
│   ├── pages/
│   │   └── WorkOrderDetailPage.jsx          # Add handleCancelWorkOrder function
│   ├── services/
│   │   └── workOrderService.js              # Verify updateWorkOrderStatus supports cancellation
│   └── utils/
│       └── constants.js                     # Verify STATUS_OPTIONS includes cancelled
```

**Structure Decision**: Web application structure with backend API and frontend PWA. Cancellation feature extends existing work order status management without new routes or database tables. Follows established patterns from urgent flag implementation (FR-024 through FR-027).

## Complexity Tracking

*No constitution violations. All checks pass.*

This feature follows existing patterns:
- Status management already implemented (pending/in-progress/completed/cancelled)
- Role-based middleware already configured (handleWorkOrderStatusUpdate)
- Audit trail pattern already established (WorkOrderNote creation in updateWorkOrderStatus)
- Confirmation dialogs already used in system (delete operations elsewhere)

Cancellation extends existing infrastructure without architectural changes.

