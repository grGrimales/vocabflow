import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const [summary] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE reviewed_at >= CURRENT_DATE)::int                              AS today,
      COUNT(*) FILTER (WHERE reviewed_at >= DATE_TRUNC('week', CURRENT_DATE))::int          AS this_week,
      COUNT(*) FILTER (WHERE reviewed_at >= DATE_TRUNC('month', CURRENT_DATE))::int         AS this_month,
      COUNT(*) FILTER (WHERE reviewed_at >= DATE_TRUNC('year', CURRENT_DATE))::int          AS this_year,
      COUNT(*)::int                                                                          AS all_time,
      COUNT(DISTINCT word_id)::int                                                           AS unique_words
    FROM word_reviews
    WHERE user_id = ${session.id}
  `;

  const daily = await sql`
    SELECT DATE(reviewed_at)::text AS date, COUNT(*)::int AS count
    FROM word_reviews
    WHERE user_id = ${session.id}
      AND reviewed_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(reviewed_at)
    ORDER BY date DESC
  `;

  const weekly = await sql`
    SELECT DATE_TRUNC('week', reviewed_at)::date::text AS week_start, COUNT(*)::int AS count
    FROM word_reviews
    WHERE user_id = ${session.id}
      AND reviewed_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY week_start
    ORDER BY week_start DESC
  `;

  const monthly = await sql`
    SELECT TO_CHAR(DATE_TRUNC('month', reviewed_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
    FROM word_reviews
    WHERE user_id = ${session.id}
      AND reviewed_at >= NOW() - INTERVAL '12 months'
    GROUP BY month
    ORDER BY month DESC
  `;

  const topWords = await sql`
    SELECT w.word, w.translation_es, COUNT(*)::int AS count
    FROM word_reviews wr
    JOIN words w ON wr.word_id = w.id
    WHERE wr.user_id = ${session.id}
    GROUP BY w.id, w.word, w.translation_es
    ORDER BY count DESC
    LIMIT 10
  `;

  return NextResponse.json({ summary, daily, weekly, monthly, topWords });
}
