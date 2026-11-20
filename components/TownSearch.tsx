"use client";

import Link from "next/link";
import { useState } from "react";
import { searchTowns } from "@/lib/town-search.ts";
import { HeroScene } from "./HeroScene.tsx";
import { SiteHeader } from "./SiteHeader.tsx";

export type TownSummary = {
  slug: string;
  name: string;
  country: string;
  aliases: string[];
  stop: number;
  /** "4 nights", "3–5 nights", or null when there aren't enough stays. */
  answer: string | null;
  earlyData: boolean;
  /** % who wished they'd stayed longer; null under 10 stays. */
  wishedLonger: number | null;
};

/** Home page: lime header with the search box, then the route's towns, filtered as you type. */
export function TownSearch({ towns, isSample }: { towns: TownSummary[]; isSample: boolean }) {
  const [query, setQuery] = useState("");
  const shown = searchTowns(towns, query);

  return (
    <>
      <header className="relative -mx-4 overflow-hidden rounded-b-[36px] bg-brand-lime px-4 pb-[120px] pt-3">
        <HeroScene />
        <SiteHeader isSample={isSample} />
        <div className="relative mt-6 flex flex-col gap-3">
          <span className="w-max -rotate-3 rounded-full bg-accent-bar px-3 py-1.5 text-xs font-extrabold text-ink">
            Southeast Asia loop · {towns.length} stops
          </span>
          <h1 className="text-[52px] font-extrabold leading-[0.95] tracking-[-0.05em] text-ink">How many nights?</h1>
          <p className="max-w-[270px] text-[16px] font-bold leading-snug text-ink">
            Everyone says 2–3 days. Here&rsquo;s what people actually did.
          </p>
        </div>
      </header>

      <div className="relative -mt-[88px] flex flex-col gap-3">
        <label htmlFor="town-search" className="sr-only">
          Search for a town
        </label>
        <div className="flex items-center gap-3 rounded-full bg-surface px-5 ring-2 ring-ink focus-within:ring-brand">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="town-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a town, e.g. Pai"
            autoComplete="off"
            className="h-14 w-full bg-transparent text-[17px] font-bold outline-none placeholder:font-semibold placeholder:text-text-secondary"
          />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[24px] font-extrabold tracking-[-0.03em]">{query.trim() ? "Matching towns" : "The loop"}</h2>
          <p className="text-[13px] font-bold text-text-secondary" aria-live="polite">
            {shown.length} {shown.length === 1 ? "town" : "towns"}
          </p>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-card bg-surface p-5 text-[15px] ring-1 ring-border">
            No town on the loop matches &ldquo;{query.trim()}&rdquo;. We only cover the Southeast Asia loop for now.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${t.slug}`}
                  className="flex min-h-11 items-center gap-4 rounded-card bg-surface p-4 ring-1 ring-border transition hover:ring-2 hover:ring-brand-mid"
                >
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent-tint leading-none">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-accent-text">Stop</span>
                    <span className="text-[19px] font-extrabold text-accent-text">{t.stop}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[18px] font-extrabold leading-tight tracking-[-0.02em]">{t.name}</span>
                    <span className="text-[13px] text-text-secondary">{t.country}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                    {t.answer ? (
                      <>
                        <span className="text-[20px] font-extrabold leading-none tracking-[-0.03em]">{t.answer}</span>
                        {t.wishedLonger !== null && (
                          <span className="rounded-full bg-more-tint px-2 py-0.5 text-[11px] font-extrabold text-more-text">
                            {t.wishedLonger}% wished longer
                          </span>
                        )}
                        {t.earlyData && <span className="text-[11px] font-bold text-accent">Early data</span>}
                      </>
                    ) : (
                      <span className="max-w-[96px] text-[12px] font-bold leading-tight text-text-secondary">Not enough stays yet</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
