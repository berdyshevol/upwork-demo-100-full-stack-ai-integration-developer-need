import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Content Brief Generator",
  description:
    "Enter a topic, tone and audience and watch a structured content brief stream in live from GPT-4 or Claude — provider-agnostic, BYOK.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="border-b border-white/10 backdrop-blur sticky top-0 z-10 bg-ink/70">
          <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-accent to-accent2" />
              Brief<span className="text-accent2">Forge</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-slate-300 hover:text-white">
                Generator
              </Link>
              <Link
                href="/settings"
                data-testid="settings-link"
                className="rounded-md border border-white/15 px-3 py-1.5 text-slate-200 hover:border-accent hover:text-white"
              >
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
