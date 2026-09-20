"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Radio, 
  ShieldAlert, 
  Mountain, 
  WifiOff, 
  Layers, 
  MapPin, 
  Users, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  Sliders,
  Volume2
} from "lucide-react";
import { Language, translations } from "@/lib/i18n/translations";

export default function HomePage() {
  const [lang, setLang] = useState<Language>("en");
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(1);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const savedLang = localStorage.getItem("hl_lang") as Language;
      if (savedLang) setLang(savedLang);

      const handleLangChange = (e: Event) => {
        const customEvent = e as CustomEvent<Language>;
        if (customEvent.detail) setLang(customEvent.detail);
      };
      window.addEventListener("hl_lang_changed", handleLangChange);

      // Fetch active alerts count
      fetch("/api/sos?status=active")
        .then((res) => res.json())
        .then((data) => {
          if (data.alerts) setActiveAlertsCount(data.alerts.length);
        })
        .catch(() => {});

      return () => {
        window.removeEventListener("hl_lang_changed", handleLangChange);
      };
    }
  }, []);

  const t = translations[lang] || translations.en;

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        
        {/* Mountain background glow & topography decoration */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center">
          
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-300 mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-bold">Khumbu Mesh Gateway Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Everest Trail 2,800m – 5,364m</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight">
            Off-Grid Mountain <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">Emergency SOS</span> & Mesh Rescue
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
            {t.tagline}. Connecting stranded climbers, local Sherpa guides, and helicopter rescue posts through geo-fencing and peer-to-peer Bluetooth relay when cellular networks fail.
          </p>

          {/* Quick Action Matrix: 3 Core Persona Portals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-10 text-left">
            
            {/* 1. Trekker SOS Portal */}
            <Link
              href="/sos"
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border-2 border-red-700/80 hover:border-red-500 transition-all shadow-xl hover:shadow-red-950/50 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-red-950">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-red-400 mb-1">
                  Immediate Distress
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-red-300 transition-colors">
                  {t.roleTrekker}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  One-tap distress beacon. Transmits GPS coords, elevation, voice note, and queues to offline BLE mesh when disconnected.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-red-900/40 text-red-400 text-xs font-bold">
                <span>Trigger Beacon</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Local Responder Portal */}
            <Link
              href="/alerts"
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-800/60 hover:border-amber-500 transition-all shadow-xl hover:shadow-amber-950/50 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-950">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                  Field Responders
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  {t.roleGuide} & Lodges
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Live feed of active distress calls within 10km radius. Loud siren alarm, audio TTS in Nepali, and &quot;I CAN HELP&quot; ETA board.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-amber-900/40 text-amber-400 text-xs font-bold">
                <span>View Live Alerts</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Rescue Coordination HQ */}
            <Link
              href="/dashboard"
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-950 border border-blue-800/60 hover:border-blue-500 transition-all shadow-xl hover:shadow-blue-950/50 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-950">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 mb-1">
                  Tactical Command
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                  {t.roleRescue}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Full tactical map with real-time incident pins, helicopter weather windows, responder distribution, and breadcrumb trails.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-blue-900/40 text-blue-400 text-xs font-bold">
                <span>Open Tactical Map</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

          </div>

          {/* Hackathon Judge Interactive Test Bench Banner */}
          <div className="mt-8 w-full bg-slate-900/90 border border-emerald-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-white">Hackathon Evaluation Control Center</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Judge Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  1-Click Everest trail seeding, off-grid simulation, and animated multi-hop mesh packet propagation demo.
                </p>
              </div>
            </div>

            <Link
              href="/demo"
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950 flex-shrink-0"
            >
              <span>Launch Demo Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* Technical Highlights Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <h2 className="text-xl font-bold text-center text-slate-200 mb-8">
          Engineered for Extreme Himalayan Conditions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800">
            <WifiOff className="w-6 h-6 text-red-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Offline-First IndexedDB</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When 4G drops above Namche (3,440m), distress calls are stored locally and re-attempted on any connection change.
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800">
            <Radio className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">BLE Multi-Hop Mesh</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Packets bounce peer-to-peer across passing trekkers and solar repeaters until reaching a connected satellite gateway.
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800">
            <Volume2 className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Low-Literacy & TTS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-contrast icon-first screens, large touch targets for gloved hands, and Web Speech API reading alerts aloud in Nepali/Hindi/English.
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800">
            <MapPin className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Haversine Geo-Fencing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant spherical distance calculations with Himalayan elevation gradient adjustments (Tobler&apos;s alpine hiking function).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
