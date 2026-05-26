"use client";

import { useEffect, useState } from "react";

type Period = "daily" | "weekly" | "monthly";

interface Summary {
  today: number;
  this_week: number;
  this_month: number;
  this_year: number;
  all_time: number;
  unique_words: number;
}

interface DataPoint { date?: string; week_start?: string; month?: string; count: number }
interface TopWord { word: string; translation_es: string; count: number }

interface StatsData {
  summary: Summary;
  daily: DataPoint[];
  weekly: DataPoint[];
  monthly: DataPoint[];
  topWords: TopWord[];
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-20 shrink-0 text-right truncate">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 shrink-0">{value}</span>
    </div>
  );
}

function formatLabel(period: Period, point: DataPoint): string {
  if (period === "daily") return point.date?.slice(5) ?? "";
  if (period === "weekly") return point.week_start?.slice(5) ?? "";
  return point.month ?? "";
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-300">Cargando estadísticas...</div>;
  if (!data) return null;

  const { summary } = data;
  const series = period === "daily" ? data.daily : period === "weekly" ? data.weekly : data.monthly;
  const maxCount = Math.max(...series.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-500 mt-1">Tu progreso de repaso</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Hoy" value={summary.today} color="text-indigo-600" />
        <StatCard label="Esta semana" value={summary.this_week} color="text-blue-600" />
        <StatCard label="Este mes" value={summary.this_month} color="text-purple-600" />
        <StatCard label="Este año" value={summary.this_year} color="text-emerald-600" />
        <StatCard label="Todo el tiempo" value={summary.all_time} color="text-gray-900" />
        <StatCard label="Palabras únicas" value={summary.unique_words} color="text-amber-600" />
      </div>

      {/* Period chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Repasos por período</h2>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  period === p ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "daily" ? "Días" : p === "weekly" ? "Semanas" : "Meses"}
              </button>
            ))}
          </div>
        </div>

        {series.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Aún no hay datos para este período</p>
        ) : (
          <div className="space-y-2">
            {series.slice(0, 20).map((point, i) => (
              <Bar
                key={i}
                value={point.count}
                max={maxCount}
                label={formatLabel(period, point)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Top words */}
      {data.topWords.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Palabras más repasadas</h2>
          <div className="space-y-2">
            {data.topWords.map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 w-5 text-right">{i + 1}</span>
                <span className="font-medium text-gray-900 flex-1">{w.word}</span>
                <span className="text-sm text-gray-500">{w.translation_es}</span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {w.count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.all_time === 0 && (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <p className="text-4xl">📊</p>
          <p>Aún no tienes repasos registrados.</p>
          <a href="/review" className="text-indigo-600 hover:underline text-sm">Ir a repasar →</a>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
