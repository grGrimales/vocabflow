"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Phase = "setup" | "quiz" | "feedback" | "results";
type Mode = "translate" | "listen" | "reverse";
type SourceLang = "es" | "pt";
type Sort = "random" | "least-attempted" | "least-accurate" | "newest" | "oldest";

interface QuizWord {
  id: string;
  word: string;
  translation_es: string;
  translation_pt: string;
  part_of_speech: string | null;
  pronunciation: string | null;
}

interface QuizResult {
  word: QuizWord;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

interface Playlist {
  id: string;
  name: string;
  word_count: number;
  is_favorite: boolean;
}

const COUNT_OPTIONS = [5, 10, 20] as const;

const SORT_OPTIONS: { value: Sort; label: string; icon: string }[] = [
  { value: "random",         label: "Aleatorio",        icon: "🎲" },
  { value: "least-attempted", label: "Menos evaluadas", icon: "📊" },
  { value: "least-accurate",  label: "Menos acertadas", icon: "❌" },
  { value: "newest",          label: "Más recientes",   icon: "🆕" },
  { value: "oldest",          label: "Más antiguas",    icon: "📅" },
];

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("translate");
  const [sourceLang, setSourceLang] = useState<SourceLang>("es");
  const [sort, setSort] = useState<Sort>("random");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [count, setCount] = useState(10);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [words, setWords] = useState<QuizWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noWords, setNoWords] = useState(false);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((d) => setPlaylists(d.playlists ?? []));
  }, []);

  const speak = useCallback((text: string, lang = "en-US", rate = 0.85) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();
    const primary = lang.split("-")[0];
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(primary + "-")) ||
      voices.find((v) => v.lang.startsWith(primary));
    if (voice) u.voice = voice;
    if (voices.length === 0) {
      const handler = () => {
        voicesRef.current = synth.getVoices();
        const v2 =
          voicesRef.current.find((v) => v.lang === lang) ||
          voicesRef.current.find((v) => v.lang.startsWith(primary));
        if (v2) u.voice = v2;
        synth.speak(u);
        synth.removeEventListener("voiceschanged", handler);
      };
      synth.addEventListener("voiceschanged", handler);
      setTimeout(() => synth.speak(u), 300);
    } else {
      synth.speak(u);
    }
  }, []);

  // Auto-play in listen mode when word changes
  useEffect(() => {
    if (phase !== "quiz" || mode !== "listen") return;
    const word = words[currentIdx];
    if (!word) return;
    const t = setTimeout(() => speak(word.word), 400);
    return () => clearTimeout(t);
  }, [phase, mode, currentIdx, words, speak]);

  // Focus input when entering quiz phase
  useEffect(() => {
    if (phase === "quiz") {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [phase, currentIdx]);

  const startQuiz = async () => {
    setLoading(true);
    setNoWords(false);
    const params = new URLSearchParams({ limit: String(count), sort });
    if (selectedPlaylist) params.set("playlist", selectedPlaylist);
    const res = await fetch(`/api/quiz/words?${params}`);
    const data = await res.json();
    const fetched: QuizWord[] = data.words ?? [];
    if (fetched.length === 0) {
      setNoWords(true);
      setLoading(false);
      return;
    }
    setWords(fetched);
    setCurrentIdx(0);
    setResults([]);
    setUserAnswer("");
    setPhase("quiz");
    setLoading(false);
  };

  const currentWord = words[currentIdx];

  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[.,!?;:'"()\-]/g, "").replace(/\s+/g, " ");

  const getCorrectAnswer = (word: QuizWord): string => {
    if (mode === "reverse") {
      return sourceLang === "es" ? word.translation_es : word.translation_pt;
    }
    return word.word;
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim() || !currentWord || submitting) return;
    setSubmitting(true);

    const correctAnswer = getCorrectAnswer(currentWord);
    const correct = normalize(userAnswer) === normalize(correctAnswer);
    const result: QuizResult = {
      word: currentWord,
      isCorrect: correct,
      userAnswer: userAnswer.trim(),
      correctAnswer,
    };
    setResults((prev) => [...prev, result]);

    fetch("/api/quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: currentWord.id,
        mode,
        sourceLang: mode !== "listen" ? sourceLang : null,
        isCorrect: correct,
        userAnswer: userAnswer.trim(),
        correctAnswer,
      }),
    });

    setPhase("feedback");
    setSubmitting(false);
  };

  const nextWord = () => {
    if (currentIdx + 1 >= words.length) {
      setPhase("results");
    } else {
      setCurrentIdx((prev) => prev + 1);
      setUserAnswer("");
      setPhase("quiz");
    }
  };

  const reset = () => {
    setPhase("setup");
    setWords([]);
    setResults([]);
    setUserAnswer("");
    setCurrentIdx(0);
  };

  // ── Setup ──────────────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="max-w-md mx-auto space-y-8 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluación</h1>
          <p className="text-gray-500 mt-1">Pon a prueba tu vocabulario en inglés</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Modo</p>
          <div className="grid grid-cols-3 gap-2">
            <ModeCard
              active={mode === "translate"}
              onClick={() => setMode("translate")}
              icon="🔤"
              title="Traducir"
              desc="Ve la pista en español o portugués · escribe en inglés"
            />
            <ModeCard
              active={mode === "reverse"}
              onClick={() => setMode("reverse")}
              icon="🔁"
              title="Invertir"
              desc="Ve la palabra en inglés · escribe en español o portugués"
            />
            <ModeCard
              active={mode === "listen"}
              onClick={() => setMode("listen")}
              icon="🎧"
              title="Escuchar"
              desc="Escucha la pronunciación en inglés · escribe la palabra"
            />
          </div>
        </div>

        {(mode === "translate" || mode === "reverse") && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              {mode === "translate" ? "Idioma de la pista" : "Idioma objetivo"}
            </p>
            <div className="flex gap-2">
              {(
                [
                  ["es", "🇪🇸 Español"],
                  ["pt", "🇧🇷 Português"],
                ] as [SourceLang, string][]
              ).map(([lang, label]) => (
                <button
                  key={lang}
                  onClick={() => setSourceLang(lang)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    sourceLang === lang
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Playlist selector */}
        {playlists.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Playlist</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <PlaylistPill
                label="Todas"
                active={selectedPlaylist === null}
                onClick={() => setSelectedPlaylist(null)}
              />
              {/* Favorites first with star indicator */}
              {playlists.filter((pl) => pl.is_favorite).map((pl) => (
                <PlaylistPill
                  key={pl.id}
                  label={`⭐ ${pl.name}`}
                  count={pl.word_count}
                  active={selectedPlaylist === pl.id}
                  onClick={() => setSelectedPlaylist(pl.id)}
                />
              ))}
              {/* Separator if there are both favorites and non-favorites */}
              {playlists.some((pl) => pl.is_favorite) &&
                playlists.some((pl) => !pl.is_favorite) && (
                  <div className="shrink-0 w-px bg-gray-200 my-1" />
                )}
              {/* Non-favorites */}
              {playlists.filter((pl) => !pl.is_favorite).map((pl) => (
                <PlaylistPill
                  key={pl.id}
                  label={pl.name}
                  count={pl.word_count}
                  active={selectedPlaylist === pl.id}
                  onClick={() => setSelectedPlaylist(pl.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sort order */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Orden de palabras</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                  sort === opt.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Cantidad de palabras</p>
          <div className="flex gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  count === n
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {noWords && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            No hay palabras disponibles. Pídele al administrador que importe palabras primero.
          </p>
        )}

        <button
          onClick={startQuiz}
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition-colors text-base"
        >
          {loading ? "Cargando..." : "Comenzar evaluación →"}
        </button>

        <div className="flex gap-4 justify-center">
          <Link href="/quiz/mistakes" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            Ver mis errores
          </Link>
          <span className="text-gray-200">·</span>
          <Link href="/quiz/stats" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            Estadísticas
          </Link>
        </div>
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────

  if (phase === "quiz" && currentWord) {
    const progress = (currentIdx / words.length) * 100;
    const prompt =
      mode === "translate"
        ? sourceLang === "es"
          ? currentWord.translation_es
          : currentWord.translation_pt
        : null;

    return (
      <div className="max-w-lg mx-auto space-y-5 py-4">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Salir
          </button>
          <span className="text-sm font-semibold text-gray-600">
            {currentIdx + 1} / {words.length}
          </span>
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {mode === "translate"
              ? "¿Cómo se dice en inglés?"
              : mode === "reverse"
              ? `¿Cómo se dice en ${sourceLang === "es" ? "español" : "português"}?`
              : "Escucha y escribe la palabra en inglés"}
          </p>

          {mode === "translate" ? (
            <div className="space-y-1">
              <p className="text-4xl font-bold text-gray-900 leading-snug">{prompt}</p>
              {currentWord.part_of_speech && (
                <p className="text-sm text-gray-400 italic">{currentWord.part_of_speech}</p>
              )}
            </div>
          ) : mode === "reverse" ? (
            <div className="space-y-3">
              <p className="text-4xl font-bold text-gray-900 leading-snug">{currentWord.word}</p>
              {currentWord.part_of_speech && (
                <p className="text-sm text-gray-400 italic">{currentWord.part_of_speech}</p>
              )}
              <button
                onClick={() => speak(currentWord.word)}
                className="mx-auto flex items-center gap-2 px-4 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors text-sm"
              >
                🔊 Escuchar
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col items-center">
              <button
                onClick={() => speak(currentWord.word)}
                className="flex items-center gap-2 px-7 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-colors text-lg"
              >
                🔊 Escuchar
              </button>
              <button
                onClick={() => speak(currentWord.word, "en-US", 0.5)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                🐢 Más lento
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") checkAnswer(); }}
            placeholder={
              mode === "reverse"
                ? sourceLang === "es" ? "Escribe en español..." : "Escreva em português..."
                : "Escribe en inglés..."
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full border-2 border-gray-200 focus:border-indigo-400 rounded-2xl px-5 py-4 text-lg outline-none transition-colors"
          />
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim() || submitting}
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Comprobar →
          </button>
        </div>
      </div>
    );
  }

  // ── Feedback ───────────────────────────────────────────────────────────────

  if (phase === "feedback") {
    const lastResult = results[results.length - 1];
    if (!lastResult) return null;
    const { word, isCorrect, userAnswer: typed, correctAnswer } = lastResult;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const incorrectCount = results.filter((r) => !r.isCorrect).length;
    const isLast = currentIdx + 1 >= words.length;

    return (
      <div className="max-w-lg mx-auto space-y-5 py-4">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Salir
          </button>
          <span className="text-sm font-semibold text-gray-600">
            {results.length} / {words.length}
          </span>
        </div>

        <div
          className={`rounded-2xl p-8 text-center space-y-4 border ${
            isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          }`}
        >
          <p className={`text-2xl font-black ${isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
            {isCorrect ? "✓ ¡Correcto!" : "✗ Incorrecto"}
          </p>

          {!isCorrect && (
            <div className="space-y-1 text-sm">
              <p className="text-gray-500">
                Tu respuesta:{" "}
                <span className="font-semibold text-rose-700 line-through">{typed}</span>
              </p>
              <p className="text-gray-700">
                Respuesta correcta:{" "}
                <span className="font-bold text-gray-900 text-base">{correctAnswer}</span>
              </p>
            </div>
          )}

          {isCorrect && (
            <p className="text-3xl font-bold text-gray-900">{correctAnswer}</p>
          )}

          {/* Context: always show the full word + both translations */}
          <div className="text-sm space-y-0.5">
            {mode === "reverse" && (
              <p className="font-semibold text-gray-700">{word.word}</p>
            )}
            <p className="text-gray-500">{word.translation_es}</p>
            <p className="text-gray-400 text-xs">{word.translation_pt}</p>
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            <AudioBtn label="🔊 EN" onClick={() => speak(word.word, "en-US")} />
            <AudioBtn label="🔊 ES" onClick={() => speak(word.translation_es, "es-ES")} />
            <AudioBtn label="🔊 PT" onClick={() => speak(word.translation_pt, "pt-BR")} />
          </div>
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <span className="text-emerald-600 font-semibold">✓ {correctCount} correctas</span>
          <span className="text-rose-600 font-semibold">✗ {incorrectCount} incorrectas</span>
        </div>

        <button
          onClick={nextWord}
          className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
        >
          {isLast ? "Ver resultados →" : "Siguiente →"}
        </button>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────

  if (phase === "results") {
    const correct = results.filter((r) => r.isCorrect).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrong = results.filter((r) => !r.isCorrect);

    const accentClass =
      accuracy >= 80
        ? "bg-emerald-50 border-emerald-200"
        : accuracy >= 50
        ? "bg-amber-50 border-amber-200"
        : "bg-rose-50 border-rose-200";

    const accentText =
      accuracy >= 80
        ? "¡Excelente trabajo!"
        : accuracy >= 60
        ? "¡Buen intento!"
        : "Sigue practicando";

    return (
      <div className="max-w-lg mx-auto space-y-6 py-4">
        <div className={`rounded-2xl p-8 text-center space-y-3 border ${accentClass}`}>
          <p className="text-6xl font-black text-gray-900">{accuracy}%</p>
          <p className="text-xl font-semibold text-gray-700">
            {correct} de {total} correctas
          </p>
          <p className="text-sm text-gray-500">{accentText}</p>
        </div>

        {wrong.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Palabras incorrectas ({wrong.length})
            </p>
            <div className="space-y-1.5">
              {wrong.map(({ word, userAnswer: typed, correctAnswer }) => (
                <div
                  key={word.id}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900">{word.word}</p>
                      <button
                        onClick={() => speak(word.word)}
                        className="text-gray-300 hover:text-indigo-500 transition-colors text-sm"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {word.translation_es} · {word.translation_pt}
                    </p>
                  </div>
                  <div className="text-right text-xs shrink-0 space-y-0.5">
                    <p className="text-rose-500 font-medium line-through">{typed}</p>
                    <p className="text-gray-700 font-semibold">{correctAnswer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={startQuiz}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Cargando..." : "Nueva sesión"}
          </button>
          <button
            onClick={reset}
            className="w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Cambiar configuración
          </button>
          <Link
            href="/quiz/mistakes"
            className="block w-full py-3 text-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Ver historial de errores →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
        active
          ? "border-indigo-500 bg-indigo-50"
          : "border-gray-200 bg-white hover:border-indigo-200"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`font-semibold text-sm ${active ? "text-indigo-700" : "text-gray-800"}`}>
        {title}
      </span>
      <span className="text-xs text-gray-500 leading-relaxed">{desc}</span>
    </button>
  );
}

function AudioBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
    >
      {label}
    </button>
  );
}

function PlaylistPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1 ${active ? "opacity-75" : "opacity-50"}`}>({count})</span>
      )}
    </button>
  );
}
