"use client";

import { useState } from "react";

const EXAMPLE = JSON.stringify(
  [
    {
      word: "shoulder",
      translation_es: "hombro",
      translation_pt: "ombro",
      pronunciation: "/ˈʃoʊl.dər/",
      example_en: "She has a pain in her shoulder.",
      example_es: "Ella tiene dolor en el hombro.",
      example_pt: "Ela tem dor no ombro.",
      category: "intermediate",
      part_of_speech: "noun",
      playlists: ["Partes del cuerpo"],
    },
    {
      word: "elbow",
      translation_es: "codo",
      translation_pt: "cotovelo",
      category: "intermediate",
      part_of_speech: "noun",
      playlists: ["Partes del cuerpo", "Principiante"],
    },
  ],
  null,
  2
);

interface ImportResult {
  imported: number;
  skipped: number;
  playlistsCreated: string[];
  errors: string[];
}

interface PreviewWord {
  word: string;
  translation_es: string;
  translation_pt: string;
  category?: string;
  part_of_speech?: string;
  playlists?: string[];
}

export default function ImportWordsPage() {
  const [json, setJson] = useState("");
  const [preview, setPreview] = useState<PreviewWord[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = () => {
    setParseError("");
    setResult(null);
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error("El JSON debe ser un array []");
      if (parsed.length === 0) throw new Error("El array está vacío");
      // Validate each item has required fields
      const missing = parsed.filter(
        (w: PreviewWord) => !w.word?.trim() || !w.translation_es?.trim() || !w.translation_pt?.trim()
      );
      if (missing.length > 0) {
        throw new Error(`${missing.length} elemento(s) les falta word, translation_es o translation_pt`);
      }
      setPreview(parsed);
    } catch (e) {
      setParseError((e as Error).message);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);
    const res = await fetch("/api/admin/words/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preview), // send array directly
    });
    const data = await res.json();
    setResult(data);
    setPreview(null);
    setJson("");
    setLoading(false);
  };

  // Collect unique playlists from preview
  const previewPlaylists = preview
    ? [...new Set(preview.flatMap((w) => w.playlists ?? []))]
    : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar palabras</h1>
        <p className="text-gray-500 mt-1">Pega un array JSON. Las playlists se crean automáticamente si no existen.</p>
      </div>

      {/* Format reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Campos disponibles</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Field name="word" required />
          <Field name="translation_es" required />
          <Field name="translation_pt" required />
          <Field name="playlists" note='["Nombre playlist", ...]' />
          <Field name="pronunciation" />
          <Field name="example_en" />
          <Field name="example_es" />
          <Field name="example_pt" />
          <Field name="category" note="beginner | intermediate | advanced" />
          <Field name="part_of_speech" note="noun | verb | adjective | adverb | phrase" />
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-700">
          💡 El campo <code className="font-mono font-semibold">playlists</code> es un array de nombres.
          Si la playlist no existe, se crea automáticamente bajo tu cuenta.
        </div>
        <button
          onClick={() => { setJson(EXAMPLE); setResult(null); }}
          className="text-xs text-indigo-600 hover:underline"
        >
          Cargar ejemplo con playlists →
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-2xl p-5 border space-y-2 ${result.imported > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <p className="font-semibold text-gray-900">
            ✓ {result.imported} palabras importadas · {result.skipped} omitidas
          </p>
          {result.playlistsCreated.length > 0 && (
            <p className="text-sm text-emerald-700">
              Playlists creadas: {result.playlistsCreated.map((p) => `"${p}"`).join(", ")}
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-rose-600">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* JSON textarea */}
      {!preview && (
        <div className="space-y-3">
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setParseError(""); setResult(null); }}
            placeholder={`[\n  {\n    "word": "hello",\n    "translation_es": "hola",\n    "translation_pt": "olá",\n    "playlists": ["Saludos"]\n  }\n]`}
            rows={16}
            spellCheck={false}
            className="w-full font-mono text-sm border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-y transition-colors bg-white"
          />
          {parseError && (
            <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200">
              ⚠ {parseError}
            </p>
          )}
          <button
            onClick={handlePreview}
            disabled={!json.trim()}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Previsualizar →
          </button>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{preview.length} palabras listas para importar</h2>
            <button onClick={() => setPreview(null)} className="text-sm text-gray-400 hover:text-gray-600">
              ← Editar
            </button>
          </div>

          {/* Playlists summary */}
          {previewPlaylists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Playlists:</span>
              {previewPlaylists.map((pl) => (
                <span key={pl} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  {pl}
                </span>
              ))}
            </div>
          )}

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="col-span-1">Palabra</span>
              <span>Español</span>
              <span>Português</span>
              <span>Categoría</span>
              <span>Playlists</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {preview.map((w, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-4 py-2.5 text-sm items-start">
                  <span className="font-semibold text-gray-900 col-span-1">{w.word}</span>
                  <span className="text-gray-600">{w.translation_es}</span>
                  <span className="text-gray-600">{w.translation_pt}</span>
                  <span className="text-gray-400 text-xs">{w.category ?? "intermediate"}</span>
                  <div className="flex flex-wrap gap-1">
                    {(w.playlists ?? []).map((pl) => (
                      <span key={pl} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                        {pl}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Importando..." : `Importar ${preview.length} palabras`}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ name, required, note }: { name: string; required?: boolean; note?: string }) {
  return (
    <span className={`px-2 py-1 rounded-lg font-mono text-xs ${required ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-600"}`}>
      {name}{required ? <span className="text-rose-500">*</span> : ""}{note ? <span className="font-sans opacity-70"> ({note})</span> : ""}
    </span>
  );
}
