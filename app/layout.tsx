import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NavBar from "@/components/NavBar";
import { getSession } from "@/lib/auth";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VocabFlow — Aprende inglés",
  description: "Aprende vocabulario en inglés con flashcards y quizzes interactivos",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="es" className={geist.className}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <NavBar user={session} />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
