"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check, AlertCircle } from "lucide-react";

interface VoiceNoteRecorderProps {
  onAudioReady: (base64Audio: string | null) => void;
  maxSeconds?: number;
}

export default function VoiceNoteRecorder({
  onAudioReady,
  maxSeconds = 10,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    try {
      if (typeof window === "undefined" || !navigator.mediaDevices) {
        throw new Error("Microphone API is not supported on this device");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64 for API transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          onAudioReady(base64Data);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release mic hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxSeconds - 1) {
            stopRecording();
            return maxSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMicError(message.includes("Permission denied") ? "Microphone permission denied" : "Mic unavailable");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const clearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsPlaying(false);
    onAudioReady(null);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-slate-200">10s Mountain Voice Note</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {isRecording ? `${recordingSeconds}s / ${maxSeconds}s` : audioUrl ? "Ready" : "Optional"}
        </span>
      </div>

      {micError && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-900/60 mb-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {!audioUrl ? (
          !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Mic className="w-4 h-4 text-red-500" />
              <span>Record Voice Note (Tap to speak)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 animate-pulse transition-all shadow-lg shadow-red-900/50"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Recording ({maxSeconds - recordingSeconds}s remaining)</span>
            </button>
          )
        ) : (
          <div className="flex-1 flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Voice attached ({recordingSeconds}s)
              </span>
            </div>

            <button
              type="button"
              onClick={clearRecording}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-all"
              title="Delete recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="mt-2 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all duration-300"
            style={{ width: `${(recordingSeconds / maxSeconds) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
