"use client";

import React, { useEffect, useState } from "react";
import AlertModal, { ActiveDistressAlert } from "./AlertModal";
import TrekkerUpdateModal, { TrekkerUpdatePayload } from "./TrekkerUpdateModal";
import { Language } from "@/lib/i18n/translations";
import { useRouter } from "next/navigation";

export default function GlobalAlertListener() {
  const [urgentModalAlert, setUrgentModalAlert] = useState<ActiveDistressAlert | null>(null);
  const [trekkerUpdate, setTrekkerUpdate] = useState<TrekkerUpdatePayload | null>(null);
  const [lang, setLang] = useState<Language>("en");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("hl_lang") as Language;
      if (savedLang) setLang(savedLang);

      const handleLangChange = (e: Event) => {
        const customEvent = e as CustomEvent<Language>;
        if (customEvent.detail) setLang(customEvent.detail);
      };
      window.addEventListener("hl_lang_changed", handleLangChange);

      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource("/api/realtime");
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "sos_triggered" && parsed.data?.alert) {
              const newAlert = parsed.data.alert;
              const role = localStorage.getItem("hl_role");
              
              if (role === "rescue_coordinator" || role === "guide") {
                setUrgentModalAlert({
                id: newAlert.id,
                victimName: newAlert.victim?.name || "Trekker in Distress",
                phone: newAlert.victim?.phone || "+977 9800000000",
                lat: newAlert.lat,
                lng: newAlert.lng,
                altitude: newAlert.altitude,
                locationName: newAlert.locationName,
                injuryType: newAlert.injuryType,
                message: newAlert.message,
                audioBase64: newAlert.audioBase64,
                distanceKm: 4.2, // Proximity estimate
                trekRoute: newAlert.victim?.trekRoute,
              });
              }
              // Tell other pages (like /alerts) to refresh their lists
              window.dispatchEvent(new Event("hl_refetch_alerts"));
            } else if (parsed.type === "responder_update" || parsed.type === "alert_resolved") {
              if (parsed.type === "responder_update") {
                const role = localStorage.getItem("hl_role") || "trekker";
                if (role === "trekker") {
                  setTrekkerUpdate(parsed.data);
                }
              }
              if (parsed.type === "alert_resolved") {
                setUrgentModalAlert(null);
              }
              window.dispatchEvent(new Event("hl_refetch_alerts"));
            }
          } catch {
            // Ignore parse errors
          }
        };
      } catch (err) {
        console.warn("SSE stream connection error:", err);
      }

      // Listen for Offline Mesh Broadcasts (Simulated from Demo)
      let meshBc: BroadcastChannel | null = null;
      try {
        meshBc = new BroadcastChannel("hl_mesh_alert");
        meshBc.onmessage = (event) => {
          if (event.data?.type === "offline_alert" && event.data?.alert) {
            const role = localStorage.getItem("hl_role");
            if (role === "rescue_coordinator" || role === "guide") {
              setUrgentModalAlert(event.data.alert);
            }
            window.dispatchEvent(new Event("hl_refetch_alerts"));
          }
        };
      } catch (e) {}

      // Listen for Service Worker Sync Events
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === "SYNC_OFFLINE_SOS") {
          window.dispatchEvent(new Event("hl_refetch_alerts"));
        }
      };
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", handleSwMessage);
      }

      return () => {
        window.removeEventListener("hl_lang_changed", handleLangChange);
        if (eventSource) eventSource.close();
        if (meshBc) meshBc.close();
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.removeEventListener("message", handleSwMessage);
        }
      };
    }
  }, []);

  const handleAcceptHelp = async (alertId: string, etaMinutes: number, audioBase64?: string) => {
    try {
      await fetch(`/api/sos/${alertId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responderName: "Pasang Sherpa (Local Guide)",
          role: "guide",
          status: "en_route",
          etaMinutes,
          audioBase64,
          message: "Ascending from Dingboche trail with medical kit & warm tea.",
        }),
      });
      setUrgentModalAlert(null);
      window.dispatchEvent(new Event("hl_refetch_alerts"));
    } catch (err) {
      console.error("Failed to respond to alert:", err);
    }
  };

  const handleNotifyRescueHQ = async (alertId: string) => {
    alert("Alert escalated to Nepal Army Mountain Rescue Post (Namche) and Air Evacuation Command.");
    setUrgentModalAlert(null);
  };

  return (
    <>
      <AlertModal
        alert={urgentModalAlert}
        onDismiss={() => {
          setUrgentModalAlert(null);
          router.push("/dashboard");
        }}
        onAcceptHelp={handleAcceptHelp}
        onNotifyRescueTeam={handleNotifyRescueHQ}
        lang={lang}
      />
      <TrekkerUpdateModal 
        update={trekkerUpdate} 
        onDismiss={() => setTrekkerUpdate(null)} 
      />
    </>
  );
}
