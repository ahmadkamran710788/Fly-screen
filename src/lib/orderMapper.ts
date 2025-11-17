import {
  Order,
  OrderItem,
  FrameCuttingStatus,
  MeshCuttingStatus,
  QualityStatus,
} from "@/types/order";

// Helper to get property value from line item
const getProp = (properties: any[], name: string) => {
  if (!Array.isArray(properties)) return "";
  const prop = properties.find((p: any) => p?.name === name);
  return prop?.value || "";
};

// Map raw order from API to UI-friendly order (same logic as order detail page)
export const mapOrder = (o: any): Order => {
  return {
    id: String(o._id || o.shopifyId || ""),
    orderNumber: String(o.name || o.shopifyId || "").replace(/^#/, ""),
    orderDate: o.processedAt
      ? new Date(o.processedAt)
      : o.createdAt
      ? new Date(o.createdAt)
      : new Date(),
    store: `.${o.storeKey || "nl"}` as any,
    items: (o.lineItems || []).map((li: any, idx: number): OrderItem => {
      // Try to get properties from lineItem first, then from raw
      let props = li.properties || [];

      // If no properties in lineItem, try raw
      if (props.length === 0 && o.raw?.line_items?.[idx]?.properties) {
        props = o.raw.line_items[idx].properties;
      }

      return {
        id: String(li.id || li._id || `${o.shopifyId}-${idx + 1}`),
        width: parseFloat(
          getProp(props, "Breedte in cm") ||
            getProp(props, "En") ||
            getProp(props, "Breite in cm") ||
            getProp(props, "Bredde i cm") ||
            getProp(props, "Largeur en cm") ||
            "0"
        ),
        height: parseFloat(
          getProp(props, "Hoogte in cm") ||
            getProp(props, "Boy") ||
            getProp(props, "Höhe in cm") ||
            getProp(props, "Højde i cm") ||
            getProp(props, "Hauteur en cm") ||
            "0"
        ),
        profileColor:
          getProp(props, "Profielkleur:") ||
          getProp(props, "Profil renk") ||
          getProp(props, "Profilfarbe") ||
          getProp(props, "Ramme farve") ||
          "-",
        orientation:
          getProp(props, "Schuifrichting") || getProp(props, "Yon") || "",
        installationType:
          getProp(props, "Plaatsing") || getProp(props, "Kurulum") || "",
        thresholdType:
          getProp(props, "Dorpeltype") || getProp(props, "Esik") || "",
        meshType: getProp(props, "Soort gaas") || getProp(props, "Tul") || "",
        curtainType:
          getProp(props, "Type plissé gordijn") ||
          getProp(props, "Kanat") ||
          "",
        fabricColor:
          getProp(props, "Kleur plissé gordijn") ||
          getProp(props, "Kumas renk") ||
          "",
        closureType:
          getProp(props, "Sluiting") ||
          getProp(props, "Perde türü") ||
          getProp(props, "Kapatma") ||
          "",
        mountingType:
          getProp(props, "Montagewijze") || getProp(props, "Montaj") || "",
        frameCuttingStatus: (li.frameCuttingStatus ||
          "Pending") as FrameCuttingStatus,
        meshCuttingStatus: (li.meshCuttingStatus ||
          "Pending") as MeshCuttingStatus,
        qualityStatus: (li.qualityStatus || "Pending") as QualityStatus,
      };
    }),
    boxes: o.boxes || [],
  };
};

// Map multiple orders
export const mapOrders = (orders: any[]): Order[] => {
  return orders.map(mapOrder);
};
