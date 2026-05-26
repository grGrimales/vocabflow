import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") ?? "least-reviewed";
  const playlistId = url.searchParams.get("playlist");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const playlistFilter = playlistId
    ? sql`AND w.id IN (SELECT word_id FROM playlist_words WHERE playlist_id = ${playlistId})`
    : sql``;

  let orderBy;
  if (sort === "random") {
    orderBy = sql`ORDER BY RANDOM()`;
  } else if (sort === "recent") {
    orderBy = sql`ORDER BY w.created_at DESC`;
  } else if (sort === "oldest") {
    orderBy = sql`ORDER BY w.created_at ASC`;
  } else {
    // least-reviewed (default)
    orderBy = sql`ORDER BY COALESCE(r.review_count, 0) ASC, w.created_at ASC`;
  }

  const rows = await sql`
    SELECT
      w.id, w.word, w.translation_es, w.translation_pt,
      w.pronunciation, w.example_en, w.example_es, w.example_pt,
      w.category, w.part_of_speech, w.created_at,
      COALESCE(r.review_count, 0)::int AS review_count,
      r.last_reviewed
    FROM words w
    LEFT JOIN (
      SELECT word_id,
             COUNT(*)::int          AS review_count,
             MAX(reviewed_at)       AS last_reviewed
      FROM word_reviews
      WHERE user_id = ${session.id}
      GROUP BY word_id
    ) r ON w.id = r.word_id
    WHERE 1=1 ${playlistFilter}
    ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [{ total }] = await sql`
    SELECT COUNT(*)::int AS total FROM words w
    WHERE 1=1 ${playlistFilter}
  `;

  return NextResponse.json({ words: rows, total });
}
