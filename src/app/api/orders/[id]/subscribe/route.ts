import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helper";

// Store active connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Helper to broadcast updates to all clients watching a specific order
export function broadcastOrderUpdate(orderId: string, data: any) {
  const orderConnections = connections.get(orderId);
  if (!orderConnections) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  orderConnections.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      console.error("Error broadcasting to client:", error);
    }
  });
}

// SSE endpoint for real-time order updates
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    await requireAuth(req);

    const { id } = await ctx.params;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Add this connection to the map
        if (!connections.has(id)) {
          connections.set(id, new Set());
        }
        connections.get(id)!.add(controller);

        // Send initial connection message
        const encoder = new TextEncoder();
        const message = encoder.encode(
          `data: ${JSON.stringify({ type: "connected", orderId: id })}\n\n`
        );
        controller.enqueue(message);

        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          } catch (error) {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Cleanup on close
        req.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          const orderConnections = connections.get(id);
          if (orderConnections) {
            orderConnections.delete(controller);
            if (orderConnections.size === 0) {
              connections.delete(id);
            }
          }
          try {
            controller.close();
          } catch (error) {
            // Controller already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("❌ Error in SSE endpoint:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
