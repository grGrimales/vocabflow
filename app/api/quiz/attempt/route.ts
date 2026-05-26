import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const body = await req.json();
  const { wordId, mode, sourceLang, isCorrect, userAnswer, correctAnswer } = body;

  if (!wordId || !mode || typeof isCorrect !== "boolean" || !userAnswer || !correctAnswer) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  await sql`
    INSERT INTO quiz_attempts (user_id, word_id, mode, source_lang, is_correct, user_answer, correct_answer)
    VALUES (
      ${session.id}, ${wordId}, ${mode},
      ${sourceLang ?? null}, ${isCorrect},
      ${userAnswer}, ${correctAnswer}
    )
  `;

  return NextResponse.json({ ok: true });
}
