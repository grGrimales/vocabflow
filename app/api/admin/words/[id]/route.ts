import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const result = await sql`DELETE FROM words WHERE id = ${id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Palabra no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
