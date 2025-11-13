import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAuth } from "@/lib/auth-helper";

// DELETE - Remove a box from an order
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; boxId: string }> }
) {
  try {
    // Authenticate user
    await requireAuth(req);

    const { id, boxId } = await ctx.params;
    await connectToDatabase();

    // Find the order
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find and remove the box
    const boxes = (order as any).boxes || [];
    const boxIndex = boxes.findIndex((box: any) => box.id === boxId);

    if (boxIndex === -1) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    boxes.splice(boxIndex, 1);
    (order as any).boxes = boxes;

    // Save the order
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Box deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting box:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a box
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; boxId: string }> }
) {
  try {
    await requireAuth(req);

    const { id, boxId } = await ctx.params;
    await connectToDatabase();

    const body = await req.json();
    const { length, width, height, weight, items } = body;

    // Find the order
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the box
    const boxes = (order as any).boxes || [];
    const boxIndex = boxes.findIndex((box: any) => box.id === boxId);

    if (boxIndex === -1) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    // Update box properties
    if (length !== undefined) boxes[boxIndex].length = Number(length);
    if (width !== undefined) boxes[boxIndex].width = Number(width);
    if (height !== undefined) boxes[boxIndex].height = Number(height);
    if (weight !== undefined) boxes[boxIndex].weight = Number(weight);
    if (items !== undefined) boxes[boxIndex].items = items;

    (order as any).boxes = boxes;

    // Save the order
    await order.save();

    return NextResponse.json({
      success: true,
      box: boxes[boxIndex],
      message: "Box updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating box:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
