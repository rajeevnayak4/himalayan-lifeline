import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { realtimeBus } from "@/lib/realtime/broadcast";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      phone,
      lat,
      lng,
      altitude,
      batteryPct,
    } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: "Latitude and Longitude required" },
        { status: 400 }
      );
    }

    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Active Trekker (Passive Checkin)",
          phone: phone || "+977 9800000000",
          role: "trekker",
          lastLat: parseFloat(lat),
          lastLng: parseFloat(lng),
          lastAltitude: altitude ? parseFloat(altitude) : null,
          lastPingAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLat: parseFloat(lat),
          lastLng: parseFloat(lng),
          lastAltitude: altitude ? parseFloat(altitude) : user.lastAltitude,
          lastPingAt: new Date(),
        },
      });
    }

    const checkin = await prisma.checkin.create({
      data: {
        userId: user.id,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        altitude: altitude ? parseFloat(altitude) : null,
        batteryPct: batteryPct ? parseInt(String(batteryPct), 10) : null,
      },
    });

    realtimeBus.broadcast("checkin_ping", {
      userId: user.id,
      userName: user.name,
      checkin,
    });

    return NextResponse.json({
      success: true,
      message: "Passive 15-minute breadcrumb checkin recorded",
      checkin,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
