"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Mistake {
  id: string;
  word: string;
  translation_es: string;
  translation_pt: string;
  part_of_speech: string | null;
  attempt_count: number;
  correct_count: number;
  error_count: number;
  last_attempt: string;
  last_wrong_answer: string | null;
}

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback((text: string, lang = "en-US") => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.82;
    const voices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();
    const primary = lang.split("-")[0];
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(primary + "-")) ||
      voices.find((v) => v.lang.startsWith(primary));
    if (voice) u.voice = voice;
    synth.speak(u);
  }, []);

  useEffect(() => {
    fetch("/api/quiz/mistakes")
      .then((r) => r.json())
      .then((d) => { setMistakes(d.mistakes ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-300">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/quiz" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Evaluar
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Mis errores</h1>
          <p className="text-gray-500 mt-0.5">
            {mistakes.length === 0
              ? "Sin errores registrados"
              : `${mistakes.length} palabras con errores`}
          </p>
        </div>
        <Link
          href="/quiz/stats"
          className="shrink-0 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Estadísticas →
        </Link>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-5xl">🎉</p>
          <p className="text-gray-500 font-medium">¡Sin errores registrados todavía!</p>
          <Link
            href="/quiz"
            className="inline-block text-sm text-indigo-600 hover:underline"
          >
            Comenzar evaluación →
          </Link>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span className="flex-1">Palabra</span>
            <span className="w-28 text-center hidden sm:block">Intentos</span>
            <span className="w-20 text-center">Errores</span>
            <span className="w-20 text-center hidden md:block">Precisión</span>
            <span className="w-32 hidden lg:block">Último error</span>
            <span className="w-20 text-right hidden lg:block">Fecha</span>
          </div>

          <div className="space-y-1.5">
            {mistakes.map((m) => {
              const accuracy =
                m.attempt_count > 0
                  ? Math.round((m.correct_count / m.attempt_count) * 100)
                  : 0;
              const lastDate = new Date(m.last_attempt).toLocaleDateString("es-ES", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  {/* Word */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{m.word}</span>
                      {m.part_of_speech && (
                        <span className="text-xs text-gray-400 italic">{m.part_of_speech}</span>
                      )}
                      <button
                        onClick={() => speak(m.word)}
                        className="text-gray-300 hover:text-indigo-500 transition-colors text-sm"
                        title="Escuchar pronunciación"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {m.translation_es} · {m.translation_pt}
                    </p>
                  </div>

                  {/* Attempts */}
                  <span className="w-28 text-center text-sm text-gray-500 hidden sm:block">
                    {m.correct_count}✓ / {m.error_count}✗
                  </span>

                  {/* Error count */}
                  <div className="w-20 text-center">
                    <span className="text-sm font-bold text-rose-600">{m.error_count}</span>
                  </div>

                  {/* Accuracy */}
                  <div className="w-20 text-center hidden md:block">
                    <span
                      className={`text-sm font-semibold ${
                        accuracy >= 80
                          ? "text-emerald-600"
                          : accuracy >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {accuracy}%
                    </span>
                  </div>

                  {/* Last wrong answer */}
                  <div className="w-32 hidden lg:block">
                    {m.last_wrong_answer && (
                      <span className="text-xs text-rose-500 font-medium truncate block">
                        &ldquo;{m.last_wrong_answer}&rdquo;
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <span className="w-20 text-right text-xs text-gray-400 hidden lg:block shrink-0">
                    {lastDate}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/quiz"
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
            >
              Practicar estas palabras →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
