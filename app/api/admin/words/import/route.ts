import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

interface WordInput {
  word: string;
  translation_es: string;
  translation_pt: string;
  pronunciation?: string;
  example_en?: string;
  example_es?: string;
  example_pt?: string;
  category?: string;
  part_of_speech?: string;
  playlists?: string[]; // playlist names — created if they don't exist
}

const VALID_CATEGORIES = ["beginner", "intermediate", "advanced"];
const VALID_POS = ["noun", "verb", "adjective", "adverb", "phrase"];

// Returns existing or newly created playlist id by name
async function resolvePlaylist(name: string, ownerId: string): Promise<string> {
  const existing = await sql`
    SELECT id FROM playlists WHERE LOWER(name) = LOWER(${name.trim()}) AND owner_id = ${ownerId} LIMIT 1
  `;
  if (existing[0]) return existing[0].id as string;

  const created = await sql`
    INSERT INTO playlists (name, owner_id)
    VALUES (${name.trim()}, ${ownerId})
    RETURNING id
  `;
  return created[0].id as string;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const words: WordInput[] = Array.isArray(body) ? body : body.words;

  if (!Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ error: "El JSON debe ser un array de palabras" }, { status: 400 });
  }

  if (words.length > 500) {
    return NextResponse.json({ error: "Máximo 500 palabras por importación" }, { status: 400 });
  }

  await ensureSchema();

  let imported = 0;
  let skipped = 0;
  const playlistsCreated: string[] = [];
  const errors: string[] = [];

  // Pre-resolve all unique playlist names so we avoid repeated round-trips
  const playlistCache = new Map<string, string>();
  const allPlaylistNames = new Set(words.flatMap((w) => w.playlists ?? []));
  for (const name of allPlaylistNames) {
    const id = await resolvePlaylist(name, session.id);
    const lowerName = name.trim().toLowerCase();
    if (!playlistCache.has(lowerName)) playlistsCreated.push(name.trim());
    playlistCache.set(lowerName, id);
  }

  for (const w of words) {
    if (!w.word?.trim() || !w.translation_es?.trim() || !w.translation_pt?.trim()) {
      errors.push(`Falta word/translation_es/translation_pt en: ${JSON.stringify(w).slice(0, 60)}`);
      skipped++;
      continue;
    }

    const category = VALID_CATEGORIES.includes(w.category ?? "") ? w.category : "intermediate";
    const pos = VALID_POS.includes(w.part_of_speech ?? "") ? w.part_of_speech : null;

    try {
      const rows = await sql`
        INSERT INTO words (word, translation_es, translation_pt, pronunciation, example_en, example_es, example_pt, category, part_of_speech, created_by)
        VALUES (
          ${w.word.trim()}, ${w.translation_es.trim()}, ${w.translation_pt.trim()},
          ${w.pronunciation?.trim() ?? null}, ${w.example_en?.trim() ?? null},
          ${w.example_es?.trim() ?? null}, ${w.example_pt?.trim() ?? null},
          ${category}, ${pos}, ${session.id}
        )
        RETURNING id
      `;
      const wordId = rows[0].id as string;
      imported++;

      // Link to playlists
      for (const plName of w.playlists ?? []) {
        const plId = playlistCache.get(plName.trim().toLowerCase());
        if (plId) {
          await sql`
            INSERT INTO playlist_words (playlist_id, word_id)
            VALUES (${plId}, ${wordId})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    } catch (e: unknown) {
      // Duplicate word — still try to link to playlists using existing word id
      if ((e as { code?: string }).code === "23505") {
        const existing = await sql`SELECT id FROM words WHERE word = ${w.word.trim()} LIMIT 1`;
        if (existing[0]) {
          for (const plName of w.playlists ?? []) {
            const plId = playlistCache.get(plName.trim().toLowerCase());
            if (plId) {
              await sql`
                INSERT INTO playlist_words (playlist_id, word_id)
                VALUES (${plId}, ${existing[0].id})
                ON CONFLICT DO NOTHING
              `;
            }
          }
        }
        skipped++;
      } else {
        errors.push(`Error insertando "${w.word}"`);
        skipped++;
      }
    }
  }

  return NextResponse.json({ ok: true, imported, skipped, playlistsCreated, errors });
}
