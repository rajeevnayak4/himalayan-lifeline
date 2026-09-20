"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  ShieldAlert,
  PhoneCall,
  Check,
  Radio,
  Navigation,
  Mic,
  Square,
  Play
} from "lucide-react";
import { playEmergencySiren, stopEmergencySiren, speakAlertText, stopSpeech } from "@/lib/audio/alarm";
import { Language, translations } from "@/lib/i18n/translations";
import dynamic from "next/dynamic";
import { MapMarkerItem } from "@/components/map/HimalayanMap";

const HimalayanMap = dynamic(() => import("@/components/map/HimalayanMap"), { ssr: false });

export interface ActiveDistressAlert {
  id: string;
  victimName: string;
  phone: string;
  lat: number;
  lng: number;
  altitude?: number;
  locationName?: string;
  injuryType: string;
  message?: string;
  audioBase64?: string;
  distanceKm?: number;
  estimatedEtaMinutes?: number;
  trekRoute?: string;
}

interface AlertModalProps {
  alert: ActiveDistressAlert | null;
  onDismiss: () => void;
  onAcceptHelp: (alertId: string, etaMinutes: number, audioBase64?: string) => void;
  onNotifyRescueTeam: (alertId: string) => void;
  lang?: Language;
}

export default function AlertModal({
  alert,
  onDismiss,
  onAcceptHelp,
  onNotifyRescueTeam,
  lang = "en",
}: AlertModalProps) {
  const [isPlayingSound, setIsPlayingSound] = useState(true);
  const [selectedEta, setSelectedEta] = useState<number>(30);
  const t = translations[lang] || translations.en;

  // Audio Recording State for Rescuer
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [rescuerAudioBase64, setRescuerAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (alert) {
      playEmergencySiren();
      setIsPlayingSound(true);

      // Speak alert in local language
      const injuryName =
        alert.injuryType === "fall_fracture"
          ? t.injuryFall
          : alert.injuryType === "altitude_sickness"
            ? t.injuryAltitude
            : alert.injuryType === "hypothermia"
              ? t.injuryHypothermia
              : alert.injuryType === "lost_avalanche"
                ? t.injuryAvalanche
                : t.injuryOther;

      const speechMessage = `${t.newAlertHeader}. ${alert.victimName}, ${alert.locationName || ""}. ${injuryName}. ${alert.distanceKm ? `${alert.distanceKm} km.` : ""}`;
      speakAlertText(speechMessage, lang);
    }

    return () => {
      stopEmergencySiren();
      stopSpeech();
    };
  }, [alert, lang, t]);

  if (!alert) return null;

  const toggleSound = () => {
    if (isPlayingSound) {
      stopEmergencySiren();
      stopSpeech();
      setIsPlayingSound(false);
    } else {
      playEmergencySiren();
      setIsPlayingSound(true);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRescuerAudioBase64(reader.result as string);
        };
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      window.alert("Microphone access is required to record a voice note.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleSpeech = () => {
    const speechMessage = `${t.newAlertHeader}. ${alert.victimName}, ${alert.locationName || ""}. ${alert.message || ""}`;
    speakAlertText(speechMessage, lang);
  };

  const getInjuryLabel = () => {
    switch (alert.injuryType) {
      case "fall_fracture":
        return { label: t.injuryFall, icon: "🦴", color: "bg-rose-900/60 text-rose-300" };
      case "altitude_sickness":
        return { label: t.injuryAltitude, icon: "🏔️", color: "bg-purple-900/60 text-purple-300" };
      case "hypothermia":
        return { label: t.injuryHypothermia, icon: "❄️", color: "bg-cyan-900/60 text-cyan-300" };
      case "lost_avalanche":
        return { label: t.injuryAvalanche, icon: "⚠️", color: "bg-amber-900/60 text-amber-300" };
      default:
        return { label: t.injuryOther, icon: "🚨", color: "bg-red-900/60 text-red-300" };
    }
  };

  const injuryInfo = getInjuryLabel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Flashing border pulse */}
      <div className="absolute inset-0 border-8 border-red-600/60 animate-pulse pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-slate-950 border-2 border-red-600 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 flex flex-col gap-5 max-h-[95vh] overflow-y-auto">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-red-400">
              PRIORITY 1 DISTRESS CALL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeech}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Speak alert text"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Listen</span>
            </button>
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${isPlayingSound ? "bg-red-600 text-white animate-bounce" : "bg-slate-800 text-slate-400"
                }`}
              title="Toggle Siren Alarm"
            >
              {isPlayingSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Big Icon & Distress Banner */}
        <div className="flex items-center gap-4 bg-red-950/50 p-4 rounded-2xl border border-red-800/80">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950">
            <AlertTriangle className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t.newAlertHeader}
            </h2>
            <p className="text-sm font-semibold text-red-300">
              {alert.victimName} ({alert.phone})
            </p>
          </div>
        </div>

        {/* Injury & Location Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-3.5 rounded-xl border border-red-800/40 flex items-center gap-2.5 ${injuryInfo.color}`}>
            <span className="text-2xl">{injuryInfo.icon}</span>
            <div>
              <span className="text-[10px] block uppercase font-bold tracking-wider text-slate-400">Condition</span>
              <span className="text-sm font-extrabold">{injuryInfo.label}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] block uppercase font-bold tracking-wider text-slate-400">
                {t.distanceKm} & Location
              </span>
              <span className="text-sm font-bold text-white">
                {alert.distanceKm ? `~${alert.distanceKm} km away` : "Nearby"}
                {alert.altitude ? ` (${alert.altitude}m)` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Message / Trail Route */}
        {(alert.message || alert.audioBase64) && (
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Transmitted Message & Voice Note
            </span>
            {alert.message && (
              <p className="text-sm text-slate-200 italic font-medium leading-relaxed">
                &quot;{alert.message}&quot;
              </p>
            )}
            {alert.audioBase64 && (
              <audio controls src={alert.audioBase64} className="w-full h-8" />
            )}
          </div>
        )}

        {/* Small Tactical Map */}
        <div className="min-h-[500px] rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
          <HimalayanMap
            center={[alert.lat, alert.lng]}
            zoom={13}
            className="w-full h-full"
            markers={[
              {
                id: alert.id,
                lat: alert.lat,
                lng: alert.lng,
                title: alert.victimName,
                type: "victim"
              },
              {
                id: "responder",
                lat: 27.8920, // Mock gateway/responder coord (Dingboche)
                lng: 86.8315,
                title: "Your Location",
                type: "responder"
              }
            ]}
            meshHops={[{
              fromLat: 27.8920,
              fromLng: 86.8315,
              toLat: alert.lat,
              toLng: alert.lng,
              fromName: "You",
              toName: alert.victimName
            }]}
          />
          <div className="absolute top-2 left-2 z-[400] bg-slate-950/80 px-2 py-1 rounded text-[10px] text-slate-200 font-bold border border-slate-800">
            {alert.distanceKm ? `Distance: ~${alert.distanceKm}km` : "Calculating..."}
          </div>
        </div>

        {/* ETA Selector for Responder */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Select Your Estimated Response Time (Walking/Climbing):
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((eta) => (
              <button
                key={eta}
                onClick={() => setSelectedEta(eta)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${selectedEta === eta
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
              >
                {eta} min
              </button>
            ))}
          </div>
        </div>

        {/* Rescuer Voice Note Recorder */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Record Voice Note for Trekker (Optional):
          </span>
          {!recordedAudioUrl ? (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
              <span>{isRecording ? "Recording... (Release to stop)" : "Hold to Record Voice Message"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl">
              <audio src={recordedAudioUrl} controls className="w-full h-8" />
              <button
                onClick={() => {
                  setRecordedAudioUrl(null);
                  setRescuerAudioBase64(null);
                }}
                className="p-2 text-slate-400 hover:text-red-400"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons: Low-Literacy / Giant Touch Targets */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => {
              stopEmergencySiren();
              stopSpeech();
              onAcceptHelp(alert.id, selectedEta, rescuerAudioBase64 || undefined);
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/60 transition-all active:scale-98"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>{t.iCanHelp} (ETA ~{selectedEta}m)</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                stopEmergencySiren();
                stopSpeech();
                onNotifyRescueTeam(alert.id);
              }}
              className="py-3 px-4 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t.notifyRescueTeam}</span>
            </button>

            <button
              onClick={() => {
                stopEmergencySiren();
                stopSpeech();
                onDismiss();
              }}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs sm:text-sm transition-all"
            >
              View Details
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
