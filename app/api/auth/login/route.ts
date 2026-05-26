import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { checkPassword, signToken, SESSION_COOKIE } from "@/lib/auth";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
  }

  await ensureSchema();

  const ip = getIp(req);
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const failRows = await sql`
    SELECT COUNT(*) AS cnt FROM login_attempts
    WHERE ip = ${ip} AND success = false AND attempted_at > ${windowStart}
  `;
  if (Number(failRows[0].cnt) >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "Demasiados intentos fallidos. Inténtalo en 15 minutos." },
      { status: 429 }
    );
  }

  const rows = await sql`
    SELECT id, email, name, role, password_hash
    FROM users WHERE email = ${email.toLowerCase().trim()}
  `;
  const user = rows[0];
  const ok = !!user && (await checkPassword(password, user.password_hash));

  await sql`
    INSERT INTO login_attempts (ip, success) VALUES (${ip}, ${ok})
  `;

  if (!ok) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
