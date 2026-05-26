"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { words } from "@/lib/words";
import { getProgress, type Progress } from "@/lib/storage";

export default function Home() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const knownCount = progress?.known.length ?? 0;
  const learningCount = progress?.learning.length ?? 0;
  const quizCount = progress?.quizResults.length ?? 0;
  const correctCount = progress?.quizResults.filter((r) => r.correct).length ?? 0;
  const accuracy = quizCount > 0 ? Math.round((correctCount / quizCount) * 100) : 0;
  const masteryPct = Math.round((knownCount / words.length) * 100);

  const beginnerCount = words.filter((w) => w.category === "beginner").length;
  const intermediateCount = words.filter((w) => w.category === "intermediate").length;
  const advancedCount = words.filter((w) => w.category === "advanced").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido a <span className="text-indigo-600">VocabFlow</span>
        </h1>
        <p className="mt-1 text-gray-500">Tu plataforma para dominar el vocabulario en inglés</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Palabras totales" value={words.length} color="text-gray-900" />
        <StatCard label="Dominadas" value={knownCount} color="text-emerald-600" />
        <StatCard label="Aprendiendo" value={learningCount} color="text-blue-600" />
        <StatCard label="Precisión quiz" value={`${accuracy}%`} color="text-indigo-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Progreso general</h2>
          <span className="text-sm font-medium text-indigo-600">{masteryPct}% dominado</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${masteryPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {knownCount} de {words.length} palabras marcadas como dominadas
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ActionCard
          href="/flashcards"
          title="Flashcards"
          description="Estudia con tarjetas interactivas. Voltea para ver la traducción."
          icon="🃏"
          color="bg-indigo-600 hover:bg-indigo-700"
        />
        <ActionCard
          href="/quiz"
          title="Quiz"
          description="Pon a prueba tu conocimiento con preguntas de opción múltiple."
          icon="🧠"
          color="bg-purple-600 hover:bg-purple-700"
        />
        <ActionCard
          href="/words"
          title="Lista de palabras"
          description="Explora y busca entre todas las palabras disponibles."
          icon="📚"
          color="bg-emerald-600 hover:bg-emerald-700"
        />
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">Por categoría</h3>
            <div className="space-y-2 mt-3">
              <CategoryRow label="Principiante" count={beginnerCount} color="bg-emerald-500" />
              <CategoryRow label="Intermedio" count={intermediateCount} color="bg-blue-500" />
              <CategoryRow label="Avanzado" count={advancedCount} color="bg-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {(progress?.streak ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="font-semibold text-amber-900">
              ¡{progress!.streak} {progress!.streak === 1 ? "día" : "días"} de racha!
            </p>
            <p className="text-sm text-amber-700">Sigue así para seguir mejorando.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}) {
  return (
    <Link href={href} className={`${color} text-white rounded-2xl p-6 flex flex-col gap-3 transition-colors`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm opacity-80 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

function CategoryRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm text-gray-600 flex-1">{label}</span>
      <span className="text-sm font-medium text-gray-900">{count}</span>
    </div>
  );
}
