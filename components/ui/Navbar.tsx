"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Radio,
  MapPin,
  ShieldAlert,
  Wifi,
  WifiOff,
  Sliders,
  Globe,
  Mountain,
  Users
} from "lucide-react";
import { Language, translations } from "@/lib/i18n/translations";
import { flushOfflineQueue, getQueuedAlerts } from "@/lib/offline/sosQueue";

export default function Navbar() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [activeRole, setActiveRole] = useState<string>("trekker");
  const [user, setUser] = useState<{ name: string; role: string; phone: string } | null>(null);

  useEffect(() => {
    // Authentication fetch removed to allow easy role switching via dropdown for the hackathon
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("hl_role") || "trekker";
      setActiveRole(savedRole);
      document.cookie = `hl_role=${savedRole}; path=/; max-age=31536000`;
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        flushOfflineQueue((syncedId) => {
          console.log("Automatically synced offline SOS:", syncedId);
        }).then(() => checkQueued());
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const checkQueued = async () => {
        try {
          const items = await getQueuedAlerts();
          setQueuedCount(items.length);
        } catch {
          // IndexedDB fallback
        }
      };
      checkQueued();
      const interval = setInterval(checkQueued, 4000);

      // Read stored role/lang
      const savedLang = localStorage.getItem("hl_lang") as Language;
      if (savedLang) setCurrentLang(savedLang);

      // const savedRole = localStorage.getItem("hl_role");
      if (savedRole) {
        setActiveRole(savedRole);
        document.cookie = `hl_role=${savedRole}; path=/; max-age=31536000`;
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        clearInterval(interval);
      };
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("hl_lang", lang);
      window.dispatchEvent(new CustomEvent("hl_lang_changed", { detail: lang }));
    }
  };

  const changeRole = (role: string) => {
    setActiveRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("hl_role", role);
      document.cookie = `hl_role=${role}; path=/; max-age=31536000`;
      window.dispatchEvent(new CustomEvent("hl_role_changed", { detail: role }));
    }
  };

  const t = translations[currentLang];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              <Mountain className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 hidden md:inline-block">
                  NEPAL SOS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Khumbu & Everest Mesh Rescue
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <Link
              href="/sos"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${pathname === "/sos"
                ? "bg-red-600 text-white shadow-md shadow-red-900/40 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
              <span>SOS Beacon</span>
            </Link>

            <Link
              href="/alerts"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${pathname.startsWith("/alerts")
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Nearby Alerts</span>
            </Link>

            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${pathname === "/dashboard"
                ? "bg-blue-600 text-white shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-300" />
              <span>Rescue HQ</span>
            </Link>

            <Link
              href="/demo"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${pathname === "/demo"
                ? "bg-emerald-600 text-white shadow-md font-bold"
                : "text-emerald-400 hover:text-emerald-200 hover:bg-slate-800 font-bold"
                }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Demo Center</span>
            </Link>

            <Link
              href="/history"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${pathname === "/history"
                ? "bg-purple-600 text-white shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>History</span>
            </Link>
          </nav>

          {/* Right Controls: Role, Language, Connectivity */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Role Switcher (Always visible for Hackathon Demo) */}
            <div className="hidden md:flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <Users className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
              <select
                value={activeRole}
                onChange={(e) => changeRole(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium py-1 px-2 focus:outline-none cursor-pointer"
                title="Switch Active Persona"
              >
                <option value="trekker" className="bg-slate-900 text-white">Role: Trekker</option>
                {/* <option value="guide" className="bg-slate-900 text-white">Role: Local Sherpa Guide</option> */}
                {/* <option value="lodge_owner" className="bg-slate-900 text-white">Role: Lodge Owner</option> */}
                <option value="rescue_coordinator" className="bg-slate-900 text-white">Role: Rescue HQ / Army</option>
              </select>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {(["en", "ne", "hi"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${currentLang === lang
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  {lang === "en" ? "EN" : lang === "ne" ? "ने" : "हि"}
                </button>
              ))}
            </div>

            {/* Offline / Online Connectivity Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${isOnline
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-red-950/80 border-red-700 text-red-300 animate-pulse"
                }`}
              title={isOnline ? "Connected to Internet Uplink" : "Off-Grid: Using IndexedDB & BLE Mesh Relay"}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span>Off-Grid (Mesh)</span>
                </>
              )}
              {queuedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]" title={`${queuedCount} SOS queued in IndexedDB`}>
                  {queuedCount} queued
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs font-semibold">
          <Link
            href="/sos"
            className={`flex items-center gap-1 px-2.5 py-1 rounded ${pathname === "/sos" ? "bg-red-600 text-white" : "text-slate-400"
              }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
            <span>SOS</span>
          </Link>
          <Link
            href="/alerts"
            className={`flex items-center gap-1 px-2.5 py-1 rounded ${pathname.startsWith("/alerts") ? "bg-amber-600 text-white" : "text-slate-400"
              }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Alerts</span>
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center gap-1 px-2.5 py-1 rounded ${pathname === "/dashboard" ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>HQ Map</span>
          </Link>
          <Link
            href="/demo"
            className={`flex items-center gap-1 px-2.5 py-1 rounded ${pathname === "/demo" ? "bg-emerald-600 text-white" : "text-emerald-400 font-bold"
              }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Demo</span>
          </Link>
        </div>

      </div>
    </header>
  );
}
