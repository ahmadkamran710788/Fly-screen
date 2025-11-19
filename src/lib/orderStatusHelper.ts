/**
 * Helper function to calculate order status based on line items
 */

interface LineItem {
  frameCuttingStatus?: string;
  meshCuttingStatus?: string;
  qualityStatus?: string;
}

export function calculateOrderStatus(
  lineItems: LineItem[]
): "Pending" | "In Progress" | "Completed" {
  if (!lineItems || lineItems.length === 0) {
    return "Pending";
  }

  // Check if all items have qualityStatus === "Packed"
  const allPacked = lineItems.every((item) => item.qualityStatus === "Packed");

  // Check if all items are still pending (all 3 statuses are pending)
  const allPending = lineItems.every(
    (item) =>
      item.frameCuttingStatus === "Pending" &&
      item.meshCuttingStatus === "Pending" &&
      item.qualityStatus === "Pending"
  );

  if (allPacked) {
    return "Completed";
  } else if (allPending) {
    return "Pending";
  } else {
    return "In Progress";
  }
}
