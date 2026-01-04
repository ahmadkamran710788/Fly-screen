/**
 * Migration Script: Convert Old Status System to New 3-Status System
 *
 * This script migrates existing orders from the old single-status system to the new 3-status system.
 *
 * OLD SYSTEM:
 * - item.status: "Pending" | "Frame Cut Complete" | "Mesh Cut Complete" | "Ready for Packaging" | "Packed" | "Shipped"
 * - item.frameCutComplete: boolean
 * - item.meshCutComplete: boolean
 *
 * NEW SYSTEM:
 * - item.frameCuttingStatus: "Pending" | "Complete"
 * - item.meshCuttingStatus: "Pending" | "Complete"
 * - item.qualityStatus: "Pending" | "Ready to Package" | "Packed"
 * - order.status: "Pending" | "In Progress" | "Completed"
 *
 * MIGRATION LOGIC:
 * 1. If frameCutComplete === true OR old status includes "Frame" → frameCuttingStatus = "Complete"
 * 2. If meshCutComplete === true OR old status includes "Mesh" → meshCuttingStatus = "Complete"
 * 3. Map old status to qualityStatus:
 *    - "Packed" or "Shipped" → "Packed"
 *    - "Ready for Packaging" → "Ready to Package"
 *    - Otherwise → "Pending"
 * 4. Calculate overall order status from all items
 *
 * Run with: npx tsx src/scripts/migrate-order-statuses.ts
 */

import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";

// Helper function to calculate overall order status from all items
function calculateOrderStatus(
  lineItems: any[]
): "Pending" | "In Progress" | "Completed" {
  if (!lineItems || lineItems.length === 0) return "Pending";

  // Check if all items are packed
  const allPacked = lineItems.every(
    (item) => item.qualityStatus === "Packed"
  );
  if (allPacked) return "Completed";

  // Check if all items are still pending (all 3 statuses are pending)
  const allPending = lineItems.every(
    (item) =>
      item.frameCuttingStatus === "Pending" &&
      item.meshCuttingStatus === "Pending" &&
      item.qualityStatus === "Pending"
  );
  if (allPending) return "Pending";

  // Mixed statuses = In Progress
  return "In Progress";
}

// Map old item status to new qualityStatus
function mapQualityStatus(oldStatus: string): "Pending" | "Ready to Package" | "Packed" {
  const status = oldStatus?.toLowerCase() || "";

  if (status.includes("packed") || status.includes("shipped")) {
    return "Packed";
  }

  if (status.includes("ready for packaging")) {
    return "Ready to Package";
  }

  return "Pending";
}

// Migrate a single item
function migrateItem(item: any) {
  const oldStatus = item.status || "Pending";
  const oldFrameCutComplete = item.frameCutComplete || false;
  const oldMeshCutComplete = item.meshCutComplete || false;

  // Determine frameCuttingStatus
  let frameCuttingStatus: "Pending" | "Complete" = "Pending";
  if (oldFrameCutComplete || oldStatus.toLowerCase().includes("frame")) {
    frameCuttingStatus = "Complete";
  }

  // Determine meshCuttingStatus
  let meshCuttingStatus: "Pending" | "Complete" = "Pending";
  if (oldMeshCutComplete || oldStatus.toLowerCase().includes("mesh")) {
    meshCuttingStatus = "Complete";
  }

  // Determine qualityStatus
  const qualityStatus = mapQualityStatus(oldStatus);

  // Update the item with new fields
  item.frameCuttingStatus = frameCuttingStatus;
  item.meshCuttingStatus = meshCuttingStatus;
  item.qualityStatus = qualityStatus;

  // Keep old fields for backward compatibility
  // delete item.frameCutComplete;
  // delete item.meshCutComplete;
  // delete item.status;

  return item;
}

async function migrateOrderStatuses() {
  try {
    console.log("🚀 Starting migration to 3-status system...");
    await connectToDatabase();

    // Get all orders
    const orders = await OrderModel.find({});
    console.log(`📦 Found ${orders.length} orders to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Check if order already has new status fields
        const hasNewFields = order.lineItems.some(
          (item: any) =>
            item.frameCuttingStatus !== undefined ||
            item.meshCuttingStatus !== undefined ||
            item.qualityStatus !== undefined
        );

        if (hasNewFields) {
          console.log(`⏭️  Skipping order ${order.name || order.shopifyId} (already migrated)`);
          skippedCount++;
          continue;
        }

        // Migrate all line items
        order.lineItems.forEach((item: any, index: number) => {
          order.lineItems[index] = migrateItem(item);
        });

        // Calculate and set overall order status
        order.status = calculateOrderStatus(order.lineItems);

        // Save the migrated order
        await order.save();

        console.log(
          `✅ Migrated order ${order.name || order.shopifyId} - Status: ${order.status} (${order.lineItems.length} items)`
        );
        migratedCount++;
      } catch (itemError: any) {
        console.error(`❌ Error migrating order ${order.name || order.shopifyId}:`, itemError.message);
        errorCount++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migratedCount} orders`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} orders`);
    console.log(`❌ Errors: ${errorCount} orders`);
    console.log(`📦 Total: ${orders.length} orders`);
    console.log("\n🎉 Migration complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateOrderStatuses();

export { migrateOrderStatuses, migrateItem, mapQualityStatus, calculateOrderStatus };
