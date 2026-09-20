"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Play,
  RefreshCw,
  CheckCircle2,
  Radio,
  MapPin,
  Users,
  ShieldAlert,
  Volume2,
  ArrowRight,
  ExternalLink,
  Info,
  Check
} from "lucide-react";
import HimalayanMap, { MapMarkerItem, MapMeshHop } from "@/components/map/HimalayanMap";
import MeshRelayModal from "@/components/mesh/MeshRelayModal";
import { KHUMBU_TRAIL_MESH_NODES, createMeshSimulationPacket, MeshPacket } from "@/lib/mesh/meshSimulator";
import { speakAlertText, playEmergencySiren, stopEmergencySiren } from "@/lib/audio/alarm";

export default function DemoPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  // Mesh Animation State
  const [meshHopIndex, setMeshHopIndex] = useState<number>(0);
  const [isHopping, setIsHopping] = useState<boolean>(false);
  const [meshPacket, setMeshPacket] = useState<MeshPacket | null>(null);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState<boolean>(false);

  // 1. One-click Seed Everest Trail Scenario
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedSuccess(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess("Seeded 6 Everest Trail nodes (Guides, Lodges, Army HQ) & 1 active distress incident!");
        if (data.sampleAlertId) setActiveAlertId(data.sampleAlertId);
      }
    } catch (err) {
      console.error("Seed error:", err);
      setSeedSuccess("Seed encountered an error. Check console.");
    } finally {
      setIsSeeding(false);
    }
  };

  // 2. Trigger Animated Mesh Packet Hop
  const handleStartMeshSimulation = () => {
    setIsHopping(true);
    setMeshHopIndex(0);

    const packet = createMeshSimulationPacket(activeAlertId || "HL-DEMO");
    setMeshPacket(packet);

    let hop = 0;
    const timer = setInterval(() => {
      hop++;
      if (hop < KHUMBU_TRAIL_MESH_NODES.length) {
        setMeshHopIndex(hop);
        setMeshPacket((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentHopIndex: hop,
            ttl: Math.max(0, 5 - hop),
            hops: KHUMBU_TRAIL_MESH_NODES.slice(0, hop + 1),
            status: hop === KHUMBU_TRAIL_MESH_NODES.length - 1 ? "delivered" : "hopping",
          };
        });
      } else {
        clearInterval(timer);
        setIsHopping(false);
        // Dispatch to other tabs simulating an offline receiver
        try {
          const bc = new BroadcastChannel("hl_mesh_alert");
          bc.postMessage({
            type: "offline_alert",
            alert: {
              id: activeAlertId || "HL-DEMO-MESH",
              victimName: "Trekker in Distress (Offline Mesh)",
              phone: "+977 9800000000",
              lat: KHUMBU_TRAIL_MESH_NODES[0].lat,
              lng: KHUMBU_TRAIL_MESH_NODES[0].lng,
              altitude: KHUMBU_TRAIL_MESH_NODES[0].altitude,
              locationName: KHUMBU_TRAIL_MESH_NODES[0].name,
              injuryType: "lost_avalanche",
              message: "SOS! Relayed via offline BLE mesh. No cellular signal.",
              distanceKm: 4.2,
              trekRoute: "Everest Base Camp Trail",
            },
          });
          setTimeout(() => bc.close(), 1000);
        } catch (e) { }

        // Also push to the server (simulating the Gateway node uploading the mesh packet to the cloud)
        // This ensures other browsers/incognito windows receive the alert via Server-Sent Events (SSE).
        fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: KHUMBU_TRAIL_MESH_NODES[0].lat,
            lng: KHUMBU_TRAIL_MESH_NODES[0].lng,
            altitude: KHUMBU_TRAIL_MESH_NODES[0].altitude,
            locationName: KHUMBU_TRAIL_MESH_NODES[0].name,
            injuryType: "lost_avalanche",
            message: "SOS! Relayed via offline BLE mesh to Army HQ Gateway.",
            isOfflineQueued: true,
            hopCount: KHUMBU_TRAIL_MESH_NODES.length,
          }),
        }).catch(() => { });
      }
    }, 2000);
  };

  // 3. Test Web Speech API in Nepali & English
  const handleTestNepaliSpeech = () => {
    speakAlertText("आपतकालीन उद्धार चाहिएको छ! लोबुचे पास नजिकै यात्री लडेर घाइते भएका छन्।", "ne");
  };

  const handleTestEnglishSpeech = () => {
    speakAlertText("Emergency distress beacon active! Trekker fallen with suspected fracture at Lobuche Pass, 4,940 meters.", "en");
  };

  // Construct Mesh Hops for Map
  const demoMeshHops: MapMeshHop[] = [];
  for (let i = 0; i < meshHopIndex; i++) {
    const from = KHUMBU_TRAIL_MESH_NODES[i];
    const to = KHUMBU_TRAIL_MESH_NODES[i + 1];
    if (from && to) {
      demoMeshHops.push({
        fromLat: from.lat,
        fromLng: from.lng,
        toLat: to.lat,
        toLng: to.lng,
        fromName: from.name,
        toName: to.name,
        rssi: to.rssi,
      });
    }
  }

  // Construct Map Markers
  const demoMarkers: MapMarkerItem[] = KHUMBU_TRAIL_MESH_NODES.slice(0, meshHopIndex + 1).map((node, i) => ({
    id: node.id,
    lat: node.lat,
    lng: node.lng,
    title: node.name,
    subtitle: `${node.role} (${node.altitude}m)`,
    type: i === 0 ? "victim" : node.isGateway ? "rescue_hq" : "mesh_node",
    altitude: node.altitude,
  }));

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Interactive Test Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate end-to-end off-grid distress scenarios, BLE mesh packet hops, and responder workflows with zero API keys required.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Seeding Scenario..." : "1-Click Seed Everest Scenario"}</span>
          </button>
        </div>
      </div>

      {seedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{seedSuccess}</span>
          </div>
          <Link
            href="/alerts"
            className="font-bold underline text-white hover:text-emerald-200"
          >
            Open Responder Feed →
          </Link>
        </div>
      )}

      {/* Control Matrix */}
      <div className="">

        {/* Card 1: Mesh Packet Simulation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 1: Mesh Hop Animation</span>
              <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Off-Grid BLE Multi-Hop Relay
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Watch the distress packet bounce across 5 elevation nodes from Lobuche Pass (4,940m) down to Namche Gateway (3,440m).
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleStartMeshSimulation}
              disabled={isHopping}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-950 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isHopping ? `Hopping Node ${meshHopIndex + 1}/5...` : "Run Animated Mesh Relay"}</span>
            </button>

            <button
              onClick={() => setIsMeshModalOpen(true)}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Inspect Packet Telemetry
            </button>
          </div>
        </div>



      </div>

      {/* Live Visual Map with Mesh Hop Animation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Live Mesh Propagation Map (Khumbu Everest Trail)</span>
          <span className="font-mono text-blue-400">
            Active Hop: {meshHopIndex + 1} / {KHUMBU_TRAIL_MESH_NODES.length} (
            {KHUMBU_TRAIL_MESH_NODES[meshHopIndex]?.name})
          </span>
        </div>

        <HimalayanMap
          center={[27.8920, 86.8315]}
          zoom={12}
          markers={demoMarkers}
          meshHops={demoMeshHops}
          className="w-full h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
        />
      </div>

      {/* Technical Honesty Callout */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 space-y-3">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Technical Honesty: What is Real vs. Simulated for Hackathon Demo</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-emerald-400 font-bold block text-sm">100% Real Production Code:</strong>
            <ul className="list-disc list-inside space-y-1">
              <li>IndexedDB offline distress persistence and auto-sync worker.</li>
              <li>Prisma database persistence (SQLite out-of-the-box / PostgreSQL ready).</li>
              <li>Haversine spherical distance calculation with mountain gradient pace adjustments.</li>
              <li>Server-Sent Events (SSE) live broadcast engine for multi-device sync.</li>
              <li>Web Audio API alpine distress sound synthesizer and Web Speech API TTS.</li>
              <li>Progressive Web App (PWA) manifest and Service Worker caching.</li>
            </ul>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-amber-400 font-bold block text-sm">Simulated for Hackathon Sandbox:</strong>
            <p className="leading-relaxed">
              Standard web browsers only permit Web Bluetooth Client/Central mode; they block background Peripheral Mode (BLE beacon advertising) to protect user device security. In a field production deployment, our architecture deploys into a <strong>React Native app wrapper</strong> (`react-native-ble-advertiser`) or connects via BLE to autonomous <strong>solar LoRa/Meshtastic repeaters</strong> placed on mountain passes.
            </p>
          </div>
        </div>
      </div>

      {/* Mesh Relay Modal */}
      <MeshRelayModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        packet={meshPacket}
        onStepHop={() => {
          const nextHop = Math.min(meshHopIndex + 1, KHUMBU_TRAIL_MESH_NODES.length - 1);
          setMeshHopIndex(nextHop);
          setMeshPacket((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentHopIndex: nextHop,
              ttl: Math.max(0, 5 - nextHop),
              hops: KHUMBU_TRAIL_MESH_NODES.slice(0, nextHop + 1),
              status: nextHop === KHUMBU_TRAIL_MESH_NODES.length - 1 ? "delivered" : "hopping",
            };
          });
        }}
      />

    </div>
  );
}
