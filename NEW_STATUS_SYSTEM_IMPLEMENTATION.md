# New 3-Status System Implementation Guide

## Overview
This document outlines the NEW status management system where each item has 3 separate statuses instead of one combined status.

## Status System Design

### Item-Level Statuses (3 per item)
1. **Frame Cutting Status**: `Pending` | `Ready to Package`
2. **Mesh Cutting Status**: `Pending` | `Ready to Package`
3. **Quality Status**: `Pending` | `Ready to Package` | `Packed`

### Overall Order Status (calculated)
- **Pending**: All items have all 3 statuses = "Pending"
- **In Progress**: Mixed statuses
- **Completed**: All items have qualityStatus = "Packed"

## Business Rules

### Frame Cutting Role
- Can change `frameCuttingStatus`: Pending ↔ Ready to Package
- **CANNOT** change if `qualityStatus === "Packed"`
- Can change if `qualityStatus === "Pending"` or `"Ready to Package"`

### Mesh Cutting Role
- Can change `meshCuttingStatus`: Pending ↔ Ready to Package
- **CANNOT** change if `qualityStatus === "Packed"`
- Can change if `qualityStatus === "Pending"` or `"Ready to Package"`

### Quality Role
- Can change `qualityStatus` ONLY if **BOTH** `frameCuttingStatus` and `meshCuttingStatus` are `"Ready to Package"`
- Status flow: Pending → Ready to Package → Packed
- Can add boxes when packing items

### Admin Role
- **Full control over ALL three statuses** for any item
- Can change `frameCuttingStatus`, `meshCuttingStatus`, and `qualityStatus` without any restrictions
- Bypasses ALL validation rules (can change even when Packed, can change Quality without Frame/Mesh being Ready)
- Can override all business logic restrictions

## Files Changed

### ✅ Completed
1. **src/models/Order.ts** - Updated schema with 3 statuses + boxes array
2. **src/types/order.ts** - New TypeScript types
3. **src/app/api/orders/[id]/items/[itemId]/route.ts** - New validation logic
4. **src/app/api/orders/[id]/boxes/route.ts** - Box management POST/GET
5. **src/app/api/orders/[id]/boxes/[boxId]/route.ts** - Box DELETE/PATCH
6. **src/contexts/OrderContext.tsx** - Updated with async API calls

### ⏳ Needs Update

#### 1. Order Detail Page Components
Files to update:
- `src/components/orderDetails/SawingView.tsx`
- `src/components/orderDetails/MeshCuttingView.tsx`
- `src/components/orderDetails/QualityView.tsx`

**Required Changes:**
- Remove references to `item.frameCutComplete` → use `item.frameCuttingStatus`
- Remove references to `item.meshCutComplete` → use `item.meshCuttingStatus`
- Remove references to `item.status` → use appropriate status field
- Add status dropdown/button for each role to change their respective status

#### 2. Main Order Detail Page
File: `src/app/orders/[id]/page.tsx`

**Required Changes:**
- Update data mapping to use new status fields
- Remove old `handleStatusChange` logic
- Add 3 separate handlers:
  - `handleFrameCuttingStatusChange(itemId, newStatus)`
  - `handleMeshCuttingStatusChange(itemId, newStatus)`
  - `handleQualityStatusChange(itemId, newStatus)`
- Each handler should call API with role-based validation
- Update real-time sync to handle new status fields

#### 3. Dashboard
File: `src/app/dashboard/page.tsx`

**Required Changes:**
- Map `status` field (now: Pending/In Progress/Completed)
- Update item mapping to include new status fields:
  ```typescript
  items: (o.lineItems || []).map((li: any, idx: number) => ({
    id: String(li.id || `${o.shopifyId}-${idx + 1}`),
    // ... other fields
    frameCuttingStatus: li.frameCuttingStatus || "Pending",
    meshCuttingStatus: li.meshCuttingStatus || "Pending",
    qualityStatus: li.qualityStatus || "Pending",
  }))
  ```

#### 4. Order Table Component
File: `src/components/OrderTable.tsx`

**Required Changes:**
- Update `getOverallStatus` function (currently checks old `item.status`)
- Should now check if all items have `qualityStatus === "Packed"` for Completed
- Remove old status calculation logic

#### 5. Order Filters
File: `src/components/OrderFilters.tsx`

**Required Changes:**
- Update status filter options to match new overall statuses:
  - Remove: "Frame Cut Complete", "Mesh Cut Complete", "Ready for Packaging", "Shipped"
  - Keep: "Pending", "Packed"
  - Add: "In Progress", "Completed"

#### 6. API Orders Route
File: `src/app/api/orders/route.ts`

**Required Changes:**
- Update status filtering to work with new enum values
- Filter by overall order status (Pending/In Progress/Completed)

#### 7. Real-Time Sync
File: `src/hooks/useOrderSync.ts`

**Required Changes:**
- Update event interface to include 3 status fields
- Handle broadcasts with new status fields:
  ```typescript
  interface OrderUpdateEvent {
    type: string;
    orderId: string;
    itemId?: string;
    frameCuttingStatus?: string;
    meshCuttingStatus?: string;
    qualityStatus?: string;
    orderStatus?: string;
    timestamp?: string;
  }
  ```

#### 8. Migration Script
File: `src/scripts/migrate-order-statuses.ts`

**Required Changes:**
- Complete rewrite to migrate old system to new 3-status system
- Map old data:
  - If `frameCutComplete === true` → `frameCuttingStatus = "Ready to Package"`
  - If `meshCutComplete === true` → `meshCuttingStatus = "Ready to Package"`
  - Map old `status` field to appropriate `qualityStatus`

## API Endpoints

### Item Status Update
```
PATCH /api/orders/[id]/items/[itemId]
Body: {
  frameCuttingStatus?: "Pending" | "Ready to Package",
  meshCuttingStatus?: "Pending" | "Ready to Package",
  qualityStatus?: "Pending" | "Ready to Package" | "Packed",
  role?: string
}
```

### Box Management
```
POST /api/orders/[id]/boxes
Body: { length, width, height, weight, items: [itemIds] }

GET /api/orders/[id]/boxes

DELETE /api/orders/[id]/boxes/[boxId]

PATCH /api/orders/[id]/boxes/[boxId]
Body: { length?, width?, height?, weight?, items? }
```

## UI Changes Needed

### Frame Cutting View
- Show current `frameCuttingStatus`
- Button/dropdown to toggle: Pending ↔ Ready to Package
- Disable if `qualityStatus === "Packed"`

### Mesh Cutting View
- Show current `meshCuttingStatus`
- Button/dropdown to toggle: Pending ↔ Ready to Package
- Disable if `qualityStatus === "Packed"`

### Quality View
- Show current `qualityStatus`
- Button/dropdown to change: Pending → Ready to Package → Packed
- **Enable only if** both Frame and Mesh are "Ready to Package"
- Show validation message if not ready

### Box Management
- Already functional with new API endpoints
- No changes needed to UI

## Testing Checklist

- [ ] Frame Cutter can change frameCuttingStatus
- [ ] Frame Cutter CANNOT change when quality is Packed
- [ ] Mesh Cutter can change meshCuttingStatus
- [ ] Mesh Cutter CANNOT change when quality is Packed
- [ ] Quality can change ONLY when both Frame and Mesh are Ready
- [ ] Overall status calculates correctly (Pending/In Progress/Completed)
- [ ] Box management persists to database
- [ ] Real-time sync works with new statuses
- [ ] Multiple users see status changes instantly
- [ ] Migration script successfully converts old data

## Next Steps

1. Update all component files listed in "⏳ Needs Update"
2. Test each role's permissions
3. Run migration script on existing data
4. Test real-time sync with multiple users
5. Verify box management integration

## Database Schema Reference

```typescript
lineItems: [{
  frameCuttingStatus: "Pending" | "Ready to Package",
  meshCuttingStatus: "Pending" | "Ready to Package",
  qualityStatus: "Pending" | "Ready to Package" | "Packed"
}]

boxes: [{
  id: String,
  length: Number,
  width: Number,
  height: Number,
  weight: Number,
  items: [String], // item IDs
  createdAt: Date
}]

status: "Pending" | "In Progress" | "Completed"
```
