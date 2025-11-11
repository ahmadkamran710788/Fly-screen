type StoreKey = "nl" | "de" | "uk" | "fr" | "dk";

const STORES: Record<StoreKey, { shop: string; token: string; apiKey: string; secret: string }> = {
  nl: {
    shop: process.env.SHOPIFY_NL_SHOP as string,
    token: process.env.SHOPIFY_NL_TOKEN as string,
    apiKey: process.env.SHOPIFY_NL_API_KEY as string,
    secret: process.env.SHOPIFY_NL_SECRET as string,
  },
  de: {
    shop: process.env.SHOPIFY_DE_SHOP as string,
    token: process.env.SHOPIFY_DE_TOKEN as string,
    apiKey: process.env.SHOPIFY_DE_API_KEY as string,
    secret: process.env.SHOPIFY_DE_SECRET as string,
  },
  uk: {
    shop: process.env.SHOPIFY_UK_SHOP as string,
    token: process.env.SHOPIFY_UK_TOKEN as string,
    apiKey: process.env.SHOPIFY_UK_API_KEY as string,
    secret: process.env.SHOPIFY_UK_SECRET as string,
  },
  fr: {
    shop: process.env.SHOPIFY_FR_SHOP as string,
    token: process.env.SHOPIFY_FR_TOKEN as string,
    apiKey: process.env.SHOPIFY_FR_API_KEY as string,
    secret: process.env.SHOPIFY_FR_SECRET as string,
  },
  dk: {
    shop: process.env.SHOPIFY_DK_SHOP as string,
    token: process.env.SHOPIFY_DK_TOKEN as string,
    apiKey: process.env.SHOPIFY_DK_API_KEY as string,
    secret: process.env.SHOPIFY_DK_SECRET as string,
  },
};

export function getStoreConfig(store: StoreKey) {
  const cfg = STORES[store];
  if (!cfg?.shop || !cfg?.token) {
    throw new Error(`Missing Shopify env for store: ${store}`);
  }
  return cfg;
}

async function shopifyFetch<T>(store: StoreKey, path: string, init?: RequestInit): Promise<T> {
  const { shop, token } = getStoreConfig(store);
  const url = `https://${shop}/admin/api/2024-10/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    // Next route handlers are already server-side; rely on native fetch
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const shopify = {
  products: {
    list: (store: StoreKey, params: string = "limit=250") =>
      shopifyFetch<{ products: any[] }>(store, `products.json?${params}`),
  },
  orders: {
    list: (store: StoreKey, params: string = "status=any&limit=250") =>
      shopifyFetch<{ orders: any[] }>(store, `orders.json?${params}`),
  },
};


