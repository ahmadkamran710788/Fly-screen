import { useEffect, useRef } from "react";

interface OrderUpdateEvent {
  type: string;
  orderId: string;
  itemId?: string;
  frameCuttingStatus?: string;
  meshCuttingStatus?: string;
  qualityStatus?: string;
  orderStatus?: string;
  timestamp?: string;
}

export function useOrderSync(
  orderId: string | undefined,
  onUpdate: (event: OrderUpdateEvent) => void
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Create SSE connection
    const eventSource = new EventSource(`/api/orders/${orderId}/subscribe`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received SSE update:", data);

        if (data.type === "itemStatusUpdated") {
          onUpdate(data);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log("SSE connection established for order:", orderId);
    };

    // Cleanup on unmount
    return () => {
      console.log("Closing SSE connection for order:", orderId);
      eventSource.close();
    };
  }, [orderId, onUpdate]);

  return eventSourceRef;
}
