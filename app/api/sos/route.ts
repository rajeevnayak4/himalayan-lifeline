import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateDistanceKm, estimateHimalayanWalkingEtaMinutes } from "@/lib/geo/haversine";
import { realtimeBus } from "@/lib/realtime/broadcast";
import { getMockUser } from "@/lib/db/mockUser";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
    const radiusKm = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 25;

    const whereClause: { status?: string } = {};
    if (status && status !== "all") {
      whereClause.status = status;
    }

    const alerts = await prisma.sOSAlert.findMany({
      where: whereClause,
      include: {
        victim: true,
        responses: {
          include: { responder: true },
        },
        relayLogs: {
          orderBy: { hoppedAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If caller provided lat/lng, attach proximity distance & sort by proximity
    const enrichedAlerts = alerts.map((alert) => {
      let distanceKm: number | null = null;
      let estimatedEtaMinutes: number | null = null;

      if (lat !== null && lng !== null) {
        distanceKm = calculateDistanceKm(lat, lng, alert.lat, alert.lng);
        estimatedEtaMinutes = estimateHimalayanWalkingEtaMinutes(
          distanceKm,
          alert.altitude ? (alert.altitude - 4000) : 0
        );
      }

      return {
        ...alert,
        distanceKm,
        estimatedEtaMinutes,
      };
    });

    // Filter by radius if coordinates were provided
    const finalAlerts =
      lat !== null && lng !== null
        ? enrichedAlerts.filter((a) => (a.distanceKm ?? 999) <= radiusKm)
        : enrichedAlerts;

    return NextResponse.json({
      success: true,
      alerts: finalAlerts,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

  export async function POST(req: NextRequest) {
    try {
      const session = await getMockUser();
      if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await req.json();
      const {
        lat,
        lng,
        altitude = 4500,
        locationName,
        injuryType = "other",
        message,
        audioBase64,
        isOfflineQueued = false,
        hopCount = 0,
        batteryLevel = 85,
      } = body;
  
      if (lat === undefined || lng === undefined) {
        return NextResponse.json(
          { success: false, error: "Latitude and Longitude are mandatory for SOS" },
          { status: 400 }
        );
      }
  
      // 1. Update victim user location
      const victim = await prisma.user.update({
        where: { id: session.id },
        data: {
          lastLat: lat,
          lastLng: lng,
          lastAltitude: altitude,
          lastPingAt: new Date(),
          isOnline: !isOfflineQueued,
        },
      });

    // 2. Create the SOS Alert
    const alert = await prisma.sOSAlert.create({
      data: {
        victimId: victim.id,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        altitude: altitude ? parseFloat(altitude) : null,
        locationName: locationName || `Coordinates (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
        status: "active",
        injuryType,
        message,
        audioBase64,
        isOfflineQueued: Boolean(isOfflineQueued),
        hopCount: parseInt(String(hopCount), 10) || 0,
        batteryLevel: batteryLevel ? parseInt(String(batteryLevel), 10) : 80,
      },
      include: {
        victim: true,
      },
    });

    // 3. Calculate all nearby registered local responders within 15km
    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: victim.id },
        lastLat: { not: null },
        lastLng: { not: null },
      },
    });

    const nearbyResponders = allUsers
      .map((user) => {
        const distKm = calculateDistanceKm(lat, lng, user.lastLat!, user.lastLng!);
        const elevDiff = (user.lastAltitude || 4000) - (altitude || 4000);
        const etaMin = estimateHimalayanWalkingEtaMinutes(distKm, -elevDiff);
        return {
          ...user,
          distanceKm: distKm,
          estimatedWalkingEtaMinutes: etaMin,
        };
      })
      .filter((u) => u.distanceKm <= 15)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // 4. Broadcast live realtime event
    realtimeBus.broadcast("sos_triggered", {
      alert,
      nearbyCount: nearbyResponders.length,
      nearbyResponders: nearbyResponders.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        distanceKm: r.distanceKm,
        etaMin: r.estimatedWalkingEtaMinutes,
      })),
    });

    return NextResponse.json({
      success: true,
      alert,
      nearbyRespondersCount: nearbyResponders.length,
      nearbyResponders: nearbyResponders.slice(0, 5),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("SOS Trigger Error:", err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
