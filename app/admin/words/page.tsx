"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Category = "all" | "beginner" | "intermediate" | "advanced";

interface Word {
  id: string;
  word: string;
  translation_es: string;
  translation_pt: string;
  category: string;
  part_of_speech: string | null;
  playlist_count: number;
  review_count: number;
  created_by_name: string | null;
  created_at: string;
}

const CAT_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-purple-100 text-purple-700",
};

const LIMIT = 30;

export default function AdminWordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");

  // Selection for bulk delete
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWords = useCallback(async (q: string, cat: Category, off: number, replace: boolean) => {
    setLoading(true);
    const params = new URLSearchParams({
      q, category: cat, limit: String(LIMIT), offset: String(off),
    });
    const res = await fetch(`/api/admin/words?${params}`);
    const data = await res.json();
    setWords((prev) => replace ? (data.words ?? []) : [...prev, ...(data.words ?? [])]);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  // Initial + filter change
  useEffect(() => {
    setOffset(0);
    setSelected(new Set());
    fetchWords(search, category, 0, true);
  }, [category]); // eslint-disable-line

  // Debounce search input
  const handleSearch = (q: string) => {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setOffset(0);
      setSelected(new Set());
      fetchWords(q, category, 0, true);
    }, 350);
  };

  const loadMore = () => {
    const next = offset + LIMIT;
    setOffset(next);
    fetchWords(search, category, next, false);
  };

  // ── Delete single ──────────────────────────────────────────────────────────
  const deleteWord = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/admin/words/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWords((w) => w.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
      setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    }
    setDeletingId(null);
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} palabras? Esta acción no se puede deshacer.`)) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map((id) => fetch(`/api/admin/words/${id}`, { method: "DELETE" })));
    const deleted = new Set(selected);
    setWords((w) => w.filter((x) => !deleted.has(x.id)));
    setTotal((t) => t - deleted.size);
    setSelected(new Set());
    setBulkDeleting(false);
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === words.length ? new Set() : new Set(words.map((w) => w.id)));

  const allSelected = words.length > 0 && selected.size === words.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Palabras</h1>
          <p className="text-gray-500 mt-0.5">{total} palabras en total</p>
        </div>
        <Link
          href="/admin/words/import"
          className="shrink-0 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          + Importar
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por palabra, español o português..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white transition-colors"
        />
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shrink-0">
          {(["all", "beginner", "intermediate", "advanced"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                category === cat ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat === "all" ? "Todas" : cat === "beginner" ? "Básico" : cat === "intermediate" ? "Medio" : "Avanzado"}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-rose-700">
            {selected.size} palabra{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={bulkDelete}
            disabled={bulkDeleting}
            className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-4 py-1.5 rounded-lg transition-colors"
          >
            {bulkDeleting ? "Eliminando..." : "Eliminar seleccionadas"}
          </button>
        </div>
      )}

      {/* Table header */}
      {words.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
          />
          <span className="flex-1">Palabra</span>
          <span className="w-36 hidden sm:block">Español · Português</span>
          <span className="w-20 hidden md:block">Categoría</span>
          <span className="w-24 hidden lg:block text-center">Playlists · Repasos</span>
          <span className="w-16 text-right">Acción</span>
        </div>
      )}

      {/* Word list */}
      {loading && words.length === 0 ? (
        <div className="text-center py-16 text-gray-300">Cargando...</div>
      ) : words.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <p className="text-3xl">🔍</p>
          <p>No se encontraron palabras</p>
          {search && (
            <button onClick={() => handleSearch("")} className="text-indigo-600 text-sm hover:underline">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {words.map((w) => (
            <div
              key={w.id}
              className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-xl transition-colors ${
                selected.has(w.id) ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(w.id)}
                onChange={() => toggleSelect(w.id)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
              />

              {/* Word info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{w.word}</span>
                  {w.part_of_speech && (
                    <span className="text-xs text-gray-400">{w.part_of_speech}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {w.translation_es} · {w.translation_pt}
                </p>
              </div>

              {/* Translations (wider screens) */}
              <div className="w-36 hidden sm:block min-w-0">
                <p className="text-sm text-gray-700 truncate">{w.translation_es}</p>
                <p className="text-xs text-gray-400 truncate">{w.translation_pt}</p>
              </div>

              {/* Category */}
              <div className="w-20 hidden md:block">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[w.category] ?? "bg-gray-100 text-gray-600"}`}>
                  {w.category}
                </span>
              </div>

              {/* Stats */}
              <div className="w-24 hidden lg:flex flex-col items-center text-xs text-gray-400 gap-0.5">
                <span>{w.playlist_count} playlist{w.playlist_count !== 1 ? "s" : ""}</span>
                <span>{w.review_count} repaso{w.review_count !== 1 ? "s" : ""}</span>
              </div>

              {/* Delete */}
              <div className="w-16 flex justify-end shrink-0">
                <button
                  onClick={() => {
                    if (!confirm(`¿Eliminar "${w.word}"? Se quitará de todas las playlists y repasos.`)) return;
                    deleteWord(w.id);
                  }}
                  disabled={deletingId === w.id}
                  className="text-xs font-medium text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  {deletingId === w.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {words.length < total && (
        <div className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cargando..." : `Cargar más (${total - words.length} restantes)`}
          </button>
        </div>
      )}
    </div>
  );
}
