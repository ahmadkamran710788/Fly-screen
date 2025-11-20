import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import crypto from "crypto";
import { ShopifyOrder, ShopifyLineItem } from "@/types/shopify";

// Configure route to handle raw body for HMAC verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Centralized store configuration
const storeConfigs = {
  nl: { shop: process.env.SHOPIFY_NL_SHOP, secret: process.env.SHOPIFY_NL_SECRET },
  de: { shop: process.env.SHOPIFY_DE_SHOP, secret: process.env.SHOPIFY_DE_SECRET },
  uk: { shop: process.env.SHOPIFY_UK_SHOP, secret: process.env.SHOPIFY_UK_SECRET },
  fr: { shop: process.env.SHOPIFY_FR_SHOP, secret: process.env.SHOPIFY_FR_SECRET },
  dk: { shop: process.env.SHOPIFY_DK_SHOP, secret: process.env.SHOPIFY_DK_SECRET },
};

// Shopify webhook signature verification
function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const generatedHash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  const hmacBuffer = Buffer.from(hmacHeader);
  const generatedHashBuffer = Buffer.from(generatedHash);

  // Check lengths match before comparison to prevent errors
  if (hmacBuffer.length !== generatedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedHashBuffer, hmacBuffer);
}

// Helper to determine store from shop domain
function getStoreKeyFromShop(shopDomain: string): keyof typeof storeConfigs | null {
  for (const [key, config] of Object.entries(storeConfigs)) {
    if (config.shop && shopDomain.includes(config.shop)) {
      return key as keyof typeof storeConfigs;
    }
  }
  return null;
}

// Helper to get secret for store
function getSecretForStore(storeKey: keyof typeof storeConfigs): string {
  return storeConfigs[storeKey]?.secret || "";
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for HMAC verification
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const shopDomain = req.headers.get("x-shopify-shop-domain");
    const topic = req.headers.get("x-shopify-topic");

    console.log(`[Webhook] Received: ${topic} from ${shopDomain}`);
    console.log(`[Webhook] HMAC Header: ${hmacHeader?.substring(0, 20)}...`);
    console.log(`[Webhook] Body length: ${rawBody.length}`);

    if (!hmacHeader || !shopDomain) {
      console.error("[Webhook] Missing required headers");
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    // Determine which store this webhook is from
    const storeKey = getStoreKeyFromShop(shopDomain);
    if (!storeKey) {
      console.error(`[Webhook] Unknown shop domain: ${shopDomain}`);
      return NextResponse.json(
        { error: "Unknown shop domain" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Identified store: ${storeKey}`);

    // Verify the webhook signature
    const secret = getSecretForStore(storeKey);
    if (!secret) {
      console.error(`[Webhook] Missing secret for store: ${storeKey}`);
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    console.log(`[Webhook] Secret found for ${storeKey}: ${secret.substring(0, 10)}...`);

    const isValid = verifyShopifyWebhook(rawBody, hmacHeader, secret);
    if (!isValid) {
      console.error(`[Webhook] Invalid HMAC signature for ${storeKey}`);
      console.error(`[Webhook] Expected secret length: ${secret.length}`);
      console.error(`[Webhook] HMAC header length: ${hmacHeader.length}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[Webhook] HMAC verification successful for ${storeKey}`);

    // Parse the order data
    const order: ShopifyOrder = JSON.parse(rawBody);

    console.log(`[Webhook] Processing order: ${order.name} (${order.id})`);

    // Connect to database
    await connectToDatabase();

    // Upsert the order to database
    const orderData = {
      storeKey,
      shopifyId: String(order.id),
      name: order.name,
      email: order.email,
      phone: order.phone,
      note: order.note,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      currency: order.currency,
      totalPrice: order.total_price,
      subtotalPrice: order.subtotal_price,
      totalDiscounts: order.total_discounts,
      totalTax: order.total_tax,
      customer: order.customer
        ? {
            id: String(order.customer.id),
            email: order.customer.email,
            firstName: order.customer.first_name,
            lastName: order.customer.last_name,
            phone: order.customer.phone,
            tags:
              (order.customer.tags as string)
                ?.split(",")
                .map((t) => t.trim())
                .filter(Boolean) || [],
          }
        : undefined,
      lineItems: (order.line_items || []).map((li: ShopifyLineItem) => ({
        id: String(li.id),
        productId: li.product_id ? String(li.product_id) : undefined,
        variantId: li.variant_id ? String(li.variant_id) : undefined,
        title: li.title,
        variantTitle: li.variant_title,
        quantity: li.quantity,
        price: li.price,
        sku: li.sku,
        frameCuttingStatus: "Pending",
        meshCuttingStatus: "Pending",
        qualityStatus: "Pending",
      })),
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      raw: order,
      processedAt: order.processed_at
        ? new Date(order.processed_at)
        : undefined,
      cancelledAt: order.cancelled_at
        ? new Date(order.cancelled_at)
        : undefined,
      closedAt: order.closed_at ? new Date(order.closed_at) : undefined,
    };

    const result = await OrderModel.findOneAndUpdate(
      { shopifyId: String(order.id) },
      orderData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[Webhook] Order saved: ${result._id}`);

    return NextResponse.json({
      success: true,
      orderId: result._id,
      orderNumber: order.name,
    });
  } catch (error: unknown) {
    console.error("[Webhook] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Shopify Orders Webhook Endpoint",
    instructions:
      "Use this URL in your Shopify webhook settings for 'Order creation' events",
  });
}
