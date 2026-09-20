import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { realtimeBus } from "@/lib/realtime/broadcast";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const alert = await prisma.sOSAlert.findUnique({
      where: { id },
      include: {
        victim: true,
        responses: {
          include: { responder: true },
          orderBy: { createdAt: "desc" },
        },
        relayLogs: {
          orderBy: { hoppedAt: "asc" },
        },
      },
    });

    if (!alert) {
      return NextResponse.json({ success: false, error: "SOS Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { status } = body;

    const updated = await prisma.sOSAlert.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === "resolved" || status === "false_alarm" ? new Date() : undefined,
      },
      include: {
        victim: true,
        responses: { include: { responder: true } },
      },
    });

    realtimeBus.broadcast("alert_resolved", {
      alertId: id,
      status,
      alert: updated,
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
