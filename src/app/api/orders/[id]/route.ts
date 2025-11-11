import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";

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

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await connectToDatabase();
  const body = await req.json();
  const updated = await OrderModel.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await connectToDatabase();
  await OrderModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}


