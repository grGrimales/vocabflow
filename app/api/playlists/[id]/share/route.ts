import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  const [p] = await sql`SELECT owner_id FROM playlists WHERE id = ${id}`;
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (p.owner_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Solo el dueño puede compartir" }, { status: 403 });
  }
  if (userId === session.id) {
    return NextResponse.json({ error: "No puedes compartirte a ti mismo" }, { status: 400 });
  }

  await sql`
    INSERT INTO playlist_shares (playlist_id, shared_with, shared_by)
    VALUES (${id}, ${userId}, ${session.id})
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  const [p] = await sql`SELECT owner_id FROM playlists WHERE id = ${id}`;
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (p.owner_id !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await sql`
    DELETE FROM playlist_shares WHERE playlist_id = ${id} AND shared_with = ${userId}
  `;
  return NextResponse.json({ ok: true });
}
