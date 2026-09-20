import { NextRequest } from "next/server";
import { realtimeBus, RealtimeEvent } from "@/lib/realtime/broadcast";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection packet
      const initData = JSON.stringify({
        type: "connected",
        message: "Connected to Himalayan Lifeline Realtime Broadcast Stream",
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

      // Subscribe to internal event bus
      const unsubscribe = realtimeBus.subscribe((event: RealtimeEvent) => {
        try {
          const payload = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Closed stream
        }
      });

      // Keepalive heartbeat
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
          unsubscribe();
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
