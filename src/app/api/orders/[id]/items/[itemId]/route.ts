import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAuth } from "@/lib/auth-helper";
import { broadcastOrderUpdate } from "../../subscribe/route";
import { revalidatePath } from "next/cache";

// Force dynamic rendering for serverless
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

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

// PATCH endpoint to update individual item status
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    const { id, itemId } = await ctx.params;
    await connectToDatabase();

    const body = await req.json();
    const { frameCuttingStatus, meshCuttingStatus, qualityStatus, role } = body;

    // Find the order
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the item
    const itemIndex = order.lineItems.findIndex(
      (item: any) => item.id === itemId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = order.lineItems[itemIndex] as any;

    // Admin role bypasses all validation
    const isAdmin = user.role === "Admin" || role === "Admin";

    if (!isAdmin) {
      // Validation: Check if Quality status is "Packed"
      // If packed, Frame Cutting and Mesh Cutting cannot change their statuses
      if (item.qualityStatus === "Packed") {
        if (frameCuttingStatus !== undefined || meshCuttingStatus !== undefined) {
          return NextResponse.json(
            {
              error:
                "Cannot change Frame or Mesh status when item is already Packed",
            },
            { status: 400 }
          );
        }
      }

      // Validation: Quality can only change status if both Frame and Mesh are "Ready to Package"
      if (qualityStatus !== undefined && qualityStatus !== "Pending") {
        const currentFrameStatus =
          frameCuttingStatus ?? item.frameCuttingStatus ?? "Pending";
        const currentMeshStatus =
          meshCuttingStatus ?? item.meshCuttingStatus ?? "Pending";

        if (
          currentFrameStatus !== "Ready to Package" ||
          currentMeshStatus !== "Ready to Package"
        ) {
          return NextResponse.json(
            {
              error:
                "Quality status can only be changed when both Frame and Mesh cutting are Ready to Package",
            },
            { status: 400 }
          );
        }
      }
    }

    // Update the item statuses
    if (frameCuttingStatus !== undefined) {
      order.lineItems[itemIndex].frameCuttingStatus = frameCuttingStatus;
    }
    if (meshCuttingStatus !== undefined) {
      order.lineItems[itemIndex].meshCuttingStatus = meshCuttingStatus;
    }
    if (qualityStatus !== undefined) {
      order.lineItems[itemIndex].qualityStatus = qualityStatus;
    }

    // Calculate and update overall order status
    order.status = calculateOrderStatus(order.lineItems);

    // Save the order
    await order.save();

    // Broadcast the update to all connected clients
    broadcastOrderUpdate(id, {
      type: "itemStatusUpdated",
      orderId: id,
      itemId,
      frameCuttingStatus: order.lineItems[itemIndex].frameCuttingStatus,
      meshCuttingStatus: order.lineItems[itemIndex].meshCuttingStatus,
      qualityStatus: order.lineItems[itemIndex].qualityStatus,
      orderStatus: order.status,
      timestamp: new Date().toISOString(),
    });

    // Revalidate orders listing and detail pages to ensure fresh data
    try {
      revalidatePath("/api/orders");
      revalidatePath(`/api/orders/${id}`);
    } catch (error) {
      console.warn("⚠️ Revalidation warning (non-critical):", error);
    }

    return NextResponse.json({
      success: true,
      order: order.toObject(),
      message: "Item status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating item status:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
