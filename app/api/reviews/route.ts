import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const { wordId } = await req.json();
  if (!wordId) return NextResponse.json({ error: "wordId requerido" }, { status: 400 });

  await sql`
    INSERT INTO word_reviews (user_id, word_id)
    VALUES (${session.id}, ${wordId})
  `;

  return NextResponse.json({ ok: true });
}
