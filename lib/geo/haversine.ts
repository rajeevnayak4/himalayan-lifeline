/**
 * Geo & Mountain Distance Utilities
 * Includes Haversine spherical distance calculation and Himalayan terrain traversal estimates.
 */

export interface Coordinates {
  lat: number;
  lng: number;
  altitude?: number; // in meters
}

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates great-circle distance between two points using the Haversine formula.
 * @returns distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Himalayan mountain walking time estimate based on Tobler's Hiking Function.
 * At 4,000m - 5,000m altitude, human pace is ~2.5 - 3 km/h on flat/gradual trails,
 * with significant penalty for elevation gain.
 * @returns estimated minutes to reach target on foot
 */
export function estimateHimalayanWalkingEtaMinutes(
  distanceKm: number,
  elevationDiffMeters: number = 0
): number {
  // Base pace in high altitude: ~2.8 km/h => ~21.4 mins per km
  let minutes = distanceKm * 21.4;

  // Add 15 minutes per 100 meters of uphill climb
  if (elevationDiffMeters > 0) {
    minutes += (elevationDiffMeters / 100) * 15;
  } else if (elevationDiffMeters < 0) {
    // Downhill is slightly faster but knee-straining on rocky scree
    minutes += (Math.abs(elevationDiffMeters) / 100) * 8;
  }

  // Minimum response buffer of 5 minutes for gear/readiness
  return Math.max(5, Math.round(minutes));
}

/**
 * Reference SQL Query for PostGIS (if running against PostgreSQL with postgis extension enabled):
 * 
 * SELECT id, name, role, phone,
 *   ST_Distance(
 *     ST_SetSRID(ST_MakePoint(last_lng, last_lat), 4326)::geography,
 *     ST_SetSRID(ST_MakePoint($targetLng, $targetLat), 4326)::geography
 *   ) / 1000.0 AS distance_km
 * FROM "User"
 * WHERE ST_DWithin(
 *   ST_SetSRID(ST_MakePoint(last_lng, last_lat), 4326)::geography,
 *   ST_SetSRID(ST_MakePoint($targetLng, $targetLat), 4326)::geography,
 *   $radiusMeters
 * )
 * ORDER BY distance_km ASC;
 */
export const POSTGIS_EQUIVALENT_QUERY = `
-- PostGIS ST_DWithin Radius Query for Himalayan Responders:
SELECT u.id, u.name, u.role, u.phone,
  ST_Distance(
    ST_MakePoint(u."lastLng", u."lastLat")::geography,
    ST_MakePoint($1, $2)::geography
  ) / 1000.0 AS distance_km
FROM "User" u
WHERE u."lastLat" IS NOT NULL AND u."lastLng" IS NOT NULL
  AND ST_DWithin(
    ST_MakePoint(u."lastLng", u."lastLat")::geography,
    ST_MakePoint($1, $2)::geography,
    $3
  )
ORDER BY distance_km ASC;
`;
