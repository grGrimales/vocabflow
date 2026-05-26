import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const mistakes = await sql`
    SELECT
      w.id,
      w.word,
      w.translation_es,
      w.translation_pt,
      w.part_of_speech,
      COUNT(*)::int                                     AS attempt_count,
      COUNT(*) FILTER (WHERE qa.is_correct)::int        AS correct_count,
      COUNT(*) FILTER (WHERE NOT qa.is_correct)::int    AS error_count,
      MAX(qa.created_at)                                AS last_attempt,
      (
        SELECT qa2.user_answer
        FROM quiz_attempts qa2
        WHERE qa2.word_id = w.id
          AND qa2.user_id = ${session.id}
          AND NOT qa2.is_correct
        ORDER BY qa2.created_at DESC
        LIMIT 1
      ) AS last_wrong_answer
    FROM quiz_attempts qa
    JOIN words w ON w.id = qa.word_id
    WHERE qa.user_id = ${session.id}
    GROUP BY w.id, w.word, w.translation_es, w.translation_pt, w.part_of_speech
    HAVING COUNT(*) FILTER (WHERE NOT qa.is_correct) > 0
    ORDER BY error_count DESC, last_attempt DESC
    LIMIT 100
  `;

  return NextResponse.json({ mistakes });
}
