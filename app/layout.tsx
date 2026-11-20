import type { Metadata } from "next";
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
          <main className="flex-1 pb-12">{children}</main>
          <footer className="border-t-2 border-dashed border-border pb-10 pt-5 text-xs leading-normal text-text-secondary">
            Every number comes from logged stays, not editors.
            {isSample && " This site is running on made-up sample data for testing."}
          </footer>
        </div>
      </body>
    </html>
  );
}
