import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await sql`
    SELECT
      u.id, u.email, u.name, u.role, u.created_at,
      c.name AS created_by_name
    FROM users u
    LEFT JOIN users c ON u.created_by = c.id
    ORDER BY u.created_at DESC
  `;

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { email, name, password, role } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const validRole = role === "admin" ? "admin" : "user";
  const hash = await hashPassword(password);

  try {
    const rows = await sql`
      INSERT INTO users (email, name, password_hash, role, created_by)
      VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${hash}, ${validRole}, ${session.id})
      RETURNING id, email, name, role, created_at
    `;
    return NextResponse.json({ ok: true, user: rows[0] }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }
    throw e;
  }
}
