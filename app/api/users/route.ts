import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const users = await sql`
    SELECT id, name, email, role FROM users ORDER BY name ASC
  `;

  return NextResponse.json({ users });
}
