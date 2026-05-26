import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const userId = session.id;

  const [summary] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::int  AS today,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int  AS week,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS month,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '365 days')::int AS year,
      COUNT(*)::int                                                           AS all_time,
      COUNT(*) FILTER (WHERE is_correct)::int                                AS correct,
      COUNT(*) FILTER (WHERE NOT is_correct)::int                            AS incorrect
    FROM quiz_attempts
    WHERE user_id = ${userId}
  `;

  const daily = await sql`
    SELECT
      DATE(created_at AT TIME ZONE 'UTC') AS date,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_correct)::int AS correct
    FROM quiz_attempts
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at AT TIME ZONE 'UTC')
    ORDER BY date
  `;

  const weekly = await sql`
    SELECT
      DATE_TRUNC('week', created_at) AS week,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_correct)::int AS correct
    FROM quiz_attempts
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '84 days'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week
  `;

  const monthly = await sql`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_correct)::int AS correct
    FROM quiz_attempts
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '365 days'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `;

  return NextResponse.json({ summary, daily, weekly, monthly });
}
