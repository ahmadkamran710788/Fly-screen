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

  // Check if all items are finished (all 5 statuses are Complete)
  const allPacked = lineItems.every(
    (item) =>
      item.frameCuttingStatus === "Complete" &&
      item.meshCuttingStatus === "Complete" &&
      item.qualityStatus === "Complete" &&
      item.assemblyStatus === "Complete" &&
      item.packagingStatus === "Complete"
  );
  if (allPacked) return "Completed";

  // Check if all items are still pending (all 5 statuses are Pending)
  const allPending = lineItems.every(
    (item) =>
      item.frameCuttingStatus === "Pending" &&
      item.meshCuttingStatus === "Pending" &&
      item.qualityStatus === "Pending" &&
      item.assemblyStatus === "Pending" &&
      item.packagingStatus === "Pending"
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
    const { frameCuttingStatus, meshCuttingStatus, qualityStatus, assemblyStatus, packagingStatus, role } = body;

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
      // Validation: Quality status can only be Complete if Frame and Mesh are Complete
      if (qualityStatus === "Complete") {
        const currentFrameStatus = frameCuttingStatus ?? item.frameCuttingStatus;
        const currentMeshStatus = meshCuttingStatus ?? item.meshCuttingStatus;

        if (currentFrameStatus !== "Complete" || currentMeshStatus !== "Complete") {
          return NextResponse.json(
            { error: "Quality can only be completed when both Frame and Mesh are Complete" },
            { status: 400 }
          );
        }
      }

      // Validation: Assembly status can only be Complete if Quality is Complete
      if (assemblyStatus === "Complete") {
        const currentQualityStatus = qualityStatus ?? item.qualityStatus;
        if (currentQualityStatus !== "Complete") {
          return NextResponse.json(
            { error: "Assembly can only be completed when Quality is Complete" },
            { status: 400 }
          );
        }
      }

      // Validation: Packaging status can only be Complete if Assembly is Complete
      if (packagingStatus === "Complete") {
        const currentAssemblyStatus = assemblyStatus ?? item.assemblyStatus;
        if (currentAssemblyStatus !== "Complete") {
          return NextResponse.json(
            { error: "Packaging can only be completed when Assembly is Complete" },
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
    if (assemblyStatus !== undefined) {
      order.lineItems[itemIndex].assemblyStatus = assemblyStatus;
    }
    if (packagingStatus !== undefined) {
      order.lineItems[itemIndex].packagingStatus = packagingStatus;
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
      assemblyStatus: order.lineItems[itemIndex].assemblyStatus,
      packagingStatus: order.lineItems[itemIndex].packagingStatus,
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
