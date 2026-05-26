import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await ensureSchema();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const category = url.searchParams.get("category") ?? "all";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const search = q ? sql`AND (w.word ILIKE ${"%" + q + "%"} OR w.translation_es ILIKE ${"%" + q + "%"} OR w.translation_pt ILIKE ${"%" + q + "%"})` : sql``;
  const catFilter = category !== "all" ? sql`AND w.category = ${category}` : sql``;

  const words = await sql`
    SELECT
      w.id, w.word, w.translation_es, w.translation_pt,
      w.category, w.part_of_speech, w.created_at,
      (SELECT COUNT(*)::int FROM playlist_words pw WHERE pw.word_id = w.id) AS playlist_count,
      (SELECT COUNT(*)::int FROM word_reviews wr WHERE wr.word_id = w.id)  AS review_count,
      u.name AS created_by_name
    FROM words w
    LEFT JOIN users u ON w.created_by = u.id
    WHERE 1=1 ${search} ${catFilter}
    ORDER BY w.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [{ total }] = await sql`
    SELECT COUNT(*)::int AS total FROM words w WHERE 1=1 ${search} ${catFilter}
  `;

  return NextResponse.json({ words, total });
}
