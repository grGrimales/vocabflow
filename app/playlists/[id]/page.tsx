"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { speak } from "@/lib/speech";

interface Word {
  id: string;
  word: string;
  translation_es: string;
  translation_pt: string;
  pronunciation: string | null;
  review_count: number;
}

interface Share { shared_with: string; name: string; email: string }
interface User { id: string; name: string; email: string }

interface PlaylistData {
  id: string;
  name: string;
  description: string | null;
  owner_name: string;
  is_owner: boolean;
}

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Share UI
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Word search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchPlaylist = async () => {
    const res = await fetch(`/api/playlists/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlaylist(data.playlist);
    setWords(data.words);
    setShares(data.shares);
    setLoading(false);
  };

  useEffect(() => { fetchPlaylist(); }, [id]);

  const removeWord = async (wordId: string) => {
    setRemovingId(wordId);
    await fetch(`/api/playlists/${id}/words`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId }),
    });
    setWords((w) => w.filter((x) => x.id !== wordId));
    setRemovingId(null);
  };

  const openSharePanel = async () => {
    if (allUsers.length === 0) {
      const res = await fetch("/api/users");
      const data = await res.json();
      setAllUsers(data.users ?? []);
    }
    setShowShare(true);
  };

  const toggleShare = async (userId: string, isShared: boolean) => {
    setSharingId(userId);
    const method = isShared ? "DELETE" : "POST";
    await fetch(`/api/playlists/${id}/share`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchPlaylist();
    setSharingId(null);
  };

  const searchWords = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/words?sort=oldest&limit=10&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const existing = new Set(words.map((w) => w.id));
    setSearchResults((data.words ?? []).filter((w: Word) => !existing.has(w.id)));
    setSearching(false);
  };

  const addWord = async (wordId: string) => {
    setAddingId(wordId);
    await fetch(`/api/playlists/${id}/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId }),
    });
    await fetchPlaylist();
    setSearchResults((r) => r.filter((w) => w.id !== wordId));
    setSearch("");
    setAddingId(null);
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-300">Cargando...</div>;
  }
  if (!playlist) {
    return <div className="text-center py-16 text-gray-400">Playlist no encontrada</div>;
  }

  const sharedIds = new Set(shares.map((s) => s.shared_with));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/playlists" className="text-xs text-gray-400 hover:text-indigo-600 mb-2 block">
            ← Playlists
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{playlist.name}</h1>
          {playlist.description && <p className="text-gray-500 mt-1">{playlist.description}</p>}
          <p className="text-xs text-gray-400 mt-1">Por {playlist.owner_name} · {words.length} palabras</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {playlist.is_owner && (
            <button
              onClick={openSharePanel}
              className="text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
            >
              Compartir
            </button>
          )}
          <Link
            href={`/review?playlist=${id}`}
            className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Repasar
          </Link>
        </div>
      </div>

      {/* Share panel */}
      {showShare && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Compartir con usuarios</h2>
            <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {allUsers.filter((u) => u.id !== playlist.owner_name).map((user) => {
              const isShared = sharedIds.has(user.id);
              return (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => toggleShare(user.id, isShared)}
                    disabled={sharingId === user.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      isShared
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    {sharingId === user.id ? "..." : isShared ? "Quitar acceso" : "Dar acceso"}
                  </button>
                </div>
              );
            })}
          </div>
          {shares.length > 0 && (
            <p className="text-xs text-gray-400">
              Compartida con: {shares.map((s) => s.name).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Add words (owner only) */}
      {playlist.is_owner && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Agregar palabra</p>
          <input
            value={search}
            onChange={(e) => searchWords(e.target.value)}
            placeholder="Buscar por palabra o traducción..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          {searching && <p className="text-xs text-gray-400">Buscando...</p>}
          {searchResults.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {searchResults.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-sm text-gray-900">{w.word}</span>
                    <span className="text-xs text-gray-400 ml-2">{w.translation_es}</span>
                  </div>
                  <button
                    onClick={() => addWord(w.id)}
                    disabled={addingId === w.id}
                    className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    {addingId === w.id ? "..." : "+ Agregar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Word list */}
      {words.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p>Esta playlist está vacía. Agrega palabras.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {words.map((w) => (
            <div key={w.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{w.word}</span>
                  {w.pronunciation && <span className="text-xs text-gray-400 font-mono">{w.pronunciation}</span>}
                </div>
                <p className="text-sm text-gray-500">{w.translation_es} · {w.translation_pt}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => speak(w.word, "en-US")} className="text-gray-300 hover:text-indigo-500 transition-colors text-sm">🔊</button>
                <span className="text-xs text-gray-300">{w.review_count}×</span>
                {playlist.is_owner && (
                  <button
                    onClick={() => removeWord(w.id)}
                    disabled={removingId === w.id}
                    className="text-gray-200 hover:text-rose-500 transition-colors text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
