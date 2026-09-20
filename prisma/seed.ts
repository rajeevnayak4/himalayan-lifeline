import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KHUMBU_TRAIL_MESH_NODES = [
  {
    id: "node-victim",
    name: "Distressed Trekker Device (Alex)",
    role: "Stranded Trekker (Offline)",
    type: "trekker_phone",
    lat: 27.9482,
    lng: 86.8122,
    altitude: 4940,
    rssi: 0,
    batteryPct: 34,
  },
  {
    id: "node-peer-1",
    name: "Sarah's iPhone (Passing Trekker)",
    role: "Trail Peer (BLE Relay 1)",
    type: "trekker_phone",
    lat: 27.9250,
    lng: 86.8210,
    altitude: 4720,
    rssi: -74,
    batteryPct: 68,
  },
  {
    id: "node-beacon-1",
    name: "Dingboche Solar Ridge Repeater",
    role: "Autonomous Solar LoRa/BLE Beacon",
    type: "solar_mesh_beacon",
    lat: 27.8920,
    lng: 86.8315,
    altitude: 4410,
    rssi: -82,
    batteryPct: 92,
  },
  {
    id: "node-lodge-1",
    name: "Tengboche Monastery Lodge Repeater",
    role: "Community Micro-Hub",
    type: "lodge_repeater",
    lat: 27.8358,
    lng: 86.7645,
    altitude: 3860,
    rssi: -71,
    batteryPct: 100,
  },
  {
    id: "node-gateway-hq",
    name: "Namche Army Rescue Liaison Post",
    role: "High-Speed Satellite / 4G Uplink Gateway",
    type: "rescue_gateway",
    lat: 27.8069,
    lng: 86.7140,
    altitude: 3440,
    rssi: -58,
    batteryPct: 100,
  },
];

async function main() {
  console.log("🏔️ Seeding Himalayan Lifeline database...");

  // 1. Clean previous data
  await prisma.relayLog.deleteMany({});
  await prisma.response.deleteMany({});
  await prisma.checkin.deleteMany({});
  await prisma.sOSAlert.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create local responders
  const pasangSherpa = await prisma.user.create({
    data: {
      name: "Pasang Sherpa",
      phone: "+977 9841234567",
      role: "guide",
      lang: "ne",
      emergencyContact: "+977 9801122334 (Sherpa Association)",
      trekRoute: "Tengboche -> Dingboche -> Lobuche",
      lastLat: 27.8945,
      lastLng: 86.8320,
      lastAltitude: 4410,
      lastPingAt: new Date(),
      isOnline: true,
    },
  });

  const mingmaLodge = await prisma.user.create({
    data: {
      name: "Mingma Dorje (Himalayan Lodge)",
      phone: "+977 9812345678",
      role: "lodge_owner",
      lang: "ne",
      emergencyContact: "+977 38 540012 (Dingboche Radio)",
      trekRoute: "Dingboche Village (Stationary Hub)",
      lastLat: 27.8920,
      lastLng: 86.8315,
      lastAltitude: 4350,
      lastPingAt: new Date(),
      isOnline: true,
    },
  });

  const drSonam = await prisma.user.create({
    data: {
      name: "Dr. Sonam Gyalzen (HRA Clinic)",
      phone: "+977 9851098765",
      role: "guide",
      lang: "en",
      emergencyContact: "+977 1 4443999 (Himalayan Rescue Association)",
      trekRoute: "Pheriche High Altitude Clinic",
      lastLat: 27.8925,
      lastLng: 86.8200,
      lastAltitude: 4280,
      lastPingAt: new Date(),
      isOnline: true,
    },
  });

  const dawaCoordinator = await prisma.user.create({
    data: {
      name: "Captain Dawa Tenzing (Namche Rescue HQ)",
      phone: "+977 9860011223",
      role: "rescue_coordinator",
      lang: "en",
      emergencyContact: "Nepal Army Mountain Rescue Wing",
      trekRoute: "Namche Bazaar Command Center",
      lastLat: 27.8069,
      lastLng: 86.7140,
      lastAltitude: 3440,
      lastPingAt: new Date(),
      isOnline: true,
    },
  });

  const kanchhiVillager = await prisma.user.create({
    data: {
      name: "Kanchhi Maya (Yak Caravan)",
      phone: "+977 9823456789",
      role: "villager",
      lang: "ne",
      emergencyContact: "Pangboche Village Post",
      trekRoute: "Lobuche Pass Trail",
      lastLat: 27.9350,
      lastLng: 86.8180,
      lastAltitude: 4800,
      lastPingAt: new Date(),
      isOnline: true,
    },
  });

  // 3. Create victim
  const alexTrekker = await prisma.user.create({
    data: {
      name: "Alex Vance",
      phone: "+1 415 555 0192",
      role: "trekker",
      lang: "en",
      emergencyContact: "+1 415 555 0199 (Family Liaison - US)",
      trekRoute: "Lukla -> Namche -> Dingboche -> Lobuche Pass -> EBC",
      lastLat: 27.9482,
      lastLng: 86.8122,
      lastAltitude: 4940,
      lastPingAt: new Date(),
      isOnline: false,
    },
  });

  // 4. Create active distress incident
  const activeAlert = await prisma.sOSAlert.create({
    data: {
      victimId: alexTrekker.id,
      lat: 27.9482,
      lng: 86.8122,
      altitude: 4940,
      locationName: "Lobuche Pass (4,940m) — Scree Ridge",
      status: "responding",
      injuryType: "fall_fracture",
      message: "Slipped on icy rock near Lobuche Pass. Right leg suspected tibia fracture. Cannot bear weight. Temperature dropping rapidly, wind ~40km/h.",
      isOfflineQueued: true,
      hopCount: 4,
      batteryLevel: 28,
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  });

  // 5. Create responder actions
  await prisma.response.create({
    data: {
      alertId: activeAlert.id,
      responderId: pasangSherpa.id,
      status: "en_route",
      etaMinutes: 35,
      message: "Carrying splint, thermal bivouac, and hot sweet tea. Ascending from Dingboche trail.",
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  await prisma.response.create({
    data: {
      alertId: activeAlert.id,
      responderId: drSonam.id,
      status: "acknowledged",
      etaMinutes: 60,
      message: "Preparing portable hyperbaric bag (Gamow bag) & injectable analgesics at Pheriche.",
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  // 6. Create relay logs
  for (let i = 0; i < KHUMBU_TRAIL_MESH_NODES.length; i++) {
    const node = KHUMBU_TRAIL_MESH_NODES[i];
    await prisma.relayLog.create({
      data: {
        alertId: activeAlert.id,
        hopDeviceId: node.id,
        hopName: node.name,
        hopType: node.type,
        rssi: node.rssi,
        lat: node.lat,
        lng: node.lng,
        altitude: node.altitude,
        batteryPct: node.batteryPct,
        hoppedAt: new Date(Date.now() - (24 - i * 4) * 60 * 1000),
      },
    });
  }

  // 7. Create checkins
  await prisma.checkin.create({
    data: {
      userId: alexTrekker.id,
      lat: 27.8920,
      lng: 86.8315,
      altitude: 4350,
      batteryPct: 65,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Seed complete! Seeded Khumbu trail nodes, Alex Vance distress, and responder records.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
