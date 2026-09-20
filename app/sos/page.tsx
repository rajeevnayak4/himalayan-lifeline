"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  MapPin, 
  Battery, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Phone, 
  WifiOff, 
  Volume2, 
  RefreshCw, 
  ShieldAlert,
  Sliders,
  ChevronRight,
  Activity
} from "lucide-react";
import VoiceNoteRecorder from "@/components/ui/VoiceNoteRecorder";
import MeshRelayModal from "@/components/mesh/MeshRelayModal";
import { Language, translations } from "@/lib/i18n/translations";
import { queueOfflineSOS, OfflineSOSPayload } from "@/lib/offline/sosQueue";
import { MeshPacket, createMeshSimulationPacket, KHUMBU_TRAIL_MESH_NODES } from "@/lib/mesh/meshSimulator";

export default function SOSPage() {
  const [lang, setLang] = useState<Language>("en");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [forceOfflineMode, setForceOfflineMode] = useState<boolean>(false);
  
  // Distress Form State
  const [victimName, setVictimName] = useState("Alex Vance");
  const [phone, setPhone] = useState("+977 9801122334");
  const [emergencyContact, setEmergencyContact] = useState("+1 415 555 0199 (Family)");
  const [trekRoute, setTrekRoute] = useState("Lukla ➔ Namche ➔ Dingboche ➔ Lobuche Pass (4,940m)");
  const [lat, setLat] = useState<number>(27.9482);
  const [lng, setLng] = useState<number>(86.8122);
  const [altitude, setAltitude] = useState<number>(4940);
  const [locationName, setLocationName] = useState("Lobuche Pass Scree Ridge");
  const [injuryType, setInjuryType] = useState<string>("fall_fracture");
  const [message, setMessage] = useState("Slipped on icy scree near Lobuche Pass. Suspected right tibia fracture. Cannot walk.");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(34);

  // Trigger State Machine: 'idle' | 'countdown' | 'broadcasting' | 'responded'
  const [triggerState, setTriggerState] = useState<"idle" | "countdown" | "broadcasting" | "responded">("idle");
  const [countdown, setCountdown] = useState<number>(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Alert Details
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [responders, setResponders] = useState<Array<{
    name: string;
    role: string;
    phone?: string;
    status: string;
    etaMinutes?: number;
    message?: string;
  }>>([]);

  // Mesh Modal & Packet State
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [meshPacket, setMeshPacket] = useState<MeshPacket | null>(null);
  const [isOfflineTriggered, setIsOfflineTriggered] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const savedLang = localStorage.getItem("hl_lang") as Language;
      if (savedLang) setLang(savedLang);

      const handleLangChange = (e: Event) => {
        const customEvent = e as CustomEvent<Language>;
        if (customEvent.detail) setLang(customEvent.detail);
      };
      window.addEventListener("hl_lang_changed", handleLangChange);

      // Try reading actual battery if supported
      // @ts-expect-error navigator.getBattery API
      if (navigator.getBattery) {
        // @ts-expect-error navigator.getBattery API
        navigator.getBattery().then((battery: { level: number }) => {
          setBatteryLevel(Math.round(battery.level * 100));
        }).catch(() => {});
      }

      // Try GPS acquisition
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Keep Lobuche Pass coords by default for Himalayan simulation if in non-mountain region
            if (pos.coords.altitude) setAltitude(Math.round(pos.coords.altitude));
          },
          () => {},
          { timeout: 5000 }
        );
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("hl_lang_changed", handleLangChange);
      };
    }
  }, []);

  // Poll or listen for responder updates once SOS is triggered
  useEffect(() => {
    if (!activeAlertId || triggerState === "idle") return;

    const checkResponders = async () => {
      try {
        const res = await fetch(`/api/sos/${activeAlertId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.alert?.responses && data.alert.responses.length > 0) {
            setResponders(
              data.alert.responses.map((r: {
                responder: { name: string; role: string; phone?: string };
                status: string;
                etaMinutes?: number;
                message?: string;
              }) => ({
                name: r.responder?.name || "Local Guide",
                role: r.responder?.role || "guide",
                phone: r.responder?.phone,
                status: r.status,
                etaMinutes: r.etaMinutes,
                message: r.message,
              }))
            );
            if (triggerState === "broadcasting") {
              setTriggerState("responded");
            }
          }
        }
      } catch {
        // Safe poll catch
      }
    };

    const interval = setInterval(checkResponders, 3000);
    return () => clearInterval(interval);
  }, [activeAlertId, triggerState]);

  // Handle countdown before transmit
  const startDistressCountdown = () => {
    setTriggerState("countdown");
    setCountdown(5);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          executeTransmittingSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setTriggerState("idle");
    setCountdown(5);
  };

  // Transmit SOS (Online or Offline Mesh)
  const executeTransmittingSOS = async () => {
    setTriggerState("broadcasting");
    const effectiveOffline = !isOnline || forceOfflineMode;
    setIsOfflineTriggered(effectiveOffline);

    const payload: OfflineSOSPayload = {
      id: `SOS-${Date.now()}`,
      victimName,
      phone,
      lat,
      lng,
      altitude,
      locationName,
      injuryType,
      message,
      audioBase64: audioBase64 || undefined,
      emergencyContact,
      trekRoute,
      batteryLevel,
      queuedAt: new Date().toISOString(),
      synced: false,
    };

    if (effectiveOffline) {
      // 1. Store into IndexedDB
      await queueOfflineSOS(payload);
      setActiveAlertId(payload.id);

      // 2. Initialize simulated BLE mesh packet and broadcast to nearby HQ tabs
      try {
        const meshBc = new BroadcastChannel("hl_mesh_alert");
        meshBc.postMessage({ type: "offline_alert", alert: payload });
      } catch (e) {}

      const packet = createMeshSimulationPacket(payload.id);
      setMeshPacket(packet);

      // Simulate mesh hops sequentially
      let currentHop = 0;
      const hopInterval = setInterval(() => {
        currentHop++;
        if (currentHop < KHUMBU_TRAIL_MESH_NODES.length) {
          setMeshPacket((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentHopIndex: currentHop,
              ttl: Math.max(0, 5 - currentHop),
              hops: KHUMBU_TRAIL_MESH_NODES.slice(0, currentHop + 1),
              status: currentHop === KHUMBU_TRAIL_MESH_NODES.length - 1 ? "delivered" : "hopping",
            };
          });
        } else {
          clearInterval(hopInterval);
          // Auto-attach simulated responder response once packet arrives at gateway
          setResponders([
            {
              name: "Pasang Sherpa (Local Guide)",
              role: "guide",
              phone: "+977 9841234567",
              status: "en_route",
              etaMinutes: 35,
              message: "Ascending from Dingboche trail with splint & thermal blankets.",
            },
          ]);
          setTriggerState("responded");
        }
      }, 2500);
    } else {
      // Direct Online HTTP POST
      try {
        const res = await fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.alert) {
          setActiveAlertId(data.alert.id);
          if (data.nearbyResponders && data.nearbyResponders.length > 0) {
            setResponders(
              data.nearbyResponders.map((r: { name: string; role: string; etaMin?: number }) => ({
                name: r.name,
                role: r.role,
                status: "acknowledged",
                etaMinutes: r.etaMin || 30,
              }))
            );
            setTriggerState("responded");
          }
        }
      } catch (err) {
        console.warn("Online POST failed, falling back to IndexedDB:", err);
        await queueOfflineSOS(payload);
        setActiveAlertId(payload.id);
      }
    }
  };

  const handleManualHopStep = () => {
    setMeshPacket((prev) => {
      if (!prev) return null;
      const nextIndex = Math.min(prev.currentHopIndex + 1, KHUMBU_TRAIL_MESH_NODES.length - 1);
      return {
        ...prev,
        currentHopIndex: nextIndex,
        ttl: Math.max(0, 5 - nextIndex),
        hops: KHUMBU_TRAIL_MESH_NODES.slice(0, nextIndex + 1),
        status: nextIndex === KHUMBU_TRAIL_MESH_NODES.length - 1 ? "delivered" : "hopping",
      };
    });
  };

  const t = translations[lang] || translations.en;

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      
      {/* Offline Mode Simulation Bar for Demo / Field Testing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">Environment Simulation:</span>
          <span className="text-slate-400">
            {isOnline && !forceOfflineMode ? "Connected (Cellular / Wi-Fi)" : "Off-Grid Mountain Mode (No Signal)"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-semibold">
            <input
              type="checkbox"
              checked={forceOfflineMode}
              onChange={(e) => setForceOfflineMode(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-0 cursor-pointer"
            />
            <span className={forceOfflineMode ? "text-red-400 font-bold" : ""}>
              Force Off-Grid Mesh Mode
            </span>
          </label>
        </div>
      </div>

      {/* STATE 1: IDLE DISTRESS FORM */}
      {triggerState === "idle" && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top Warning Banner */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border-2 border-red-700/80 rounded-2xl p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-red-950">
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {t.sosButton}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {t.sosSubtext}
              </p>
            </div>
          </div>

          {/* Injury Selector - Low Literacy Big Icons */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="text-xs uppercase font-extrabold tracking-wider text-slate-300 block">
              1. Select Primary Injury / Emergency Condition:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: "fall_fracture", label: t.injuryFall, icon: "🦴", desc: "Fracture / Cannot walk" },
                { id: "altitude_sickness", label: t.injuryAltitude, icon: "🏔️", desc: "HAPE / HACE edema" },
                { id: "hypothermia", label: t.injuryHypothermia, icon: "❄️", desc: "Severe frostbite / cold" },
                { id: "lost_avalanche", label: t.injuryAvalanche, icon: "⚠️", desc: "Avalanche / Trapped" },
                { id: "other", label: t.injuryOther, icon: "🚨", desc: "Heart / Bleeding / Shock" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setInjuryType(item.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[90px] ${
                    injuryType === item.id
                      ? "bg-red-950/70 border-red-500 shadow-md shadow-red-950/60 ring-2 ring-red-500/40"
                      : "bg-slate-950 border-slate-800 hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">{item.icon}</span>
                    {injuryType === item.id && (
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white mt-1">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Note & Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 10s Voice Note Recorder */}
            <VoiceNoteRecorder
              onAudioReady={(base64) => setAudioBase64(base64)}
              maxSeconds={10}
            />

            {/* Victim Telemetry & Contact */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Trail Coordinates & Altitude
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-mono">
                  <Battery className="w-3.5 h-3.5" />
                  {batteryLevel}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Coordinates</span>
                  <span className="font-mono font-bold text-slate-200">
                    {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Altitude</span>
                  <span className="font-mono font-bold text-slate-200">
                    🏔️ {altitude} meters
                  </span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-[10px] text-slate-400 block mb-0.5">Trek Route / Mountain Pass</span>
                <input
                  type="text"
                  value={trekRoute}
                  onChange={(e) => setTrekRoute(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

          </div>

          {/* BIG RED DISTRESS TRIGGER BUTTON (Giant Touch Target) */}
          <div className="pt-4 flex flex-col items-center">
            <button
              onClick={startDistressCountdown}
              className="relative group w-full max-w-lg py-6 px-8 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xl sm:text-2xl tracking-wider uppercase flex items-center justify-center gap-4 shadow-2xl shadow-red-950 border-4 border-red-500/80 active:scale-95 transition-all"
            >
              <span className="absolute -inset-1 rounded-3xl bg-red-600/30 blur-lg group-hover:bg-red-500/50 transition-all pointer-events-none" />
              <AlertTriangle className="w-8 h-8 stroke-[3] animate-pulse" />
              <span>{t.sosButton}</span>
            </button>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Tap once to initiate 5-second abort countdown before broadcasting to all nearby Sherpas & army posts.
            </p>
          </div>

        </div>
      )}

      {/* STATE 2: 5-SECOND ABORT COUNTDOWN */}
      {triggerState === "countdown" && (
        <div className="bg-red-950/90 border-4 border-red-600 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in duration-200">
          <div className="w-20 h-20 rounded-full bg-red-600 text-white font-black text-4xl flex items-center justify-center mx-auto shadow-xl shadow-red-900 animate-ping">
            {countdown}
          </div>

          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {t.cancelPrompt} {countdown}s...
            </h2>
            <p className="text-sm text-red-300 mt-1">
              Distress coordinates ({lat.toFixed(4)}, {lng.toFixed(4)} @ {altitude}m) will broadcast across all regional frequencies.
            </p>
          </div>

          <button
            onClick={cancelCountdown}
            className="w-full max-w-sm mx-auto py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base border-2 border-red-500/80 shadow-lg transition-all"
          >
            {t.cancelButton}
          </button>
        </div>
      )}

      {/* STATE 3 & 4: BROADCASTING OR RESPONDED LIVE DASHBOARD */}
      {(triggerState === "broadcasting" || triggerState === "responded") && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Distress Live Status Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">{t.triggeredTitle}</h3>
                  <p className="text-xs text-slate-400 font-mono">Alert ID: {activeAlertId || "SOS-ACTIVE"}</p>
                </div>
              </div>

              {isOfflineTriggered ? (
                <button
                  onClick={() => setIsMeshModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{t.viewMeshPath}</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-800">
                  Cloud Uplink Connected
                </span>
              )}
            </div>

            {/* Offline Mesh Notice Banner (if triggered off-grid) */}
            {isOfflineTriggered && (
              <div className="bg-blue-950/40 border border-blue-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-200">
                <Radio className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="block text-white font-bold">{t.offlineWarning}</strong>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">
                    {t.meshRelayDesc}
                  </p>
                  {meshPacket && (
                    <div className="mt-2 font-mono text-[11px] text-blue-300">
                      Current Hop: {meshPacket.currentHopIndex + 1} / {KHUMBU_TRAIL_MESH_NODES.length} (
                      {KHUMBU_TRAIL_MESH_NODES[meshPacket.currentHopIndex]?.name})
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Responders Board */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  {responders.length > 0 ? `${responders.length} Responders En Route` : t.searchingResponders}
                </span>
                {responders.length > 0 && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Closest ETA: ~{Math.min(...responders.map((r) => r.etaMinutes || 35))} min
                  </span>
                )}
              </div>

              {responders.length === 0 ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
                  <span>Transmitting telemetry across Khumbu VHF radio & BLE mesh...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {responders.map((resp, i) => (
                    <div
                      key={i}
                      className="bg-slate-950 p-4 rounded-xl border border-emerald-900/60 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
                          ▲
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{resp.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                              {resp.role}
                            </span>
                          </div>
                          {resp.message && (
                            <p className="text-xs text-slate-400 mt-0.5 italic">
                              &quot;{resp.message}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400 block">
                          ETA ~{resp.etaMinutes || 30} min
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{resp.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cancel Distress Button */}
            <div className="pt-2">
              <button
                onClick={async () => {
                  if (activeAlertId && isOnline && !forceOfflineMode) {
                    try {
                      await fetch(`/api/sos/${activeAlertId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "resolved" })
                      });
                    } catch (e) {}
                  }
                  // Even if offline, clear the local UI state
                  setTriggerState("idle");
                  setActiveAlertId(null);
                  setResponders([]);
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-all"
              >
                End Beacon / Mark Resolved
              </button>
            </div>

          </div>

        </div>
      )}

      {/* BLE Mesh Modal */}
      <MeshRelayModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        packet={meshPacket}
        onStepHop={handleManualHopStep}
      />

    </div>
  );
}
