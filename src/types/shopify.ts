// Shopify webhook payload types

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  tags: string;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
  sku: string | null;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  country: string;
  zip: string;
  phone: string | null;
  company: string | null;
}

export interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  financial_status: string;
  fulfillment_status: string | null;
  currency: string;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  total_tax: string;
  customer: ShopifyCustomer | null;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress | null;
  billing_address: ShopifyAddress | null;
  processed_at: string | null;
  cancelled_at: string | null;
  closed_at: string | null;
}
