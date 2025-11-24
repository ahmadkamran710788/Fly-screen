import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAuth } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// Force dynamic rendering for serverless
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

// POST - Add a new box to an order
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    await requireAuth(req);

    const { id } = await ctx.params;
    await connectToDatabase();

    const body = await req.json();
    const { length, width, height, weight, items } = body;

    // Validation
    if (!length || !width || !height || !weight) {
      return NextResponse.json(
        { error: "Box dimensions and weight are required" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create new box
    const newBox = {
      id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      length: Number(length),
      width: Number(width),
      height: Number(height),
      weight: Number(weight),
      items: items || [],
      createdAt: new Date(),
    };

    // Add box to order
    if (!order.boxes) {
      (order as any).boxes = [];
    }
    (order as any).boxes.push(newBox);

    // Save the order
    await order.save();

    // Revalidate to ensure fresh data
    try {
      revalidatePath("/api/orders");
      revalidatePath(`/api/orders/${id}`);
    } catch (error) {
      console.warn("⚠️ Revalidation warning (non-critical):", error);
    }

    return NextResponse.json({
      success: true,
      box: newBox,
      message: "Box added successfully",
    });
  } catch (error) {
    console.error("❌ Error adding box:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get all boxes for an order
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);

    const { id } = await ctx.params;
    await connectToDatabase();

    const order = await OrderModel.findById(id).select("boxes");
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      boxes: (order as any).boxes || [],
    });
  } catch (error) {
    console.error("❌ Error fetching boxes:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
