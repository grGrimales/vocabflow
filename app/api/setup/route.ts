import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  await ensureSchema();
  const rows = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  return NextResponse.json({ configured: rows.length > 0 });
}

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  await ensureSchema();

  const existing = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "El sistema ya está configurado" }, { status: 409 });
  }

  const hash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO users (email, name, password_hash, role)
    VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${hash}, 'admin')
    RETURNING id, email, name, role
  `;

  return NextResponse.json({ ok: true, user: rows[0] });
}
