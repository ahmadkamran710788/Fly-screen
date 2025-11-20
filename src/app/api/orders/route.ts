import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAuth } from "@/lib/auth-helper";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user and connect to DB
    const [user] = await Promise.all([requireAuth(req), connectToDatabase()]);

    // Only Admin can create manual orders
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { orderNumber, orderDate, store, items } = body;

    // Validate required fields
    if (
      !orderNumber ||
      !store ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields: orderNumber, store, items" },
        { status: 400 }
      );
    }

    // Transform frontend data to backend schema
    const storeKey = store.replace(".", ""); // Convert .nl to nl

    // Map store to property names (matching your existing system)
    const getPropertyNames = (storeKey: string) => {
      switch (storeKey) {
        case "nl":
          return {
            width: "Breedte in cm",
            height: "Hoogte in cm",
            profileColor: "Profielkleur:",
            orientation: "Schuifrichting",
            installation: "Plaatsing",
            threshold: "Dorpeltype",
            mesh: "Soort gaas",
            curtain: "Type plissé gordijn",
            fabricColor: "Kleur plissé gordijn",
            closure: "Sluiting",
            mounting: "Montagewijze",
          };
        case "de":
          return {
            width: "Breite in cm",
            height: "Höhe in cm",
            profileColor: "Profilfarbe",
            orientation: "Schuifrichting",
            installation: "Plaatsing",
            threshold: "Dorpeltype",
            mesh: "Soort gaas",
            curtain: "Type plissé gordijn",
            fabricColor: "Kleur plissé gordijn",
            closure: "Sluiting",
            mounting: "Montagewijze",
          };
        case "dk":
          return {
            width: "Bredde i cm",
            height: "Højde i cm",
            profileColor: "Ramme farve",
            orientation: "Schuifrichting",
            installation: "Plaatsing",
            threshold: "Dorpeltype",
            mesh: "Soort gaas",
            curtain: "Type plissé gordijn",
            fabricColor: "Kleur plissé gordijn",
            closure: "Sluiting",
            mounting: "Montagewijze",
          };
        case "fr":
          return {
            width: "Largeur en cm",
            height: "Hauteur en cm",
            profileColor: "Profilfarbe",
            orientation: "Schuifrichting",
            installation: "Plaatsing",
            threshold: "Dorpeltype",
            mesh: "Soort gaas",
            curtain: "Type plissé gordijn",
            fabricColor: "Kleur plissé gordijn",
            closure: "Sluiting",
            mounting: "Montagewijze",
          };
        case "uk":
          return {
            width: "En",
            height: "Boy",
            profileColor: "Profil renk",
            orientation: "Yon",
            installation: "Kurulum",
            threshold: "Esik",
            mesh: "Tul",
            curtain: "Kanat",
            fabricColor: "Kumas renk",
            closure: "Kapatma",
            mounting: "Montaj",
          };
        default:
          return getPropertyNames("nl");
      }
    };

    const propNames = getPropertyNames(storeKey);

    const lineItems = items.map((item: any) => {
      // Create properties array matching your existing Shopify format
      const properties = [
        { name: propNames.width, value: String(item.width) },
        { name: propNames.height, value: String(item.height) },
        { name: propNames.profileColor, value: item.profileColor },
        { name: propNames.orientation, value: item.orientation },
        { name: propNames.installation, value: item.installationType },
        { name: propNames.threshold, value: item.thresholdType },
        { name: propNames.mesh, value: item.meshType },
        { name: propNames.curtain, value: item.curtainType },
        { name: propNames.fabricColor, value: item.fabricColor },
        { name: propNames.closure, value: item.closureType },
        { name: propNames.mounting, value: item.mountingType },
      ];

      return {
        id: item.id,
        productId: `product-${item.id}`,
        variantId: `variant-${item.id}`,
        title: `${item.orientation} - ${item.width}cm x ${item.height}cm`,
        variantTitle: `${item.profileColor} / ${item.fabricColor}`,
        quantity: 1,
        price: "0.00",
        sku: `MANUAL-${item.id}`,
        properties,
        frameCuttingStatus: item.frameCuttingStatus || "Pending",
        meshCuttingStatus: item.meshCuttingStatus || "Pending",
        qualityStatus: item.qualityStatus || "Pending",
      };
    });

    // Create raw object that mirrors Shopify format for complete compatibility
    const rawLineItems = lineItems.map((li: any) => ({
      ...li,
      properties: li.properties,
    }));

    // Create order document
    const order = new OrderModel({
      storeKey,
      shopifyId: `manual-${Date.now()}`,
      name: `#${orderNumber}`,
      email: "manual@order.com",
      phone: "",
      note: "Manually created order",
      financialStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      currency: "EUR",
      totalPrice: "0.00",
      subtotalPrice: "0.00",
      totalDiscounts: "0.00",
      totalTax: "0.00",
      status: "Pending",
      lineItems,
      boxes: [],
      processedAt: orderDate ? new Date(orderDate) : new Date(),
      raw: {
        manualOrder: true,
        items,
        line_items: rawLineItems, // Include properties in raw for order details page
      },
    });

    await order.save();

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order._id.toString(),
          orderNumber,
          storeKey,
          status: order.status,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating manual order:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const orderDate = searchParams.get("orderDate");
    const deliveryDate = searchParams.get("deliveryDate");
    const deadlineStatus = searchParams.get("deadlineStatus");

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    // Build filter query - use $and to combine multiple filters properly
    const filterQuery: Record<string, any> = {};
    const andConditions: any[] = [];

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

    // Filter by order date (using processedAt or createdAt as fallback)
    if (orderDate) {
      console.log('[API] Order Date received:', orderDate);
      // Create date range covering the entire selected day in UTC
      // Parse as ISO date string (YYYY-MM-DD) and create Date objects
      const [year, month, day] = orderDate.split('-').map(Number);
      console.log('[API] Parsed date:', { year, month, day });
      const dateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const dateEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      console.log('[API] Date range:', { dateStart, dateEnd });

      // Add as $or condition to check both processedAt and createdAt
      andConditions.push({
        $or: [
          { processedAt: { $gte: dateStart, $lte: dateEnd } },
          {
            $and: [
              { processedAt: { $exists: false } },
              { createdAt: { $gte: dateStart, $lte: dateEnd } },
            ],
          },
        ],
      });
    }

    // Filter by delivery date (order date + 3 days)
    if (deliveryDate) {
      // Parse delivery date and calculate order date (delivery - 3 days)
      const [year, month, day] = deliveryDate.split('-').map(Number);
      const selectedDeliveryDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      // Calculate the order date range that would result in this delivery date
      // If delivery date = order date + 3 days, then order date = delivery date - 3 days
      const orderDateStart = new Date(selectedDeliveryDate);
      orderDateStart.setUTCDate(orderDateStart.getUTCDate() - 3);
      orderDateStart.setUTCHours(0, 0, 0, 0);

      const orderDateEnd = new Date(selectedDeliveryDate);
      orderDateEnd.setUTCDate(orderDateEnd.getUTCDate() - 3);
      orderDateEnd.setUTCHours(23, 59, 59, 999);

      // Add as separate condition in $and array
      andConditions.push({
        $or: [
          { processedAt: { $gte: orderDateStart, $lte: orderDateEnd } },
          {
            $and: [
              { processedAt: { $exists: false } },
              { createdAt: { $gte: orderDateStart, $lte: orderDateEnd } },
            ],
          },
        ],
      });
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

          andConditions.push({
            $or: [
              { processedAt: { $lt: overdueDate } },
              {
                $and: [
                  { processedAt: { $exists: false } },
                  { createdAt: { $lt: overdueDate } },
                ],
              },
            ],
          });
          break;
        case "today":
          // Orders where date + 3 days = today
          const todayDeadlineStart = new Date(today);
          todayDeadlineStart.setDate(todayDeadlineStart.getDate() - 3);
          const todayDeadlineEnd = new Date(today);
          todayDeadlineEnd.setDate(todayDeadlineEnd.getDate() - 3);
          todayDeadlineEnd.setHours(23, 59, 59, 999);

          andConditions.push({
            $or: [
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
            ],
          });
          break;
        case "week":
          // Orders where deadline (date + 3 days) is between today and 7 days from now (inclusive)
          // If deadline = orderDate + 3, then orderDate = deadline - 3
          // We want deadlines from today (included) to (today + 7)
          // So orderDates from (today - 3) to (today + 7 - 3) = (today - 3) to (today + 4)
          const weekOrderStart = new Date(today);
          weekOrderStart.setDate(weekOrderStart.getDate() - 3); // today's deadline - 3 days
          weekOrderStart.setHours(0, 0, 0, 0);

          const weekOrderEnd = new Date(today);
          weekOrderEnd.setDate(weekOrderEnd.getDate() + 4); // (today + 7) deadline - 3 days
          weekOrderEnd.setHours(23, 59, 59, 999);

          andConditions.push({
            $or: [
              { processedAt: { $gte: weekOrderStart, $lte: weekOrderEnd } },
              {
                $and: [
                  { processedAt: { $exists: false } },
                  { createdAt: { $gte: weekOrderStart, $lte: weekOrderEnd } },
                ],
              },
            ],
          });
          break;
      }
    }

    // Combine all conditions with $and if there are any
    if (andConditions.length > 0) {
      filterQuery.$and = andConditions;
    }

    // Fetch orders and total count in parallel
    const [orders, totalCount] = await Promise.all([
      OrderModel.find(filterQuery)
        .select(
          "orderNumber shopifyId status storeKey lineItems total createdAt processedAt name raw boxes"
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
