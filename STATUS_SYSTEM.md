# Order Status Management System

This document describes the comprehensive order status management system implemented in the application.

## Overview

The system implements **item-level status tracking** where each line item in an order has its own status, and the overall order status is automatically calculated based on the combined statuses of all items.

## Architecture

### 1. Database Schema

**Location:** [src/models/Order.ts](src/models/Order.ts)

Each line item now includes:
- `status`: Enum of possible statuses (see below)
- `frameCutComplete`: Boolean flag for frame cutting completion
- `meshCutComplete`: Boolean flag for mesh cutting completion

```typescript
lineItems: [{
  id: String,
  productId: String,
  // ... other fields
  status: {
    type: String,
    enum: [
      "Pending",
      "Frame Cut Complete",
      "Mesh Cut Complete",
      "Ready for Packaging",
      "Packed",
      "Shipped"
    ],
    default: "Pending"
  },
  frameCutComplete: { type: Boolean, default: false },
  meshCutComplete: { type: Boolean, default: false }
}]
```

### 2. API Endpoints

#### Update Item Status
**Endpoint:** `PATCH /api/orders/[id]/items/[itemId]`

**Location:** [src/app/api/orders/[id]/items/[itemId]/route.ts](src/app/api/orders/[id]/items/[itemId]/route.ts)

Updates an individual item's status and automatically recalculates the overall order status.

**Request Body:**
```json
{
  "status": "Frame Cut Complete",
  "frameCutComplete": true,
  "meshCutComplete": false
}
```

**Response:**
```json
{
  "success": true,
  "order": { /* updated order object */ },
  "message": "Item status updated successfully"
}
```

#### Real-Time Subscription
**Endpoint:** `GET /api/orders/[id]/subscribe`

**Location:** [src/app/api/orders/[id]/subscribe/route.ts](src/app/api/orders/[id]/subscribe/route.ts)

Server-Sent Events (SSE) endpoint for real-time updates. All users viewing the same order will receive live updates when any user changes an item status.

### 3. Status Calculation Logic

The overall order status is calculated based on ALL item statuses:

1. **Shipped**: All items have status "Shipped"
2. **Packed**: All items are "Packed" or "Shipped"
3. **Ready for Packaging**: All items are "Ready for Packaging", "Packed", or "Shipped"
4. **In Progress**: Any other combination

This logic is implemented in the `calculateOrderStatus()` function in the API endpoint.

### 4. Frontend Components

#### Order Detail Page
**Location:** [src/app/orders/[id]/page.tsx](src/app/orders/[id]/page.tsx)

Features:
- Status dropdown for each item
- Role-based permissions (Frame Cutting, Mesh Cutting, Quality, Admin)
- Optimistic updates (UI updates immediately, then syncs with backend)
- Real-time updates from other users via SSE
- Error handling with rollback on failure

#### Dashboard
**Location:** [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)

- Displays calculated order status for each order
- Status badge shows current state
- Filters by status work with the new system

### 5. Real-Time Sync System

**Hook:** [src/hooks/useOrderSync.ts](src/hooks/useOrderSync.ts)

Uses Server-Sent Events (SSE) for real-time synchronization:
- Establishes persistent connection to the server
- Receives updates when other users change statuses
- Automatically updates UI without page refresh
- Shows toast notification when updates occur

**How it works:**
1. User A changes item status → API updates database
2. API broadcasts update to all connected clients
3. User B (viewing same order) receives update via SSE
4. User B's UI updates automatically with toast notification

## Item Status Flow

```
Pending
  ↓
Frame Cut Complete (when frameCutComplete = true)
  ↓
Mesh Cut Complete (when meshCutComplete = true)
  ↓
Ready for Packaging (when both frame and mesh complete)
  ↓
Packed (manually set by Quality/Admin)
  ↓
Shipped (manually set by Quality/Admin)
```

## Role-Based Permissions

### Frame Cutting Role
- Can change status between: "Pending" ↔ "Frame Cut Complete"
- Can only edit items with these statuses

### Mesh Cutting Role
- Can change status between: "Pending" ↔ "Mesh Cut Complete"
- Can only edit items with these statuses

### Quality Role
- Can change status to any value
- Full access to all status transitions

### Admin Role
- Complete control over all statuses
- Can edit any item at any stage

## Migration

For existing orders without item-level statuses, run the migration script:

```bash
npx tsx src/scripts/migrate-order-statuses.ts
```

This will:
- Add default "Pending" status to all line items
- Set frameCutComplete and meshCutComplete to false
- Preserve existing data

## Testing the System

### Test Real-Time Sync
1. Open the same order in two different browser windows/tabs
2. Log in as different users (or same user)
3. Change an item's status in one window
4. Observe the status update automatically in the other window
5. A toast notification should appear: "Order Updated - Item status was updated by another user"

### Test Status Calculation
1. Create an order with multiple items
2. Set all items to "Shipped"
3. Verify order status shows "Shipped" in dashboard
4. Change one item back to "Pending"
5. Verify order status changes to "In Progress"

## Code Flow Example

When a user changes an item status:

```
User changes status dropdown
  ↓
handleStatusChange() called
  ↓
Optimistic UI update (instant feedback)
  ↓
PATCH /api/orders/[id]/items/[itemId]
  ↓
Database updated
  ↓
calculateOrderStatus() runs
  ↓
broadcastOrderUpdate() notifies all connected clients
  ↓
All users viewing the order receive SSE event
  ↓
UI updates with new status + toast notification
```

## Key Files

1. **Schema:** `src/models/Order.ts`
2. **API Endpoint:** `src/app/api/orders/[id]/items/[itemId]/route.ts`
3. **SSE Endpoint:** `src/app/api/orders/[id]/subscribe/route.ts`
4. **Order Detail Page:** `src/app/orders/[id]/page.tsx`
5. **Dashboard:** `src/app/dashboard/page.tsx`
6. **Sync Hook:** `src/hooks/useOrderSync.ts`
7. **Order Context:** `src/contexts/OrderContext.tsx`
8. **Migration Script:** `src/scripts/migrate-order-statuses.ts`

## Benefits

✅ **Granular Control**: Track status of each individual item
✅ **Automatic Calculation**: Order status automatically reflects item statuses
✅ **Real-Time Sync**: All users see updates instantly
✅ **Role-Based Access**: Different permissions for different roles
✅ **Optimistic Updates**: Instant UI feedback with error handling
✅ **Persistent Storage**: All status changes saved to database
✅ **Type Safe**: Full TypeScript support throughout

## Future Enhancements

- Add status change history/audit log
- Email notifications on status changes
- Bulk status updates for multiple items
- Custom status workflows per store
- Analytics dashboard for status progression
