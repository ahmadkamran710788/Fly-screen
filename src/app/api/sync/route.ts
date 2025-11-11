import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { shopify } from "@/lib/shopify";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";

function assertStoreParam(searchParams: URLSearchParams) {
  const store = searchParams.get("store") as "nl" | "de" | "uk" | "fr" | "dk" | null;
  if (!store) throw new Error("Missing ?store=nl|de|uk|fr|dk");
  return store;
}

export async function POST(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const store = assertStoreParam(searchParams);
    await connectToDatabase();

    const [productsRes, ordersRes] = await Promise.all([
      shopify.products.list(store),
      shopify.orders.list(store),
    ]);

    const products = productsRes.products || [];
    const orders = ordersRes.orders || [];

    // Upsert products
    for (const p of products) {
      await ProductModel.findOneAndUpdate(
        { shopifyId: String(p.id) },
        {
          storeKey: store,
          shopifyId: String(p.id),
          handle: p.handle,
          title: p.title,
          status: p.status,
          productType: p.product_type,
          vendor: p.vendor,
          tags: (p.tags as string)?.split(",").map((t) => t.trim()).filter(Boolean) || [],
          images: (p.images || []).map((img: any) => ({ id: String(img.id), src: img.src, alt: img.alt })),
          variants: (p.variants || []).map((v: any) => ({
            id: String(v.id),
            title: v.title,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compare_at_price,
            available: v.available,
            inventoryQuantity: v.inventory_quantity,
            option1: v.option1,
            option2: v.option2,
            option3: v.option3,
          })),
          options: (p.options || []).map((o: any) => ({ id: String(o.id), name: o.name, values: o.values })),
          raw: p,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    // Upsert orders
    for (const o of orders) {
      await OrderModel.findOneAndUpdate(
        { shopifyId: String(o.id) },
        {
          storeKey: store,
          shopifyId: String(o.id),
          name: o.name,
          email: o.email,
          phone: o.phone,
          note: o.note,
          financialStatus: o.financial_status,
          fulfillmentStatus: o.fulfillment_status,
          currency: o.currency,
          totalPrice: o.total_price,
          subtotalPrice: o.subtotal_price,
          totalDiscounts: o.total_discounts,
          totalTax: o.total_tax,
          customer: o.customer
            ? {
                id: String(o.customer.id),
                email: o.customer.email,
                firstName: o.customer.first_name,
                lastName: o.customer.last_name,
                phone: o.customer.phone,
                tags: (o.customer.tags as string)?.split(",").map((t) => t.trim()).filter(Boolean) || [],
              }
            : undefined,
          lineItems: (o.line_items || []).map((li: any) => ({
            id: String(li.id),
            productId: li.product_id ? String(li.product_id) : undefined,
            variantId: li.variant_id ? String(li.variant_id) : undefined,
            title: li.title,
            variantTitle: li.variant_title,
            quantity: li.quantity,
            price: li.price,
            sku: li.sku,
          })),
          shippingAddress: o.shipping_address,
          billingAddress: o.billing_address,
          raw: o,
          processedAt: o.processed_at ? new Date(o.processed_at) : undefined,
          cancelledAt: o.cancelled_at ? new Date(o.cancelled_at) : undefined,
          closedAt: o.closed_at ? new Date(o.closed_at) : undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return NextResponse.json({
      ok: true,
      store,
      counts: { products: products.length, orders: orders.length },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}


