import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  // Own playlists + shared playlists
  const playlists = await sql`
    SELECT
      p.id, p.name, p.description, p.owner_id, p.created_at,
      u.name AS owner_name,
      (SELECT COUNT(*)::int FROM playlist_words pw WHERE pw.playlist_id = p.id) AS word_count,
      (p.owner_id = ${session.id}) AS is_owner,
      EXISTS(
        SELECT 1 FROM playlist_favorites pf
        WHERE pf.playlist_id = p.id AND pf.user_id = ${session.id}
      ) AS is_favorite
    FROM playlists p
    JOIN users u ON p.owner_id = u.id
    WHERE p.owner_id = ${session.id}
       OR p.id IN (
         SELECT playlist_id FROM playlist_shares WHERE shared_with = ${session.id}
       )
    ORDER BY is_favorite DESC, is_owner DESC, p.created_at DESC
  `;

  return NextResponse.json({ playlists });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const [playlist] = await sql`
    INSERT INTO playlists (name, description, owner_id)
    VALUES (${name.trim()}, ${description?.trim() ?? null}, ${session.id})
    RETURNING id, name, description, owner_id, created_at
  `;

  return NextResponse.json({ ok: true, playlist }, { status: 201 });
}
