import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { realtimeBus } from "@/lib/realtime/broadcast";
import { getMockUser } from "@/lib/db/mockUser";

  export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
  ) {
    try {
      const session = await getMockUser();
      if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
  
      const { id } = await props.params;
      const body = await req.json();
      const {
        status = "acknowledged", // "acknowledged" | "en_route" | "arrived"
        etaMinutes = 30,
        message,
        audioBase64,
      } = body;
  
      // 1. Resolve responder
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

    // 2. Check if this responder already responded to this alert
    let responseRecord = await prisma.response.findFirst({
      where: {
        alertId: id,
        responderId: user.id,
      },
    });

    if (responseRecord) {
      responseRecord = await prisma.response.update({
        where: { id: responseRecord.id },
        data: {
          status,
          etaMinutes: etaMinutes ? parseInt(String(etaMinutes), 10) : undefined,
          message,
          audioBase64,
        },
      });
    } else {
      responseRecord = await prisma.response.create({
        data: {
          alertId: id,
          responderId: user.id,
          status,
          etaMinutes: etaMinutes ? parseInt(String(etaMinutes), 10) : 30,
          message,
          audioBase64,
        },
      });
    }

    // 3. Update alert status to "responding" if it was "active"
    const alert = await prisma.sOSAlert.update({
      where: { id },
      data: { status: "responding" },
      include: {
        victim: true,
        responses: {
          include: { responder: true },
        },
      },
    });

    // 4. Broadcast live update to victim and peer responders
    realtimeBus.broadcast("responder_update", {
      alertId: id,
      responder: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      status,
      etaMinutes,
      audioBase64,
      activeRespondersCount: alert.responses.length,
      allResponses: alert.responses,
    });

    return NextResponse.json({
      success: true,
      response: responseRecord,
      alert,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Responder update error:", err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
