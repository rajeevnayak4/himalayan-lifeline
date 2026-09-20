import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { KHUMBU_TRAIL_MESH_NODES, createMeshSimulationPacket } from "@/lib/mesh/meshSimulator";
import { realtimeBus } from "@/lib/realtime/broadcast";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { alertId, hopIndex = 0 } = body;

    let targetAlert;
    if (alertId) {
      targetAlert = await prisma.sOSAlert.findUnique({ where: { id: alertId } });
    }

    if (!targetAlert) {
      // Pick latest active or responding alert, or create a mock
      targetAlert = await prisma.sOSAlert.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    const currentHopNode = KHUMBU_TRAIL_MESH_NODES[Math.min(hopIndex, KHUMBU_TRAIL_MESH_NODES.length - 1)];
    const isFinalHop = hopIndex >= KHUMBU_TRAIL_MESH_NODES.length - 1;

    // Log the hop in the database if alert exists
    if (targetAlert) {
      await prisma.relayLog.create({
        data: {
          alertId: targetAlert.id,
          hopDeviceId: currentHopNode.id,
          hopName: currentHopNode.name,
          hopType: currentHopNode.type,
          rssi: currentHopNode.rssi,
          lat: currentHopNode.lat,
          lng: currentHopNode.lng,
          altitude: currentHopNode.altitude,
          batteryPct: currentHopNode.batteryPct,
        },
      });

      await prisma.sOSAlert.update({
        where: { id: targetAlert.id },
        data: { hopCount: hopIndex + 1 },
      });
    }

    const packet = createMeshSimulationPacket(targetAlert?.id || "HL-DEMO");
    packet.currentHopIndex = hopIndex;
    packet.ttl = Math.max(0, 5 - hopIndex);
    packet.status = isFinalHop ? "delivered" : "hopping";
    packet.hops = KHUMBU_TRAIL_MESH_NODES.slice(0, hopIndex + 1);

    // Broadcast mesh hop progress
    realtimeBus.broadcast("mesh_hop_progress", {
      alertId: targetAlert?.id,
      hopIndex,
      node: currentHopNode,
      packet,
      isFinalHop,
    });

    return NextResponse.json({
      success: true,
      hopIndex,
      node: currentHopNode,
      isFinalHop,
      packet,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
