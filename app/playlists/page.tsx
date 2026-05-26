"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  owner_name: string;
  word_count: number;
  is_owner: boolean;
  is_favorite: boolean;
  created_at: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const loadPlaylists = async () => {
    const res = await fetch("/api/playlists");
    const data = await res.json();
    setPlaylists(data.playlists ?? []);
    setLoading(false);
  };

  useEffect(() => { loadPlaylists(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (res.ok) {
      setName("");
      setDescription("");
      setShowForm(false);
      router.push(`/playlists/${data.playlist.id}`);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, playlistName: string) => {
    if (!confirm(`¿Eliminar "${playlistName}"?`)) return;
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    setPlaylists((p) => p.filter((pl) => pl.id !== id));
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    // Optimistic update
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, is_favorite: !current } : pl))
    );
    const method = current ? "DELETE" : "POST";
    const res = await fetch(`/api/playlists/${id}/favorite`, { method });
    if (!res.ok) {
      // Revert on error
      setPlaylists((prev) =>
        prev.map((pl) => (pl.id === id ? { ...pl, is_favorite: current } : pl))
      );
    }
  };

  // Client-side search filter
  const q = search.trim().toLowerCase();
  const filtered = q
    ? playlists.filter((p) => p.name.toLowerCase().includes(q))
    : playlists;

  // Split into sections — favorites first, no duplicates
  const favorites = filtered.filter((p) => p.is_favorite);
  const ownNonFav = filtered.filter((p) => p.is_owner && !p.is_favorite);
  const sharedNonFav = filtered.filter((p) => !p.is_owner && !p.is_favorite);

  const totalOwn = playlists.filter((p) => p.is_owner).length;
  const totalShared = playlists.filter((p) => !p.is_owner).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Playlists</h1>
          <p className="text-gray-500 mt-1">
            {totalOwn} propias · {totalShared} compartidas
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Nueva playlist
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-900">Nueva playlist</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Partes del cuerpo"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del tema"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-3"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      {!loading && playlists.length > 0 && (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar playlist..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-300">Cargando...</div>
      ) : filtered.length === 0 && search ? (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <p className="text-3xl">🔍</p>
          <p>No se encontraron playlists para &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch("")} className="text-sm text-indigo-600 hover:underline">
            Limpiar búsqueda
          </button>
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <p className="text-3xl">🎵</p>
          <p>Aún no tienes playlists. Crea la primera.</p>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <Section title="⭐ Favoritas">
              {favorites.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </Section>
          )}

          {ownNonFav.length > 0 && (
            <Section title="Mis playlists">
              {ownNonFav.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </Section>
          )}

          {sharedNonFav.length > 0 && (
            <Section title="Compartidas conmigo">
              {sharedNonFav.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function PlaylistCard({
  playlist: pl,
  onDelete,
  onToggleFavorite,
}: {
  playlist: Playlist;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 transition-colors ${
        pl.is_favorite ? "border-amber-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{pl.name}</p>
          {pl.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{pl.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!pl.is_owner && (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {pl.owner_name}
            </span>
          )}
          <button
            onClick={() => onToggleFavorite(pl.id, pl.is_favorite)}
            title={pl.is_favorite ? "Quitar de favoritas" : "Agregar a favoritas"}
            className={`text-lg transition-all hover:scale-110 ${
              pl.is_favorite ? "opacity-100" : "opacity-30 hover:opacity-70"
            }`}
          >
            {pl.is_favorite ? "⭐" : "☆"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">{pl.word_count} palabras</p>

      <div className="flex gap-2 mt-auto">
        <Link
          href={`/playlists/${pl.id}`}
          className="flex-1 text-center py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          Ver
        </Link>
        <Link
          href={`/review?playlist=${pl.id}`}
          className="flex-1 text-center py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Repasar
        </Link>
        {pl.is_owner && (
          <button
            onClick={() => onDelete(pl.id, pl.name)}
            className="text-xs text-gray-300 hover:text-rose-500 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
