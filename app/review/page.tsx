"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SpeechButton from "@/components/SpeechButton";

type SortOption = "least-reviewed" | "random" | "recent" | "oldest";

interface Word {
  id: string;
  word: string;
  translation_es: string;
  translation_pt: string;
  pronunciation: string | null;
  example_en: string | null;
  example_es: string | null;
  example_pt: string | null;
  category: string;
  part_of_speech: string | null;
  review_count: number;
}

interface Playlist { id: string; name: string }

const BATCH = 15;
const SWIPE_THRESHOLD = 80;

function ReviewInner() {
  const params = useSearchParams();
  const playlistFilter = params.get("playlist");

  const [sort, setSort] = useState<SortOption>("least-reviewed");
  const [sessionLimit, setSessionLimit] = useState<number | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  // Swipe
  const [dragY, setDragY] = useState(0);
  const [exiting, setExiting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // refs so touch handlers always see latest values
  const dragYRef = useRef(0);
  const exitingRef = useRef(false);

  // Playlist modal
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const fetchWords = useCallback(async (newSort: SortOption, newOffset: number, replace: boolean) => {
    setLoading(true);
    const url = `/api/words?sort=${newSort}&limit=${BATCH}&offset=${newOffset}${playlistFilter ? `&playlist=${playlistFilter}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setWords((prev) => replace ? (data.words ?? []) : [...prev, ...(data.words ?? [])]);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [playlistFilter]);

  useEffect(() => {
    setIndex(0); setOffset(0); setRevealed(false); setFinished(false);
    fetchWords(sort, 0, true);
  }, [sort, sessionLimit, fetchWords]);

  const current = words[index];

  // Preload next batch (respect session limit)
  useEffect(() => {
    const cap = sessionLimit ?? total;
    if (words.length - index <= 3 && words.length < cap && words.length < total && !loading) {
      const next = offset + BATCH;
      setOffset(next);
      fetchWords(sort, next, false);
    }
  }, [index, words.length, total, loading, sort, offset, sessionLimit, fetchWords]);

  const recordReview = (wordId: string) =>
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId }),
    });

  const nextWord = useCallback(() => {
    if (!current || exitingRef.current) return;
    recordReview(current.id);
    exitingRef.current = true;
    setExiting(true);
    setTimeout(() => {
      exitingRef.current = false;
      setExiting(false);
      setDragY(0);
      dragYRef.current = 0;
      const cap = sessionLimit ?? total;
      if (index + 1 >= cap || (index + 1 >= words.length && words.length >= total)) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setRevealed(false);
      }
    }, 320);
  }, [current, index, words.length, total, sessionLimit]);

  // ─── Native swipe (touch + mouse) ────────────────────────────────────────
  // touch: passive:false on touchmove so we can preventDefault (stops page scroll)
  // mouse: listen on window so the drag works even if pointer leaves the card
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    let startY = 0;
    let active = false;

    // ── TOUCH ──
    const onTouchStart = (e: TouchEvent) => {
      if (exitingRef.current) return;
      const t = e.target as HTMLElement;
      if (t.closest("button")) return; // don't hijack button taps
      startY = e.touches[0].clientY;
      active = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active) return;
      const delta = e.touches[0].clientY - startY;
      if (delta > 2) e.preventDefault(); // block page scroll only when dragging down
      if (delta > 0) {
        const clamped = Math.min(delta, 260);
        dragYRef.current = clamped;
        setDragY(clamped);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const delta = e.changedTouches[0].clientY - startY;
      if (delta >= SWIPE_THRESHOLD) {
        nextWord();
      } else {
        dragYRef.current = 0;
        setDragY(0);
      }
    };

    // ── MOUSE ──
    const onMouseDown = (e: MouseEvent) => {
      if (exitingRef.current) return;
      const t = e.target as HTMLElement;
      if (t.closest("button")) return;
      startY = e.clientY;
      active = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!active) return;
      const delta = e.clientY - startY;
      if (delta > 0) {
        const clamped = Math.min(delta, 260);
        dragYRef.current = clamped;
        setDragY(clamped);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!active) return;
      active = false;
      const delta = e.clientY - startY;
      if (delta >= SWIPE_THRESHOLD) {
        nextWord();
      } else {
        dragYRef.current = 0;
        setDragY(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [nextWord]); // re-attach when nextWord changes (index/words change)

  // ─── Playlist modal ───────────────────────────────────────────────────────
  const openPlaylistModal = async () => {
    if (playlists.length === 0) {
      const res = await fetch("/api/playlists");
      const data = await res.json();
      setPlaylists(data.playlists ?? []);
    }
    setShowModal(true);
  };

  const addToPlaylist = async (plId: string) => {
    if (!current || addingTo) return;
    setAddingTo(plId);
    await fetch(`/api/playlists/${plId}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.id }),
    });
    setAddedTo((s) => new Set([...s, plId]));
    setAddingTo(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const cap = sessionLimit ?? total;
  const progress = cap > 0 ? Math.round((index / cap) * 100) : 0;

  if (!loading && total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
        <p className="text-4xl">📭</p>
        <p className="text-gray-500 font-medium">No hay palabras disponibles.</p>
        <p className="text-gray-400 text-sm">El admin debe importar palabras primero.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="text-2xl font-bold text-gray-900">¡Sesión completada!</h2>
        <p className="text-gray-500">{index + 1} palabras repasadas</p>
        <button
          onClick={() => { setIndex(0); setOffset(0); setFinished(false); fetchWords(sort, 0, true); }}
          className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Repasar de nuevo
        </button>
      </div>
    );
  }

  const catColor =
    current?.category === "beginner" ? "bg-emerald-100 text-emerald-800" :
    current?.category === "advanced" ? "bg-purple-100 text-purple-800" :
    "bg-blue-100 text-blue-800";

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto select-none">
      {/* Sort selector */}
      <div className="flex gap-1 flex-wrap">
        {([
          ["least-reviewed", "Menos repasadas"],
          ["random", "Aleatorias"],
          ["recent", "Más recientes"],
          ["oldest", "Más antiguas"],
        ] as [SortOption, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSort(val)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              sort === val
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Session count selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">Palabras:</span>
        <div className="flex gap-1 flex-wrap">
          {([10, 20, 30, 50, null] as (number | null)[]).map((n) => (
            <button
              key={n ?? "all"}
              onClick={() => setSessionLimit(n)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                sessionLimit === n
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              {n ?? "Todas"}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {index} / {sessionLimit ?? total}
        </span>
      </div>

      {/* ── Card ── */}
      {loading && words.length === 0 ? (
        <div className="h-[58vh] flex items-center justify-center">
          <div className="animate-spin text-2xl">⏳</div>
        </div>
      ) : current ? (
        <>
          <div
            ref={cardRef}
            style={{
              transform: exiting
                ? "translateY(105vh)"
                : `translateY(${dragY}px) rotate(${dragY * 0.018}deg)`,
              transition: exiting
                ? "transform 0.32s ease-in, opacity 0.32s ease-in"
                : dragY > 0 ? "none" : "transform 0.22s ease-out",
              opacity: exiting ? 0 : dragY > 50 ? Math.max(0.25, 1 - (dragY - 50) / 180) : 1,
              cursor: dragY > 0 ? "grabbing" : "grab",
              willChange: "transform",
            }}
            className="bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden"
          >
            {/* Top labels */}
            <div className="flex items-center justify-between px-5 pt-5 pb-1">
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
                  {current.category}
                </span>
                {current.part_of_speech && (
                  <span className="text-xs text-gray-400">{current.part_of_speech}</span>
                )}
              </div>
              <span className="text-xs text-gray-300">{current.review_count} repaso{current.review_count !== 1 ? "s" : ""}</span>
            </div>

            {/* Word — tap to reveal */}
            <div
              className="px-6 pt-5 pb-3 text-center cursor-pointer"
              onClick={() => setRevealed((r) => !r)}
            >
              <p className="text-5xl font-bold text-gray-900 leading-tight break-words">
                {current.word}
              </p>
              {current.pronunciation && (
                <p className="text-gray-400 mt-2 text-sm font-mono">{current.pronunciation}</p>
              )}
            </div>

            {/* Audio buttons — buttons are excluded from drag start */}
            <div className="flex justify-center gap-2 pb-3 px-4">
              <SpeechButton text={current.word} lang="en-US" />
              <SpeechButton text={current.translation_es} lang="es-ES" />
              <SpeechButton text={current.translation_pt} lang="pt-BR" />
            </div>

            {/* Translation area */}
            <div
              className="mx-5 border-t border-dashed border-gray-100 pt-4 pb-3 cursor-pointer"
              onClick={() => setRevealed((r) => !r)}
            >
              {!revealed ? (
                <p className="text-center text-xs text-gray-300 py-3">
                  Toca para ver la traducción ↕
                </p>
              ) : (
                <div className="space-y-3 px-1 pb-2">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      🇪🇸 Español
                    </p>
                    <p className="text-2xl font-semibold text-gray-800">{current.translation_es}</p>
                    {current.example_es && (
                      <p className="text-xs text-gray-400 italic mt-1">"{current.example_es}"</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      🇧🇷 Português
                    </p>
                    <p className="text-xl font-semibold text-indigo-700">{current.translation_pt}</p>
                    {current.example_pt && (
                      <p className="text-xs text-gray-400 italic mt-1">"{current.example_pt}"</p>
                    )}
                  </div>
                  {current.example_en && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        📝 English example
                      </p>
                      <p className="text-sm text-gray-600 italic">"{current.example_en}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between px-5 pb-5">
              <button
                type="button"
                onClick={openPlaylistModal}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Playlist
              </button>

              {/* Swipe hint with animated arrow */}
              <div className="flex flex-col items-center gap-0.5 text-gray-300 pointer-events-none">
                <span className="text-xs animate-bounce">↓</span>
                <span className="text-[10px]">desliza</span>
              </div>
            </div>
          </div>

          {/* Visible "Next" button as reliable fallback */}
          <button
            type="button"
            onClick={nextWord}
            disabled={exiting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors text-sm"
          >
            Siguiente palabra →
          </button>
        </>
      ) : null}

      {/* Playlist modal (bottom sheet) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <h3 className="font-semibold text-gray-900">Agregar a playlist</h3>
            {playlists.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No tienes playlists. Crea una en /playlists.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => addToPlaylist(pl.id)}
                    disabled={!!addingTo}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      addedTo.has(pl.id)
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-800"
                    }`}
                  >
                    <span>{pl.name}</span>
                    {addedTo.has(pl.id) ? (
                      <span className="text-emerald-600">✓</span>
                    ) : addingTo === pl.id ? (
                      <span className="text-gray-400 text-xs">...</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-300">Cargando...</div>}>
      <ReviewInner />
    </Suspense>
  );
}
