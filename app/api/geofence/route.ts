import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateDistanceKm, estimateHimalayanWalkingEtaMinutes, POSTGIS_EQUIVALENT_QUERY } from "@/lib/geo/haversine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, radiusKm = 10, altitude = 4000 } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: "Coordinates (lat, lng) are required" },
        { status: 400 }
      );
    }

    const allUsers = await prisma.user.findMany({
      where: {
        lastLat: { not: null },
        lastLng: { not: null },
      },
    });

    const nearbyUsers = allUsers
      .map((u) => {
        const distanceKm = calculateDistanceKm(lat, lng, u.lastLat!, u.lastLng!);
        const elevDiff = (u.lastAltitude || 4000) - altitude;
        const etaMinutes = estimateHimalayanWalkingEtaMinutes(distanceKm, elevDiff);
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          phone: u.phone,
          lastLat: u.lastLat,
          lastLng: u.lastLng,
          lastAltitude: u.lastAltitude,
          distanceKm,
          etaMinutes,
          isOnline: u.isOnline,
        };
      })
      .filter((u) => u.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      targetCoordinates: { lat, lng, altitude },
      radiusKm,
      count: nearbyUsers.length,
      users: nearbyUsers,
      postgisSqlReference: POSTGIS_EQUIVALENT_QUERY.trim(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
