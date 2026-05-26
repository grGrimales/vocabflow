"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/setup"];

const NAV_LINKS = [
  { href: "/review", label: "Repasar" },
  { href: "/playlists", label: "Playlists" },
  { href: "/stats", label: "Estadísticas" },
  { href: "/quiz", label: "Evaluar" },
];

export default function NavBar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  if (AUTH_PAGES.includes(pathname)) return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-indigo-600 tracking-tight shrink-0">
          VocabFlow
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              {[
                { href: "/admin/users", label: "Usuarios" },
                { href: "/admin/words", label: "Palabras" },
                { href: "/admin/words/import", label: "Importar" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === href || (href !== "/admin/words" && pathname.startsWith(href))
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                {user.name[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-gray-900 leading-tight">{user.name}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${user.role === "admin" ? "text-purple-600" : "text-gray-400"}`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-rose-600 transition-colors px-2 py-1 rounded hover:bg-rose-50"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
