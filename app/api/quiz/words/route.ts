import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

type Sort = "random" | "least-attempted" | "least-accurate" | "newest" | "oldest";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureSchema();

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10"), 50);
  const playlistId = url.searchParams.get("playlist") || null;
  const sort: Sort = (url.searchParams.get("sort") as Sort) ?? "random";
  const userId = session.id;

  const playlistFilter = playlistId
    ? sql`AND EXISTS (
        SELECT 1 FROM playlist_words pw
        WHERE pw.word_id = w.id AND pw.playlist_id = ${playlistId}
      )`
    : sql``;

  let orderBy;
  switch (sort) {
    case "least-attempted":
      orderBy = sql`ORDER BY (
        SELECT COUNT(*) FROM quiz_attempts qa
        WHERE qa.word_id = w.id AND qa.user_id = ${userId}
      ) ASC, RANDOM()`;
      break;
    case "least-accurate":
      orderBy = sql`ORDER BY COALESCE(
        (SELECT COUNT(*) FILTER (WHERE qa.is_correct)::float / NULLIF(COUNT(*), 0)
         FROM quiz_attempts qa WHERE qa.word_id = w.id AND qa.user_id = ${userId}),
        1.1
      ) ASC, RANDOM()`;
      break;
    case "newest":
      orderBy = sql`ORDER BY w.created_at DESC`;
      break;
    case "oldest":
      orderBy = sql`ORDER BY w.created_at ASC`;
      break;
    default:
      orderBy = sql`ORDER BY RANDOM()`;
  }

  const words = await sql`
    SELECT w.id, w.word, w.translation_es, w.translation_pt, w.part_of_speech, w.pronunciation
    FROM words w
    WHERE 1=1 ${playlistFilter}
    ${orderBy}
    LIMIT ${limit}
  `;

  return NextResponse.json({ words });
}
