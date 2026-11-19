"use client";

import type { AnswerFilter, TownStats } from "@/lib/stats.ts";
import { STYLE_LABEL, staysText } from "@/lib/labels.ts";
import { STYLE_KEYS } from "@/lib/stats.ts";
import { StylePills } from "./StylePills.tsx";

type Props = {
  id: string;
  answers: Record<AnswerFilter, TownStats>;
  pending: AnswerFilter;
  onPick: (value: AnswerFilter) => void;
  onReset: () => void;
  onApply: () => void;
};

/** The answer filter's panel: pick a style, see how many stays it has, then apply. */
export function FilterPanel({ id, answers, pending, onPick, onReset, onApply }: Props) {
  const options = [
    { value: "all" as AnswerFilter, label: `All travellers · ${answers.all.n}` },
    ...STYLE_KEYS.map((s) => ({ value: s as AnswerFilter, label: `${STYLE_LABEL[s]} · ${answers[s].n}` })),
  ];
  return (
    <section id={id} aria-label="Filter the answer" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold">Travel style</p>
        <p className="text-[13px] text-text-secondary">Changes the nights, the chart and the regret figures. Reviews have their own filter below.</p>
      </div>
      <StylePills options={options} selected={pending} onSelect={onPick} label="Travel style for the answer" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 rounded-full border border-[#D1D5DB] px-5 text-sm font-semibold hover:border-ink"
        >
          Reset
        </button>
        <button type="button" onClick={onApply} className="min-h-11 flex-1 rounded-full bg-brand px-5 text-sm font-semibold text-white">
          Show answer · {staysText(answers[pending].n)}
        </button>
      </div>
    </section>
  );
}
