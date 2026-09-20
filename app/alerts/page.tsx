"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Radio, 
  MapPin, 
  Clock, 
  Volume2, 
  Check, 
  ShieldAlert, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronRight,
  Phone,
  AlertTriangle
} from "lucide-react";
import HimalayanMap, { MapMarkerItem } from "@/components/map/HimalayanMap";
import { Language, translations } from "@/lib/i18n/translations";
import { speakAlertText } from "@/lib/audio/alarm";

export interface SOSAlertItem {
  id: string;
  victimId: string;
  victim: {
    id: string;
    name: string;
    phone: string;
    role: string;
    emergencyContact?: string;
    trekRoute?: string;
  };
  lat: number;
  lng: number;
  altitude?: number;
  locationName?: string;
  status: string;
  injuryType: string;
  message?: string;
  audioBase64?: string;
  isOfflineQueued: boolean;
  hopCount: number;
  batteryLevel?: number;
  createdAt: string;
  distanceKm?: number;
  estimatedEtaMinutes?: number;
  responses: Array<{
    id: string;
    responder: { name: string; role: string };
    status: string;
    etaMinutes?: number;
  }>;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SOSAlertItem[]>([]);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(15);
  const [lang, setLang] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  // Responder coordinates (Default: Dingboche Ridge, Khumbu Valley)
  const responderCoords: [number, number] = [27.8920, 86.8315];

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sos?lat=${responderCoords[0]}&lng=${responderCoords[1]}&radius=${selectedRadiusKm}`);
      const data = await res.json();
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.warn("Failed to fetch alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("hl_lang") as Language;
      if (savedLang) setLang(savedLang);

      const handleLangChange = (e: Event) => {
        const customEvent = e as CustomEvent<Language>;
        if (customEvent.detail) setLang(customEvent.detail);
      };
      window.addEventListener("hl_lang_changed", handleLangChange);

      fetchAlerts();


      const handleRefetch = () => {
        fetchAlerts();
      };
      window.addEventListener("hl_refetch_alerts", handleRefetch);

      return () => {
        window.removeEventListener("hl_lang_changed", handleLangChange);
        window.removeEventListener("hl_refetch_alerts", handleRefetch);
      };
    }
  }, [selectedRadiusKm]);



  const handleSpeakItem = (alert: SOSAlertItem) => {
    const speech = `${t.newAlertHeader}. ${alert.victim.name}, ${alert.locationName || ""}. ${alert.message || ""}`;
    speakAlertText(speech, lang);
  };

  const t = translations[lang] || translations.en;

  // Map markers from alerts
  const mapMarkers: MapMarkerItem[] = alerts.map((a) => ({
    id: a.id,
    lat: a.lat,
    lng: a.lng,
    title: a.victim?.name || "Distressed Trekker",
    subtitle: `${a.injuryType} • ${a.locationName || ""}`,
    type: "victim",
    altitude: a.altitude || 4500,
    status: a.status,
    etaMinutes: a.estimatedEtaMinutes || 35,
  }));

  // Add responder's own current position marker
  mapMarkers.push({
    id: "self-responder",
    lat: responderCoords[0],
    lng: responderCoords[1],
    title: "Your Location (Dingboche Hub)",
    subtitle: "Local Field Responder Station",
    type: "responder",
    altitude: 4350,
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Radius Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Nearby Active Distress Feeds
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency broadcast for Sherpas, lodge owners, and trail responders within Khumbu Valley
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <span className="text-slate-400 mr-2">Radius:</span>
            {[5, 10, 15, 25].map((km) => (
              <button
                key={km}
                onClick={() => setSelectedRadiusKm(km)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedRadiusKm === km
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {km}km
              </button>
            ))}
          </div>

          <button
            onClick={fetchAlerts}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Alert Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Mountain Map (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Tactical Terrain Map (OpenStreetMap)</span>
            <span className="text-emerald-400">● Live Radio Listening</span>
          </div>

          <HimalayanMap
            center={responderCoords}
            zoom={12}
            markers={mapMarkers}
            geoRadiusKm={selectedRadiusKm}
            victimCoords={alerts[0] ? [alerts[0].lat, alerts[0].lng] : undefined}
            className="w-full h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
          />
        </div>

        {/* Right: Distress Incident Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Active Distress Signals ({alerts.length})</span>
            <span>Sorted by Proximity</span>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center space-y-3 text-slate-400">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Active Distress Calls in {selectedRadiusKm}km</h3>
              <p className="text-xs">
                Trail corridor is currently peaceful. You will receive an immediate siren alert if a distress beacon is triggered.
              </p>
              <Link
                href="/demo"
                className="inline-block mt-2 text-xs font-bold text-emerald-400 hover:underline"
              >
                Go to Demo Center to Trigger Test Distress →
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const isResponding = alert.responses && alert.responses.length > 0;

                return (
                  <div
                    key={alert.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-red-600/80 rounded-2xl p-4 sm:p-5 shadow-xl transition-all space-y-3"
                  >
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <h3 className="text-base font-extrabold text-white">
                            {alert.victim?.name || "Trekker"}
                          </h3>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                            {alert.injuryType.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {alert.locationName || `Lat: ${alert.lat.toFixed(4)}, Lng: ${alert.lng.toFixed(4)}`}
                          {alert.altitude ? ` (${alert.altitude}m)` : ""}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSpeakItem(alert)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                        title="Read aloud in selected language"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px]">TTS</span>
                      </button>
                    </div>

                    {/* Proximity & Climbing ETA */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Proximity</span>
                        <span className="font-bold text-white">
                          {alert.distanceKm !== undefined ? `~${alert.distanceKm} km away` : "Calculating..."}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Climbing ETA</span>
                        <span className="font-bold text-emerald-400">
                          {alert.estimatedEtaMinutes ? `~${alert.estimatedEtaMinutes} min` : "30-45 min"}
                        </span>
                      </div>
                    </div>

                    {/* Transmitted note */}
                    {alert.message && (
                      <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                        &quot;{alert.message}&quot;
                      </p>
                    )}

                    {/* Responder Status Tag */}
                    <div className="flex items-center justify-between pt-1">
                      {isResponding ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {alert.responses.length} Responders En Route
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 font-bold animate-pulse">
                          Awaiting First Responder!
                        </span>
                      )}

                      <Link
                        href={`/alerts/${alert.id}`}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md"
                      >
                        <span>Respond</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
