"use client";

import { useEffect, useRef, useState } from "react";

const LANG_LABELS: Record<string, string> = {
  "en-US": "🇺🇸 EN",
  "es-ES": "🇪🇸 ES",
  "pt-BR": "🇧🇷 PT",
};

interface Props {
  text: string;
  lang: "en-US" | "es-ES" | "pt-BR";
  onPointerDown?: (e: React.PointerEvent) => void;
}

export default function SpeechButton({ text, lang, onPointerDown }: Props) {
  const [state, setState] = useState<"idle" | "playing" | "unsupported">("idle");
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setState("unsupported");
      return;
    }

    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const synth = window.speechSynthesis;
    if (!synth) return;

    if (synth.speaking) {
      synth.cancel();
      setState("idle");
      return;
    }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.82;

    // Pick the best available voice for the language
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : synth.getVoices();

    const primary = lang.split("-")[0];
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(primary + "-")) ||
      voices.find((v) => v.lang.startsWith(primary));
    if (voice) u.voice = voice;

    u.onstart = () => setState("playing");
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");

    // Chrome bug: voices might still be empty on first call
    if (voices.length === 0) {
      const handler = () => {
        voicesRef.current = synth.getVoices();
        const v2 = voicesRef.current.find((v) => v.lang === lang) ||
                   voicesRef.current.find((v) => v.lang.startsWith(primary));
        if (v2) u.voice = v2;
        synth.speak(u);
        synth.removeEventListener("voiceschanged", handler);
      };
      synth.addEventListener("voiceschanged", handler);
      // Fallback: speak without specific voice after 300ms
      setTimeout(() => { if (state === "idle") synth.speak(u); }, 300);
    } else {
      synth.speak(u);
    }
  };

  if (state === "unsupported") return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={onPointerDown}
      className={`flex items-center gap-1 text-xs font-medium border px-3 py-1.5 rounded-lg transition-all select-none ${
        state === "playing"
          ? "bg-indigo-100 border-indigo-400 text-indigo-700 ring-2 ring-indigo-300"
          : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
      }`}
    >
      {state === "playing" ? "⏸" : "🔊"} {LANG_LABELS[lang]}
    </button>
  );
}
