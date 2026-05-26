"use client";

import { useEffect, useState } from "react";
import { words, categoryColors, posColors, type Category, type PartOfSpeech } from "@/lib/words";
import { getProgress, markAsKnown, markAsLearning, unmark, type Progress } from "@/lib/storage";

export default function WordsPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [filterPos, setFilterPos] = useState<PartOfSpeech | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "known" | "learning" | "new">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadProgress = () => setProgress(getProgress());

  useEffect(() => {
    loadProgress();
  }, []);

  const filtered = words.filter((w) => {
    if (filterCat !== "all" && w.category !== filterCat) return false;
    if (filterPos !== "all" && w.partOfSpeech !== filterPos) return false;
    if (filterStatus === "known" && !progress?.known.includes(w.id)) return false;
    if (filterStatus === "learning" && !progress?.learning.includes(w.id)) return false;
    if (filterStatus === "new" && (progress?.known.includes(w.id) || progress?.learning.includes(w.id))) return false;
    if (search) {
      const q = search.toLowerCase();
      return w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q);
    }
    return true;
  });

  const handleKnown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsKnown(id);
    loadProgress();
  };

  const handleLearning = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsLearning(id);
    loadProgress();
  };

  const handleUnmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unmark(id);
    loadProgress();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lista de palabras</h1>
        <p className="text-gray-500 mt-1">{filtered.length} de {words.length} palabras</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Buscar palabra o traducción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white"
        />
        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          {(["all", "beginner", "intermediate", "advanced"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                filterCat === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {cat === "all" ? "Todas" : cat === "beginner" ? "Principiante" : cat === "intermediate" ? "Intermedio" : "Avanzado"}
            </button>
          ))}
          <div className="w-px bg-gray-200" />
          {/* Status filter */}
          {(["all", "known", "learning", "new"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                filterStatus === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {s === "all" ? "Todas" : s === "known" ? "✓ Dominadas" : s === "learning" ? "📖 Aprendiendo" : "✦ Nuevas"}
            </button>
          ))}
        </div>
      </div>

      {/* Word list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p>No se encontraron palabras</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => {
            const isKnown = (progress?.known ?? []).includes(w.id);
            const isLearning = (progress?.learning ?? []).includes(w.id);
            const isExpanded = expanded === w.id;

            return (
              <div
                key={w.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all cursor-pointer ${
                  isKnown ? "border-emerald-200" : isLearning ? "border-blue-200" : "border-gray-200"
                }`}
                onClick={() => setExpanded(isExpanded ? null : w.id)}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{w.word}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[w.category]}`}>
                        {w.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${posColors[w.partOfSpeech]}`}>
                        {w.partOfSpeech}
                      </span>
                      {isKnown && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          ✓ Dominada
                        </span>
                      )}
                      {isLearning && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          📖 Aprendiendo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{w.translation}</p>
                  </div>
                  <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Pronunciación</p>
                      <p className="text-sm font-mono text-gray-700">{w.pronunciation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Ejemplo</p>
                      <p className="text-sm text-gray-700 italic">&ldquo;{w.example}&rdquo;</p>
                      <p className="text-xs text-gray-500 mt-0.5">{w.exampleTranslation}</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => handleKnown(w.id, e)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        ✓ La sé
                      </button>
                      <button
                        onClick={(e) => handleLearning(w.id, e)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        📖 Aprendiendo
                      </button>
                      {(isKnown || isLearning) && (
                        <button
                          onClick={(e) => handleUnmark(w.id, e)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          ✕ Desmarcar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
