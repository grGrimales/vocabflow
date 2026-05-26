"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Period = "daily" | "weekly" | "monthly";

interface Summary {
  today: number;
  week: number;
  month: number;
  year: number;
  all_time: number;
  correct: number;
  incorrect: number;
}

interface PeriodEntry {
  date?: string;
  week?: string;
  month?: string;
  total: number;
  correct: number;
}

export default function QuizStatsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<PeriodEntry[]>([]);
  const [weekly, setWeekly] = useState<PeriodEntry[]>([]);
  const [monthly, setMonthly] = useState<PeriodEntry[]>([]);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quiz/stats")
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary ?? null);
        setDaily(d.daily ?? []);
        setWeekly(d.weekly ?? []);
        setMonthly(d.monthly ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-300">Cargando...</div>;

  const data = period === "daily" ? daily : period === "weekly" ? weekly : monthly;
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  const totalAttempts = (summary?.correct ?? 0) + (summary?.incorrect ?? 0);
  const accuracy =
    totalAttempts > 0
      ? Math.round(((summary?.correct ?? 0) / totalAttempts) * 100)
      : 0;

  const getLabel = (entry: PeriodEntry) => {
    const raw = entry.date ?? entry.week ?? entry.month;
    if (!raw) return "";
    const d = new Date(raw);
    if (period === "monthly") {
      return d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
    }
    return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/quiz" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Evaluar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Estadísticas de evaluación</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Hoy" value={summary?.today ?? 0} />
        <StatCard label="Esta semana" value={summary?.week ?? 0} />
        <StatCard label="Este mes" value={summary?.month ?? 0} />
        <StatCard label="Este año" value={summary?.year ?? 0} />
      </div>

      {/* Accuracy panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Rendimiento global</p>
          <span
            className={`text-3xl font-black ${
              accuracy >= 80
                ? "text-emerald-600"
                : accuracy >= 60
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {accuracy}%
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            {summary?.correct ?? 0} correctas
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            {summary?.incorrect ?? 0} incorrectas
          </span>
          <span className="text-gray-400">de {summary?.all_time ?? 0} intentos totales</span>
        </div>

        {totalAttempts > 0 && (
          <div className="h-3 bg-rose-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        )}

        {totalAttempts === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">
            Aún no has completado ninguna evaluación.{" "}
            <Link href="/quiz" className="text-indigo-600 hover:underline">
              Comenzar →
            </Link>
          </p>
        )}
      </div>

      {/* Period chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold text-gray-700">Intentos por período</p>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "daily" ? "Diario" : p === "weekly" ? "Semanal" : "Mensual"}
              </button>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Sin datos para este período
          </p>
        ) : (
          <div className="space-y-2">
            {data.slice(-14).map((entry, i) => {
              const incorrectCount = entry.total - entry.correct;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-16 shrink-0 text-right">
                    {getLabel(entry)}
                  </span>
                  <div className="flex-1 flex gap-0.5 h-5 rounded overflow-hidden">
                    {entry.total > 0 ? (
                      <>
                        {entry.correct > 0 && (
                          <div
                            className="bg-emerald-400 h-full transition-all duration-500"
                            style={{ width: `${(entry.correct / maxTotal) * 100}%` }}
                            title={`${entry.correct} correctas`}
                          />
                        )}
                        {incorrectCount > 0 && (
                          <div
                            className="bg-rose-300 h-full transition-all duration-500"
                            style={{ width: `${(incorrectCount / maxTotal) * 100}%` }}
                            title={`${incorrectCount} incorrectas`}
                          />
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-100 rounded h-full w-full" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 w-6 shrink-0 text-right">
                    {entry.total}
                  </span>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex gap-4 text-xs text-gray-400 pt-1 justify-end">
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 rounded bg-emerald-400 inline-block" />
                Correctas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 rounded bg-rose-300 inline-block" />
                Incorrectas
              </span>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/quiz/mistakes"
        className="block w-full py-3 text-center text-sm font-semibold text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
      >
        Ver historial de errores →
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center space-y-1">
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
