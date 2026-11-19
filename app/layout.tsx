import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { loadStays } from "@/lib/data.ts";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "How Many Days",
  description:
    "How many nights should you spend in each town? Answers from stays logged by real backpackers, not blog guesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { isSample } = loadStays();
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-ink">
        <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col px-4">
          <header className="flex items-center justify-between gap-3 py-4">
            <Link
              href="/"
              className="flex min-h-11 items-center font-display text-lg font-bold tracking-tight text-brand"
            >
              How Many Days
            </Link>
            {isSample && (
              <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-secondary">
                Sample data
              </span>
            )}
          </header>
          <main className="flex-1 pb-6">{children}</main>
          <footer className="pb-8 text-xs leading-normal text-text-secondary">
            Every number comes from logged stays, not editors.
            {isSample && " This site is running on made-up sample data for testing."}
          </footer>
        </div>
      </body>
    </html>
  );
}
