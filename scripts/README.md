# Database Migration Scripts

## fix-order-statuses.ts

### Purpose
This script fixes the issue where order statuses in the database don't match the actual status calculated from line items. This causes incorrect filtering when using the status filter on the orders page.

### The Problem
- The database has a `status` field on each order ("Pending", "In Progress", "Completed")
- The UI recalculates status dynamically based on line items' individual statuses
- When line items are updated, the order's `status` field in the database was never updated
- This caused the status filter to show incorrect results

### The Solution
1. Added Mongoose middleware hooks to automatically update the order status when saving/updating
2. Created this migration script to fix existing orders in the database

### How to Run

1. Make sure you have your `.env` file configured with `MONGODB_URI`

2. Run the migration:
```bash
npx tsx scripts/fix-order-statuses.ts
```

### What It Does
- Connects to your MongoDB database
- Fetches all existing orders
- Recalculates the correct status for each order based on its line items:
  - **Completed**: All items have `qualityStatus === "Packed"`
  - **Pending**: All items have all three statuses as "Pending"
  - **In Progress**: Anything else
- Updates orders where the status has changed
- Provides a summary of changes made

### Expected Output
```
Connecting to MongoDB...
✅ Connected to MongoDB

Fetching all orders...
Found 150 orders
✓ Updated NL101-3756: Pending → Completed
✓ Updated DEM278-2027: Pending → In Progress
...
==================================================
Migration Complete!
==================================================
Total orders: 150
Updated: 42
Skipped (no change needed): 108

✅ Database connection closed
```

### After Running
- Existing orders will have the correct status in the database
- The status filter on the orders page will work correctly
- Future order updates will automatically maintain the correct status (via Mongoose middleware)
