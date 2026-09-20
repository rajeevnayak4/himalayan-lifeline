/**
 * Realtime Event Bus & SSE Broadcaster
 * Enables instant zero-configuration live updates across victims, responders, and coordinator HQ.
 * Works out-of-the-box via Server-Sent Events without external third-party accounts.
 */

export interface RealtimeEvent<T = unknown> {
  type: "sos_triggered" | "responder_update" | "alert_resolved" | "mesh_hop_progress" | "checkin_ping";
  data: T;
  timestamp: string;
}

type Listener = (event: RealtimeEvent) => void;

class RealtimeEventBus {
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast<T = unknown>(type: RealtimeEvent["type"], data: T): void {
    const event: RealtimeEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    this.listeners.forEach((listener) => {
      try {
        listener(event as RealtimeEvent);
      } catch (err) {
        console.error("Realtime listener error:", err);
      }
    });

    // Optional: Pusher / Supabase Realtime trigger if keys exist
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
      // Pusher trigger hook could be added here
    }
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }
}

// Global singleton across server invocations
declare global {
  // eslint-disable-next-line no-var
  var realtimeBus: RealtimeEventBus | undefined;
}

export const realtimeBus = global.realtimeBus || new RealtimeEventBus();

if (process.env.NODE_ENV !== "production") {
  global.realtimeBus = realtimeBus;
}

export default realtimeBus;
