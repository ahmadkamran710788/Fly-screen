// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAuth } from "@/lib/auth-helper";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";

export async function GET(req: NextRequest) {
  try {
    // Run auth and DB connect in parallel
    const [user] = await Promise.all([requireAuth(req), connectToDatabase()]);

    // Fetch minimal data (project only key fields)
    const orders = await OrderModel.find(
      {},
      "orderNumber shopifyId status storeKey lineItems total createdAt"
    )
      .lean()
      .exec();

    console.log(`📦 Retrieved ${orders.length} orders for user ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        orders,
        user: { role: user.role, email: user.email },
      },
      {
        headers: {
          // Cache for 60s, revalidate in background for 5 min
          "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error fetching orders:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
