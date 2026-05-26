import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [playlist] = await sql`
    SELECT p.id, p.name, p.description, p.owner_id, p.created_at,
           u.name AS owner_name,
           (p.owner_id = ${session.id}) AS is_owner
    FROM playlists p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = ${id}
      AND (p.owner_id = ${session.id}
        OR p.id IN (SELECT playlist_id FROM playlist_shares WHERE shared_with = ${session.id}))
  `;

  if (!playlist) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const words = await sql`
    SELECT w.id, w.word, w.translation_es, w.translation_pt, w.pronunciation,
           w.example_en, w.example_es, w.example_pt, w.category, w.part_of_speech,
           pw.added_at,
           COALESCE(r.review_count, 0)::int AS review_count
    FROM playlist_words pw
    JOIN words w ON pw.word_id = w.id
    LEFT JOIN (
      SELECT word_id, COUNT(*)::int AS review_count
      FROM word_reviews WHERE user_id = ${session.id}
      GROUP BY word_id
    ) r ON w.id = r.word_id
    WHERE pw.playlist_id = ${id}
    ORDER BY pw.added_at DESC
  `;

  const shares = await sql`
    SELECT ps.shared_with, u.name, u.email
    FROM playlist_shares ps
    JOIN users u ON ps.shared_with = u.id
    WHERE ps.playlist_id = ${id}
  `;

  return NextResponse.json({ playlist, words, shares });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [p] = await sql`SELECT owner_id FROM playlists WHERE id = ${id}`;
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (p.owner_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await sql`DELETE FROM playlists WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
