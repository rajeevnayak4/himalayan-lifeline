"use client";

import React, { useState } from "react";
import { 
  Radio, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Signal, 
  BatteryCharging, 
  ShieldCheck, 
  Cpu, 
  Bluetooth, 
  Play, 
  Info,
  Server
} from "lucide-react";
import { 
  KHUMBU_TRAIL_MESH_NODES, 
  MeshPacket, 
  checkWebBluetoothSupport, 
  requestRealBluetoothScan 
} from "@/lib/mesh/meshSimulator";

interface MeshRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  packet?: MeshPacket | null;
  onStepHop?: () => void;
}

export default function MeshRelayModal({
  isOpen,
  onClose,
  packet,
  onStepHop,
}: MeshRelayModalProps) {
  const [bleScanResult, setBleScanResult] = useState<string | null>(null);
  const [isScanningBle, setIsScanningBle] = useState(false);

  if (!isOpen) return null;

  const currentHop = packet ? packet.currentHopIndex : KHUMBU_TRAIL_MESH_NODES.length - 1;
  const isDelivered = packet?.status === "delivered" || currentHop >= KHUMBU_TRAIL_MESH_NODES.length - 1;

  const handleScanHardware = async () => {
    setIsScanningBle(true);
    setBleScanResult(null);
    const res = await requestRealBluetoothScan();
    setIsScanningBle(false);

    if (res.deviceName) {
      setBleScanResult(`Found local hardware device: ${res.deviceName}`);
    } else if (res.error) {
      setBleScanResult(res.error);
    } else {
      setBleScanResult("Web Bluetooth API not supported in this browser.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Simulated BLE Mountain Mesh Relay</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  Off-Grid Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-hop store-and-forward packet transmission along the Everest trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Packet Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Packet ID</span>
            <span className="font-mono text-sm font-bold text-blue-400">
              {packet?.packetId || "HL-MESH-89F4"}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Time-To-Live (TTL)</span>
            <span className="font-mono text-sm font-bold text-amber-400">
              {Math.max(0, 5 - currentHop)} / 5 Hops
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">MTU Payload</span>
            <span className="font-mono text-sm font-bold text-slate-200">
              244 Bytes (BLE 5.2)
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Status</span>
            <span className={`font-mono text-sm font-bold ${isDelivered ? "text-emerald-400" : "text-amber-400"}`}>
              {isDelivered ? "DELIVERED TO HQ" : `HOPPING (${currentHop + 1}/5)`}
            </span>
          </div>
        </div>

        {/* Node Hop Timeline */}
        <div className="space-y-3 my-6">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Khumbu Valley Relay Nodes (Elevation Profile):
          </h4>
          <div className="space-y-2.5">
            {KHUMBU_TRAIL_MESH_NODES.map((node, index) => {
              const isPast = index < currentHop;
              const isCurrent = index === currentHop;
              const isFuture = index > currentHop;

              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50"
                      : isPast
                      ? "bg-slate-950/60 border-emerald-900/60 text-slate-300"
                      : "bg-slate-950/30 border-slate-800/60 opacity-60 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? "bg-blue-600 text-white animate-pulse"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{node.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {node.role}
                        </span>
                        {node.isGateway && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold">
                            UPLINK GATEWAY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span>🏔️ {node.altitude}m</span>
                        {node.rssi !== 0 && (
                          <span className="flex items-center gap-1">
                            <Signal className="w-3 h-3 text-blue-400" />
                            {node.rssi} dBm
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BatteryCharging className="w-3 h-3 text-amber-400" />
                          {node.batteryPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCurrent && !isDelivered && (
                      <span className="text-xs font-bold text-blue-400 animate-pulse flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5" />
                        Transmitting...
                      </span>
                    )}
                    {isPast && (
                      <span className="text-xs font-semibold text-emerald-400">
                        Relayed
                      </span>
                    )}
                    {isCurrent && isDelivered && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Connected to Rescue Server
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Simulation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 mt-4">
          <div className="flex items-center gap-2">
            {onStepHop && !isDelivered && (
              <button
                onClick={onStepHop}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Simulate Next Mesh Hop
              </button>
            )}
            
            <button
              onClick={handleScanHardware}
              disabled={isScanningBle}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              {isScanningBle ? "Scanning..." : "Test Web Bluetooth Hardware"}
            </button>
          </div>

          {bleScanResult && (
            <p className="text-xs text-amber-300 font-medium">{bleScanResult}</p>
          )}
        </div>

        {/* Technical Architecture Note for Judges */}
        <div className="mt-5 p-4 rounded-xl bg-blue-950/30 border border-blue-900/50 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-blue-300 mb-1.5">
            <Info className="w-4 h-4" />
            <span>Hackathon Judge Technical Note: Hardware vs. Browser Sandboxing</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            <strong>What is Real:</strong> Offline SOS buffering in IndexedDB, VAPID Web Push, automated background sync worker, and geospatial Haversine radius queries.<br />
            <strong>What is Simulated for Demo:</strong> Off-grid peer-to-peer BLE packet mesh hopping. In standard browsers, the Web Bluetooth API only permits Client/GATT Central mode and strictly forbids background BLE peripheral broadcasting for privacy/security. A production deployment utilizes a native React Native wrapper (`react-native-ble-advertiser`) or dedicated mountain ridge LoRa repeaters (e.g., Meshtastic ESP32 nodes).
          </p>
        </div>

      </div>
    </div>
  );
}
