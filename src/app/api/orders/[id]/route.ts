import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { revalidatePath } from "next/cache";

// Force dynamic rendering for serverless
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await connectToDatabase();
  let doc = await OrderModel.findById(id).lean();
  if (!doc) {
    // Also allow lookup by Shopify order id string
    doc = await OrderModel.findOne({ shopifyId: id }).lean();
  }
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await connectToDatabase();
  const body = await req.json();

  const updated = await OrderModel.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  // Revalidate to ensure fresh data
  try {
    revalidatePath("/api/orders");
    revalidatePath(`/api/orders/${id}`);
  } catch (error) {
    console.warn("⚠️ Revalidation warning (non-critical):", error);
  }

  return NextResponse.json(updated);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await connectToDatabase();
  const body = await req.json();
  const updated = await OrderModel.findByIdAndUpdate(id, body, { new: true });

  // Revalidate to ensure fresh data
  try {
    revalidatePath("/api/orders");
    revalidatePath(`/api/orders/${id}`);
  } catch (error) {
    console.warn("⚠️ Revalidation warning (non-critical):", error);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await connectToDatabase();
  await OrderModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}


