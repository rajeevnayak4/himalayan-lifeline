/**
 * Audio Alarm & Text-To-Speech (TTS) Engine
 * Uses Web Audio API for synthetic alpine distress siren
 * Uses Web Speech API for low-literacy trilingual voice readout
 */

let activeAudioCtx: AudioContext | null = null;
let activeOscillator: OscillatorNode | null = null;
let sirenInterval: NodeJS.Timeout | null = null;

export function playEmergencySiren(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error webkit prefix fallback
      window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!activeAudioCtx || activeAudioCtx.state === "closed") {
      activeAudioCtx = new AudioContextClass();
    }

    if (activeAudioCtx.state === "suspended") {
      activeAudioCtx.resume();
    }

    // Stop previous instance if any
    stopEmergencySiren();

    const ctx = activeAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    let high = true;
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (A5)
    osc.start();

    sirenInterval = setInterval(() => {
      if (!ctx || ctx.state === "closed") return;
      high = !high;
      const targetFreq = high ? 880 : 660; // Alternating 880Hz / 660Hz Alpine Siren
      try {
        osc.frequency.exponentialRampToValueAtTime(targetFreq, ctx.currentTime + 0.1);
      } catch {
        // Safe fallback
      }
    }, 450);

    activeOscillator = osc;
  } catch (err) {
    console.warn("Web Audio API not allowed without user gesture:", err);
  }
}

export function stopEmergencySiren(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  if (activeOscillator) {
    try {
      activeOscillator.stop();
      activeOscillator.disconnect();
    } catch {
      // Ignored
    }
    activeOscillator = null;
  }
}

export function speakAlertText(text: string, lang: "en" | "ne" | "hi" = "en"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for emergency comprehension
    utterance.pitch = 1.05;

    // Pick best matching voice code
    const langCodeMap: Record<string, string> = {
      en: "en-US",
      ne: "ne-NP",
      hi: "hi-IN",
    };
    utterance.lang = langCodeMap[lang] || "en-US";

    // Attempt to select specific native voice if available in browser
    const voices = window.speechSynthesis.getVoices();
    let matchingVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().split("-")[0])
    );

    // Fallback: If Nepali is requested but no Nepali voice is found, try Hindi.
    // Hindi and Nepali share the Devanagari script, so a Hindi TTS engine 
    // can pronounce Nepali text relatively well, whereas an English one cannot.
    if (!matchingVoice && lang === "ne") {
      matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
      if (matchingVoice) {
        utterance.lang = "hi-IN";
      }
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Web Speech API error:", err);
  }
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
