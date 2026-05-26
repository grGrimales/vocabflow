import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const { id } = await params;

  await sql`
    INSERT INTO playlist_favorites (user_id, playlist_id)
    VALUES (${session.id}, ${id})
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await sql`
    DELETE FROM playlist_favorites
    WHERE user_id = ${session.id} AND playlist_id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
