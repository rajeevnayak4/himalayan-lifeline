"use client";

import React, { useEffect, useState, useRef } from "react";
import { CheckCircle, Clock, Volume2, ShieldCheck, MapPin } from "lucide-react";

export interface TrekkerUpdatePayload {
  alertId: string;
  responder: {
    id: string;
    name: string;
    role: string;
  };
  status: string;
  etaMinutes: number;
  audioBase64?: string;
}

interface TrekkerUpdateModalProps {
  update: TrekkerUpdatePayload | null;
  onDismiss: () => void;
}

// Put your own licensed clip here, e.g. public/sounds/gorkhali-alert.mp3.
// If it's missing or fails to load, we fall back to speech synthesis below.
const ALERT_SOUND_SRC = '/alarm.mp3';
const ALERT_SPOKEN_PHRASE = "Aaudai cha, Gorkhali Gorkhali";

export default function TrekkerUpdateModal({ update, onDismiss }: TrekkerUpdateModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!update) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const audio = new Audio(ALERT_SOUND_SRC);
    audioRef.current = audio;

    const speakFallback = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        const utterance = new SpeechSynthesisUtterance(ALERT_SPOKEN_PHRASE);
        utterance.lang = "ne-NP";
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis unavailable — silently skip
      }
    };

    audio.addEventListener("error", speakFallback);
    audio.play().catch(speakFallback);

    return () => {
      audio.pause();
      audio.removeEventListener("error", speakFallback);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [update]);

  if (!isVisible || !update) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Dark overlay with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onDismiss}
      />

      <div className="relative w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-6 animate-in zoom-in-95 fade-in duration-300">

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight text-center">Message reached, rescue team on the way!</h2>
          <p className="text-emerald-400 font-semibold text-sm">
            A rescue responder has acknowledged your SOS.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Responder</p>
              <p className="font-bold text-slate-200">{update.responder.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Estimated Time of Arrival</p>
              <p className="font-bold text-emerald-400 text-lg">~{update.etaMinutes} minutes</p>
            </div>
          </div>
        </div>

        {/* Voice Note */}
        {update.audioBase64 && (
          <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Voice Note from Responder
              </span>
            </div>
            <audio controls src={update.audioBase64} className="w-full h-10" />
          </div>
        )}

        {/* Action */}
        <button
          onClick={onDismiss}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm sm:text-base transition-all active:scale-95 shadow-lg shadow-emerald-900"
        >
          Acknowledge
        </button>

      </div>
    </div>
  );
}