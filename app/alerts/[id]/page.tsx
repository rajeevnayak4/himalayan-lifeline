"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Check, 
  Phone, 
  ShieldAlert, 
  ArrowLeft, 
  Volume2, 
  Radio, 
  UserCheck, 
  Battery, 
  Play, 
  Pause,
  Share2,
  CheckCircle2
} from "lucide-react";
import HimalayanMap, { MapMarkerItem, MapMeshHop } from "@/components/map/HimalayanMap";
import MeshRelayModal from "@/components/mesh/MeshRelayModal";
import { Language, translations } from "@/lib/i18n/translations";
import { speakAlertText } from "@/lib/audio/alarm";
import { KHUMBU_TRAIL_MESH_NODES, createMeshSimulationPacket } from "@/lib/mesh/meshSimulator";

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params?.id as string;

  const [alert, setAlert] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEta, setSelectedEta] = useState<number>(35);
  const [responderMessage, setResponderMessage] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [lang, setLang] = useState<Language>("en");

  const fetchAlert = async () => {
    if (!alertId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sos/${alertId}`);
      if (res.ok) {
        const data = await res.json();
        setAlert(data.alert);
      }
    } catch (err) {
      console.error("Failed to load alert details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("hl_lang") as Language;
      if (savedLang) setLang(savedLang);
    }
  }, [alertId]);

  const handleSendResponse = async (status: "acknowledged" | "en_route" | "arrived") => {
    try {
      setIsResponding(true);
      const res = await fetch(`/api/sos/${alertId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responderName: "Pasang Sherpa (Local Guide)",
          role: "guide",
          status,
          etaMinutes: selectedEta,
          message: responderMessage || (status === "arrived" ? "I have arrived at the victim." : "Ascending now with first-aid & oxygen."),
        }),
      });

      if (res.ok) {
        setHasResponded(true);
        fetchAlert();
      }
    } catch (err) {
      console.error("Failed to submit response:", err);
    } finally {
      setIsResponding(false);
    }
  };

  const handlePlayVoice = () => {
    if (!alert?.audioBase64) return;
    const audio = new Audio(alert.audioBase64);
    setIsPlayingAudio(true);
    audio.play();
    audio.onended = () => setIsPlayingAudio(false);
  };

  const handleTTS = () => {
    if (!alert) return;
    const t = translations[lang] || translations.en;
    const text = `${t.newAlertHeader}. ${alert.victim?.name}. ${alert.locationName || ""}. ${alert.message || ""}`;
    speakAlertText(text, lang);
  };

  const t = translations[lang] || translations.en;

  if (isLoading || !alert) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <span>Loading Alpine Distress Dossier...</span>
        </div>
      </div>
    );
  }

  // Construct Map Markers
  const mapMarkers: MapMarkerItem[] = [
    {
      id: alert.id,
      lat: alert.lat,
      lng: alert.lng,
      title: `${alert.victim?.name} (Distress)`,
      subtitle: alert.locationName,
      type: "victim",
      altitude: alert.altitude || 4940,
    },
    {
      id: "responder-node",
      lat: 27.8920,
      lng: 86.8315,
      title: "Dingboche Responders Base",
      subtitle: "Sherpa Guides Station",
      type: "responder",
      altitude: 4350,
    },
  ];

  // Construct Mesh Hops
  const meshHops: MapMeshHop[] = [];
  if (alert.relayLogs && alert.relayLogs.length > 1) {
    for (let i = 0; i < alert.relayLogs.length - 1; i++) {
      const from = alert.relayLogs[i];
      const to = alert.relayLogs[i + 1];
      meshHops.push({
        fromLat: from.lat,
        fromLng: from.lng,
        toLat: to.lat,
        toLng: to.lng,
        fromName: from.hopName,
        toName: to.hopName,
        rssi: to.rssi,
      });
    }
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back button & quick actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Alerts</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTTS}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"
            title="Read Alert Aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.listenAlert}</span>
          </button>

          <button
            onClick={() => setIsMeshModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>View Mesh Hops ({alert.relayLogs?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Victim Profile, Condition, Response Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Incident Banner */}
          <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-950 border-2 border-red-600 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {alert.victim?.name || "Anonymous Climber"}
                  </h1>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700">
                    {alert.injuryType.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span>🏔️ {alert.locationName || "Everest Trail"}</span>
                  {alert.altitude && <span>({alert.altitude}m elevation)</span>}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 block">
                  Status: {alert.status}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Message & Voice Note */}
            {alert.message && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Victim Note
                </span>
                <p className="text-sm text-slate-200 italic font-medium leading-relaxed">
                  &quot;{alert.message}&quot;
                </p>
              </div>
            )}

            {alert.audioBase64 && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Recorded Voice Distress Audio</span>
                </div>
                <button
                  onClick={handlePlayVoice}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingAudio ? "Playing..." : "Play Voice"}</span>
                </button>
              </div>
            )}

            {/* Trekker Dossier Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Emergency Phone</span>
                <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-red-400" />
                  {alert.victim?.phone || "N/A"}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Emergency Contact</span>
                <span className="font-bold text-slate-200 block truncate mt-0.5">
                  {alert.victim?.emergencyContact || "Liaison Officer"}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Battery Level</span>
                <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                  <Battery className="w-3 h-3" />
                  {alert.batteryLevel || 45}%
                </span>
              </div>
            </div>

            {alert.victim?.trekRoute && (
              <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Registered Route</span>
                <span className="font-semibold text-slate-300 mt-0.5 block">{alert.victim.trekRoute}</span>
              </div>
            )}
          </div>

          {/* Action Panel: "I CAN HELP" Responder Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Responder Action Board
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium block">
                Estimated Walking/Climbing Time to Victim:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((eta) => (
                  <button
                    key={eta}
                    onClick={() => setSelectedEta(eta)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      selectedEta === eta
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    ~{eta} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Equipment / Medical Note for Peer Responders:
              </label>
              <input
                type="text"
                placeholder="e.g. Bringing splints, oxygen cylinder, hot tea..."
                value={responderMessage}
                onChange={(e) => setResponderMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSendResponse("en_route")}
                disabled={isResponding}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{hasResponded ? "Update ETA / Status" : "I CAN HELP (I'M EN ROUTE)"}</span>
              </button>

              <button
                onClick={() => handleSendResponse("arrived")}
                disabled={isResponding}
                className="py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>I Have Arrived at Victim</span>
              </button>
            </div>
          </div>

          {/* Peer Responders List to Prevent Duplicated Effort */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                Active Responders ({alert.responses?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-400">Live Status Board</span>
            </div>

            {(!alert.responses || alert.responses.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-2">
                No local guides have acknowledged this distress call yet. Be the first to respond!
              </p>
            ) : (
              <div className="space-y-2.5">
                {alert.responses.map((resp: any) => (
                  <div
                    key={resp.id}
                    className="bg-slate-950 p-3.5 rounded-xl border border-emerald-950 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-bold">{resp.responder?.name}</strong>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {resp.responder?.role}
                        </span>
                      </div>
                      {resp.message && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          &quot;{resp.message}&quot;
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">
                        ETA ~{resp.etaMinutes || 30} min
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">{resp.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Tactical Map & Mesh Hop Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 block">
              Incident Geolocation & Ascent Route:
            </span>
            <HimalayanMap
              center={[alert.lat, alert.lng]}
              zoom={13}
              markers={mapMarkers}
              meshHops={meshHops}
              geoRadiusKm={10}
              victimCoords={[alert.lat, alert.lng]}
              className="w-full h-[380px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            />
          </div>

          {/* Mesh Hop Trail Logs */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Mesh Relay Packet Trail
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                {alert.isOfflineQueued ? "OFF-GRID RELAY" : "DIRECT 4G"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {alert.relayLogs && alert.relayLogs.length > 0 ? (
                alert.relayLogs.map((log: any, idx: number) => (
                  <div
                    key={log.id}
                    className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white block">{log.hopName}</span>
                        <span className="text-[10px] text-slate-400">{log.hopType.replace("_", " ")}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-blue-400">
                      {log.rssi !== 0 ? `${log.rssi} dBm` : "Origin"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No intermediate relay logs recorded.
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Mesh Relay Inspector Modal */}
      <MeshRelayModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        packet={createMeshSimulationPacket(alert.id)}
      />

    </div>
  );
}
