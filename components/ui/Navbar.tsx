"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Users,
  Settings2,
  Menu,
  X,
  Check,
} from "lucide-react";
import { Language, translations } from "@/lib/i18n/translations";
import { flushOfflineQueue, getQueuedAlerts } from "@/lib/offline/sosQueue";

const NAV_ITEMS = [
  { href: "/sos", label: "SOS Beacon", short: "SOS", icon: AlertTriangle, accent: "bg-red-600" },
  { href: "/alerts", label: "Nearby Alerts", short: "Alerts", icon: Radio, accent: "bg-amber-600" },
  { href: "/dashboard", label: "Rescue HQ", short: "HQ", icon: ShieldAlert, accent: "bg-blue-600" },
  { href: "/demo", label: "Demo Center", short: "Demo", icon: Sliders, accent: "bg-emerald-600" },
  // { href: "/history", label: "History", short: "History", icon: MapPin, accent: "bg-purple-600" },
];

const ROLES = [
  { value: "trekker", label: "Trekker" },
  { value: "rescue_coordinator", label: "Rescue HQ / Army" },
  { value: "guide", label: "Guide" },
  { value: "local_lodge", label: "Local Lodge" },
];

const LANGS: { value: Language; label: string; native: string }[] = [
  { value: "en", label: "English", native: "EN" },
  { value: "ne", label: "नेपाली", native: "ने" },
  { value: "hi", label: "हिन्दी", native: "हि" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [activeRole, setActiveRole] = useState<string>("trekker");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedRole = localStorage.getItem("hl_role") || "trekker";
    setActiveRole(savedRole);
    document.cookie = `hl_role=${savedRole}; path=/; max-age=31536000`;
    setIsOnline(navigator.onLine);

    const savedLang = localStorage.getItem("hl_lang") as Language;
    if (savedLang) setCurrentLang(savedLang);

    const checkQueued = async () => {
      try {
        const items = await getQueuedAlerts();
        setQueuedCount(items.length);
      } catch {
        // IndexedDB unavailable — leave count as-is
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue((syncedId) => {
        console.log("Automatically synced offline SOS:", syncedId);
      }).then(() => checkQueued());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    checkQueued();
    const interval = setInterval(checkQueued, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!settingsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSettingsOpen(false);
  }, [pathname]);

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
  const isActive = (href: string) =>
    href === "/alerts" ? pathname.startsWith("/alerts") : pathname === href;
  const activeRoleLabel = ROLES.find((r) => r.value === activeRole)?.label ?? "Trekker";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 text-slate-100 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-900/30">
            <Mountain className="h-5 w-5 stroke-[2.5] text-white" />
          </span>
          <span className="hidden sm:block leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-white">
              {t.appTitle}
            </span>
            <span className="block text-[11px] font-medium text-slate-400">
              Khumbu mesh rescue
            </span>
          </span>
        </Link>

        {/* Primary navigation */}
        <nav className="mx-auto hidden items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900/70 p-1 text-sm font-semibold lg:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${active
                  ? `${accent} text-white shadow-sm`
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xl:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status + settings */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* <div
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${isOnline
              ? "border-emerald-800/70 bg-emerald-950/50 text-emerald-300"
              : "border-red-700 bg-red-950/80 text-red-300"
              }`}
            title={
              isOnline
                ? "Connected to internet uplink"
                : "Off-grid — queued locally and relayed over BLE mesh"
            }
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isOnline ? "Online" : "Off-grid"}</span>
            {queuedCount > 0 && (
              <span
                className="rounded-full bg-amber-500 px-1.5 text-[10px] font-extrabold text-slate-950"
                title={`${queuedCount} SOS waiting to sync`}
              >
                {queuedCount}
              </span>
            )}
          </div> */}

          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              aria-expanded={settingsOpen}
              aria-haspopup="true"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              title="Role and language"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{activeRoleLabel}</span>
              <span className="hidden md:inline text-slate-600">·</span>
              <span className="hidden md:inline">
                {LANGS.find((l) => l.value === currentLang)?.native}
              </span>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-black/60">
                <p className="px-2 pb-1 pt-1 text-xs font-semibold text-slate-500">
                  Active role
                </p>
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => changeRole(r.value)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      {r.label}
                    </span>
                    {activeRole === r.value && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </button>
                ))}

                <div className="my-1.5 border-t border-slate-800" />

                <p className="px-2 pb-1 text-xs font-semibold text-slate-500">Language</p>
                {LANGS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => changeLanguage(l.value)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      {l.label}
                    </span>
                    {currentLang === l.value && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SOS stays reachable on mobile at all times */}
          <Link
            href="/sos"
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-red-900/40 lg:hidden"
          >
            SOS
          </Link>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-slate-800 bg-slate-950 px-4 py-2 lg:hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${active ? `${accent} text-white` : "text-slate-300 hover:bg-slate-900"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}