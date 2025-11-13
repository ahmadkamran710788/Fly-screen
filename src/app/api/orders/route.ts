import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAuth } from "@/lib/auth-helper";

export async function GET(req: NextRequest) {
  try {
    // Run auth and DB connect in parallel
    const [user] = await Promise.all([requireAuth(req), connectToDatabase()]);

    // Extract pagination parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") === "asc" ? 1 : -1;

    // Extract filter parameters
    const orderNumber = searchParams.get("orderNumber");
    const stores = searchParams.get("stores");
    const statuses = searchParams.get("statuses");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const deadlineStatus = searchParams.get("deadlineStatus");

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    // Build filter query
    const filterQuery: Record<string, any> = {};

    // Filter by order number (search in name field)
    if (orderNumber) {
      filterQuery.name = { $regex: orderNumber, $options: "i" };
    }

    // Filter by stores (storeKey without the dot prefix)
    if (stores) {
      const storeArray = stores
        .split(",")
        .map((s) => s.trim().replace(/^\./, ""));
      filterQuery.storeKey = { $in: storeArray };
    }

    // Filter by statuses
    if (statuses) {
      const statusArray = statuses.split(",").map((s) => s.trim());
      filterQuery.status = { $in: statusArray };
    }

    // Filter by date range (using processedAt or createdAt as fallback)
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, any> = {};
      if (dateFrom) {
        dateFilter.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
      // Use $or to check both processedAt and createdAt
      filterQuery.$or = [
        { processedAt: dateFilter },
        { createdAt: dateFilter },
      ];
    }

    // Filter by deadline status (calculated based on processedAt or createdAt + 3 days)
    if (deadlineStatus && deadlineStatus !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (deadlineStatus) {
        case "overdue":
          // Orders where date + 3 days < today (older than 3 days)
          const overdueDate = new Date();
          overdueDate.setDate(overdueDate.getDate() - 3);
          overdueDate.setHours(23, 59, 59, 999);
          const orCondition = filterQuery.$or || [];
          filterQuery.$or = [
            ...orCondition,
            { processedAt: { $lt: overdueDate } },
            {
              $and: [
                { processedAt: { $exists: false } },
                { createdAt: { $lt: overdueDate } },
              ],
            },
          ];
          break;
        case "today":
          // Orders where date + 3 days = today
          const todayDeadlineStart = new Date(today);
          todayDeadlineStart.setDate(todayDeadlineStart.getDate() - 3);
          const todayDeadlineEnd = new Date(today);
          todayDeadlineEnd.setDate(todayDeadlineEnd.getDate() - 3);
          todayDeadlineEnd.setHours(23, 59, 59, 999);
          const orCondition2 = filterQuery.$or || [];
          filterQuery.$or = [
            ...orCondition2,
            {
              processedAt: { $gte: todayDeadlineStart, $lte: todayDeadlineEnd },
            },
            {
              $and: [
                { processedAt: { $exists: false } },
                {
                  createdAt: {
                    $gte: todayDeadlineStart,
                    $lte: todayDeadlineEnd,
                  },
                },
              ],
            },
          ];
          break;
        case "week":
          // Orders where date + 3 days is between today and 7 days from now
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          weekEnd.setHours(23, 59, 59, 999);
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - 3);
          const weekDeadlineEnd = new Date(weekEnd);
          weekDeadlineEnd.setDate(weekDeadlineEnd.getDate() - 3);
          const orCondition3 = filterQuery.$or || [];
          filterQuery.$or = [
            ...orCondition3,
            { processedAt: { $gte: weekStart, $lte: weekDeadlineEnd } },
            {
              $and: [
                { processedAt: { $exists: false } },
                { createdAt: { $gte: weekStart, $lte: weekDeadlineEnd } },
              ],
            },
          ];
          break;
      }
    }

    // Fetch orders and total count in parallel
    const [orders, totalCount] = await Promise.all([
      OrderModel.find(filterQuery)
        .select(
          "orderNumber shopifyId status storeKey lineItems total createdAt processedAt name"
        )
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      OrderModel.countDocuments(filterQuery),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        user: { role: user.role, email: user.email },
      },
      {
        headers: {
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
