"use client";

import { useState } from "react";
import type { AnswerFilter, TownStats } from "@/lib/stats.ts";
import { STYLE_LABEL, STYLE_PEOPLE, capitalise } from "@/lib/labels.ts";
import { AnswerCard } from "./AnswerCard.tsx";
import { DistributionChart } from "./DistributionChart.tsx";
import { FilterPanel } from "./FilterPanel.tsx";
import { RegretBar } from "./RegretBar.tsx";
import { SectionHeading } from "./SectionHeading.tsx";

type Props = {
  townName: string;
  country: string;
  stopNumber: number;
  totalStops: number;
  /** Worked out at build time for every style (lib/stats.ts townStatsByStyle). */
  answers: Record<AnswerFilter, TownStats>;
};

const PANEL_ID = "answer-filter";

/**
 * Filter button, town name and everything the answer filter changes:
 * the answer, the chart and the Looking back bar. Nothing else on the
 * page reads this filter (product rule 7).
 */
export function TownAnswer({ townName, country, stopNumber, totalStops, answers }: Props) {
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
      <section className="flex flex-col items-start gap-5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={PANEL_ID}
          className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${
            applied === "all" ? "bg-surface text-ink" : "bg-brand-tint text-brand-text ring-2 ring-brand"
          }`}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-secondary">
            {country} <span className="text-accent">·</span> Stop {stopNumber} of {totalStops}
          </p>
          <h1 className="text-[68px] font-bold leading-[0.9] tracking-[-0.045em]">{townName}</h1>
        </div>
      </section>

      {open && (
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
      )}

      <AnswerCard townName={townName} stats={stats} people={people} />

      {stats.distribution && stats.regret && (
        <section className="flex flex-col gap-4">
          <SectionHeading eyebrow="The spread" title="How long people stayed" note={people ? capitalise(people) : "All travellers"} />
          <div className="flex flex-col gap-6 rounded-card bg-surface px-5 py-5">
            <DistributionChart distribution={stats.distribution} />
            <div className="h-px bg-border" />
            <RegretBar regret={stats.regret} />
          </div>
        </section>
      )}
    </>
  );
}
