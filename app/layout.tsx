import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "How Many Days",
  description:
    "How many nights should you spend in each town? Answers from stays logged by real backpackers, not blog guesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-ink">
        <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col px-4">
          <header className="flex items-center py-4">
            <Link
              href="/"
              className="flex min-h-11 items-center font-display text-lg font-bold tracking-tight"
            >
              How Many Days
            </Link>
          </header>
          <main className="flex-1 pb-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
