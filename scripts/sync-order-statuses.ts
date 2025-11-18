import { connectToDatabase } from "../src/lib/mongodb";
import { OrderModel } from "../src/models/Order";

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

async function syncOrderStatuses() {
  try {
    console.log("🔄 Starting order status synchronization...");

    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to database");

    // Fetch all orders
    const orders = await OrderModel.find({});
    console.log(`📊 Found ${orders.length} orders to check`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const order of orders) {
      const currentStatus = order.status;
      const calculatedStatus = calculateOrderStatus(order.lineItems);

      if (currentStatus !== calculatedStatus) {
        console.log(
          `🔧 Updating order ${order.name}: ${currentStatus} → ${calculatedStatus}`
        );
        order.status = calculatedStatus;
        await order.save();
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    console.log("\n✅ Synchronization complete!");
    console.log(`📈 Updated: ${updatedCount} orders`);
    console.log(`✓ Unchanged: ${unchangedCount} orders`);
    console.log(`📊 Total: ${orders.length} orders`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing order statuses:", error);
    process.exit(1);
  }
}

// Run the sync
syncOrderStatuses();
