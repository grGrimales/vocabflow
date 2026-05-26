"use client";

import { useEffect, useState, useCallback } from "react";
import { words, categoryColors, type Category } from "@/lib/words";
import { getProgress, markAsKnown, markAsLearning, unmark, type Progress } from "@/lib/storage";

type FilterMode = "all" | "learning" | "unknown";

export default function FlashcardsPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [deck, setDeck] = useState(words);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const loadProgress = useCallback(() => {
    const p = getProgress();
    setProgress(p);
    return p;
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const p = progress ?? getProgress();
    let filtered = words;
    if (filterCategory !== "all") {
      filtered = filtered.filter((w) => w.category === filterCategory);
    }
    if (filterMode === "learning") {
      filtered = filtered.filter((w) => p.learning.includes(w.id));
    } else if (filterMode === "unknown") {
      filtered = filtered.filter((w) => !p.known.includes(w.id) && !p.learning.includes(w.id));
    }
    setDeck(filtered);
    setIndex(0);
    setFlipped(false);
    setFinished(false);
  }, [filterCategory, filterMode, progress]);

  const current = deck[index];

  const next = useCallback(() => {
    setFlipped(false);
    setTimeout(() => {
      if (index + 1 >= deck.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
      }
    }, 150);
  }, [index, deck.length]);

  const prev = useCallback(() => {
    if (index === 0) return;
    setFlipped(false);
    setTimeout(() => setIndex((i) => i - 1), 150);
  }, [index]);

  const handleMarkKnown = () => {
    if (!current) return;
    markAsKnown(current.id);
    loadProgress();
    next();
  };

  const handleMarkLearning = () => {
    if (!current) return;
    markAsLearning(current.id);
    loadProgress();
    next();
  };

  const handleUnmark = () => {
    if (!current) return;
    unmark(current.id);
    loadProgress();
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setFinished(false);
  };

  const isKnown = current ? (progress?.known ?? []).includes(current.id) : false;
  const isLearning = current ? (progress?.learning ?? []).includes(current.id) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
        <p className="text-gray-500 mt-1">Haz clic en la tarjeta para ver la traducción</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat === "all" ? "Todas" : cat === "beginner" ? "Principiante" : cat === "intermediate" ? "Intermedio" : "Avanzado"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "learning", "unknown"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterMode === mode
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {mode === "all" ? "Todas" : mode === "learning" ? "Aprendiendo" : "Sin marcar"}
            </button>
          ))}
        </div>
      </div>

      {deck.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No hay palabras con este filtro</p>
        </div>
      ) : finished ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-5xl">🎉</p>
          <h2 className="text-xl font-bold text-gray-900">¡Terminaste el mazo!</h2>
          <p className="text-gray-500">{deck.length} tarjetas completadas</p>
          <button
            onClick={restart}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Volver a empezar
          </button>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{index + 1} / {deck.length}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all"
                style={{ width: `${((index + 1) / deck.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="flex justify-center">
            <div
              className="w-full max-w-lg cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={() => setFlipped((f) => !f)}
            >
              <div
                className="relative transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  minHeight: "280px",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 select-none"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mb-4 ${categoryColors[current.category]}`}>
                    {current.category} · {current.partOfSpeech}
                  </span>
                  <p className="text-4xl font-bold text-gray-900 text-center">{current.word}</p>
                  <p className="text-gray-400 mt-2 text-sm">{current.pronunciation}</p>
                  <p className="text-gray-400 mt-6 text-xs">Toca para ver la traducción</p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 bg-indigo-600 border border-indigo-600 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 select-none"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <p className="text-3xl font-bold text-white text-center">{current.translation}</p>
                  <p className="text-indigo-200 mt-4 text-sm text-center italic">&ldquo;{current.example}&rdquo;</p>
                  <p className="text-indigo-300 mt-1 text-xs text-center">{current.exampleTranslation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status badge */}
          {(isKnown || isLearning) && (
            <div className="flex justify-center">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${isKnown ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                {isKnown ? "✓ Dominada" : "📖 Aprendiendo"}
              </span>
            </div>
          )}

          {/* Navigation & actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleMarkLearning}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                📖 Aprendiendo
              </button>
              <button
                onClick={handleMarkKnown}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                ✓ La sé
              </button>
              {(isKnown || isLearning) && (
                <button
                  onClick={handleUnmark}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ✕ Desmarcar
                </button>
              )}
            </div>

            <button
              onClick={next}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
