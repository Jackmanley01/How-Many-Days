"use client";

import { useState } from "react";
import type { AnswerFilter, TownStats } from "@/lib/stats.ts";
import { STYLE_LABEL, STYLE_PEOPLE, capitalise } from "@/lib/labels.ts";
import { AnswerCard } from "./AnswerCard.tsx";
import { DistributionChart } from "./DistributionChart.tsx";
import { FilterPanel } from "./FilterPanel.tsx";
import { HeroScene } from "./HeroScene.tsx";
import { RegretBar } from "./RegretBar.tsx";
import { RouteDots } from "./RouteDots.tsx";
import { SectionHeading } from "./SectionHeading.tsx";
import { SiteHeader } from "./SiteHeader.tsx";

type Props = {
  townName: string;
  country: string;
  stopNumber: number;
  totalStops: number;
  isSample: boolean;
  /** Worked out at build time for every style (lib/stats.ts townStatsByStyle). */
  answers: Record<AnswerFilter, TownStats>;
};

const PANEL_ID = "answer-filter";

/**
 * Lime header (Filter button, town name, route), and everything the answer
 * filter changes: the answer, the chart and the Looking back bar. Nothing
 * else on the page reads this filter (product rule 7).
 */
export function TownAnswer({ townName, country, stopNumber, totalStops, isSample, answers }: Props) {
  const [applied, setApplied] = useState<AnswerFilter>("all");
  const [pending, setPending] = useState<AnswerFilter>("all");
  const [open, setOpen] = useState(false);

  const stats = answers[applied];
  const people = applied === "all" ? null : STYLE_PEOPLE[applied];

  function toggle() {
    setPending(applied);
    setOpen(!open);
  }

  return (
    <>
      <header className="relative -mx-4 overflow-hidden rounded-b-[36px] bg-brand-lime px-4 pb-[96px] pt-3">
        <HeroScene />
        <SiteHeader isSample={isSample} />
        <div className="relative mt-4 flex flex-col items-start gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={PANEL_ID}
            className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-extrabold ${
              applied === "all" ? "bg-surface text-ink" : "bg-ink text-white"
            }`}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            {applied === "all" ? (
              "Filter"
            ) : (
              <>
                <span className="sr-only">Filter: </span>
                {STYLE_LABEL[applied]}
              </>
            )}
          </button>
          <span className="-rotate-3 rounded-full bg-accent-bar px-3 py-1.5 text-xs font-extrabold text-ink">
            Stop {stopNumber} of {totalStops} on the loop
          </span>
          <div>
            <h1 className="text-[64px] font-extrabold leading-[0.95] tracking-[-0.05em] text-ink">{townName}</h1>
            <p className="mt-1 text-[15px] font-bold text-ink">{country}</p>
          </div>
          <RouteDots stop={stopNumber} total={totalStops} />
        </div>
      </header>

      {open && (
        <div className="relative -mt-[80px]">
          <FilterPanel
            id={PANEL_ID}
            answers={answers}
            pending={pending}
            onPick={setPending}
            onReset={() => {
              setPending("all");
              setApplied("all");
              setOpen(false);
            }}
            onApply={() => {
              setApplied(pending);
              setOpen(false);
            }}
          />
        </div>
      )}

      <div className={open ? "" : "relative -mt-[80px]"}>
        <AnswerCard townName={townName} stats={stats} people={people} />
      </div>

      {stats.distribution && stats.regret && (
        <section className="flex flex-col gap-4">
          <SectionHeading eyebrow="The spread" title="How long people stayed" note={people ? capitalise(people) : "All travellers"} />
          <div className="flex flex-col gap-6 rounded-card bg-surface px-5 py-5">
            <DistributionChart distribution={stats.distribution} />
            <div className="h-0.5 border-t-2 border-dashed border-border" />
            <RegretBar regret={stats.regret} />
          </div>
        </section>
      )}
    </>
  );
}
