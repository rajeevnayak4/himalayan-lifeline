/**
 * BLE Mesh Relay Simulation Engine
 * Models packet propagation across high-altitude off-grid trail nodes in Nepal Himalayas.
 * 
 * NOTE ON HARDWARE REALITY VS. BROWSER SIMULATION:
 * Web Bluetooth API (in Chromium) only supports Central / Client mode (connecting to existing GATT peripherals).
 * True off-grid peer-to-peer mesh advertising (Peripheral Mode / GAP Broadcaster) requires:
 * 1. Native mobile runtime (React Native BLE Peripheral, Android BluetoothLeAdvertiser, iOS CoreBluetooth PeripheralManager)
 * 2. Or dedicated LoRa/BLE hardware (e.g., Meshtastic, Nordic nRF52840 solar beacons deployed on ridges).
 * This module simulates the mesh packet hopping mathematically and visually for hackathon demonstration.
 */

export interface MeshNode {
  id: string;
  name: string;
  role: string;
  type: "trekker_phone" | "solar_mesh_beacon" | "lodge_repeater" | "rescue_gateway";
  lat: number;
  lng: number;
  altitude: number; // in meters
  rssi: number; // dBm
  batteryPct: number;
  isGateway: boolean; // has internet / sat connection
  distanceFromPreviousKm?: number;
}

export interface MeshPacket {
  packetId: string;
  originNodeId: string;
  destinationNodeId: string;
  currentHopIndex: number;
  ttl: number; // Time-To-Live countdown
  payloadBytes: number;
  protocol: string;
  encryption: string;
  hops: MeshNode[];
  status: "hopping" | "delivered" | "expired";
}

export const KHUMBU_TRAIL_MESH_NODES: MeshNode[] = [
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
    isGateway: false,
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
    isGateway: false,
    distanceFromPreviousKm: 2.8,
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
    isGateway: false,
    distanceFromPreviousKm: 3.9,
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
    isGateway: false,
    distanceFromPreviousKm: 8.4,
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
    isGateway: true,
    distanceFromPreviousKm: 6.2,
  },
];

export function createMeshSimulationPacket(alertId: string): MeshPacket {
  return {
    packetId: `HL-MESH-${alertId.slice(-6).toUpperCase()}`,
    originNodeId: KHUMBU_TRAIL_MESH_NODES[0].id,
    destinationNodeId: KHUMBU_TRAIL_MESH_NODES[KHUMBU_TRAIL_MESH_NODES.length - 1].id,
    currentHopIndex: 0,
    ttl: 5,
    payloadBytes: 244, // Standard BLE 5.0 MTU size
    protocol: "BLE Coded PHY (Long Range) / LoRaWAN 868MHz",
    encryption: "AES-128-GCM End-to-End Encrypted",
    hops: [KHUMBU_TRAIL_MESH_NODES[0]],
    status: "hopping",
  };
}

/**
 * Checks if client browser supports Web Bluetooth API
 */
export function checkWebBluetoothSupport(): boolean {
  if (typeof window === "undefined") return false;
  return "bluetooth" in navigator;
}

/**
 * Prompts user for real BLE device scan (if hardware exists and user triggers it)
 */
export async function requestRealBluetoothScan(): Promise<{
  supported: boolean;
  deviceName?: string;
  error?: string;
}> {
  if (!checkWebBluetoothSupport()) {
    return {
      supported: false,
      error: "Web Bluetooth API is not supported in this browser environment.",
    };
  }

  try {
    // @ts-expect-error navigator.bluetooth browser type
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["battery_service", "generic_access"],
    });

    return {
      supported: true,
      deviceName: device.name || "Nearby Bluetooth Device",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      supported: true,
      error: message.includes("User cancelled") ? "Scan cancelled by user" : message,
    };
  }
}
