import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const store = url.searchParams.get("store");
  const filter: any = {};
  if (q) filter.title = { $regex: q, $options: "i" };
  if (store) filter.storeKey = store;
  const products = await ProductModel.find(filter).sort({ updatedAt: -1 }).limit(1000).lean();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();
  const created = await ProductModel.create(body);
  return NextResponse.json(created, { status: 201 });
}


