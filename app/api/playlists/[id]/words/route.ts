import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { wordId } = await req.json();

  const [p] = await sql`SELECT owner_id FROM playlists WHERE id = ${id}`;
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (p.owner_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await sql`
    INSERT INTO playlist_words (playlist_id, word_id)
    VALUES (${id}, ${wordId})
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { wordId } = await req.json();

  const [p] = await sql`SELECT owner_id FROM playlists WHERE id = ${id}`;
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (p.owner_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await sql`DELETE FROM playlist_words WHERE playlist_id = ${id} AND word_id = ${wordId}`;
  return NextResponse.json({ ok: true });
}
