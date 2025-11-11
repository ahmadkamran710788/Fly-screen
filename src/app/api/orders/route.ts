import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const url = new URL(req.url);
  const store = url.searchParams.get("store");
  const q = url.searchParams.get("q");
  const filter: any = {};
  if (store) filter.storeKey = store;
  if (q) filter.name = { $regex: q, $options: "i" };
  const orders = await OrderModel.find(filter).sort({ processedAt: -1 }).limit(1000).lean();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();
  const created = await OrderModel.create(body);
  return NextResponse.json(created, { status: 201 });
}


