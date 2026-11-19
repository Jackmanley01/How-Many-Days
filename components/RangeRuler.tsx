import type { NightRange } from "@/lib/stats.ts";

const TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/** Position of a night count on the 1-10+ scale, as a percentage of the width (layout only, not stats). */
const at = (n: number) => ((Math.min(n, 10) - 1) / 9) * 100;

/** A 1-10+ nights scale with the middle half of stays shaded and the answer marked. Decorative: the same facts are visible text. */
export function RangeRuler({ range, answer }: { range: NightRange; answer: number | null }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 pt-1">
      <div className="relative h-3">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-bar" />
        <div
          className="absolute top-0 h-3 rounded-full bg-brand-tint"
          style={{ left: `calc(${at(range.low)}% - 6px)`, width: `calc(${at(range.high) - at(range.low)}% + 12px)` }}
        />
        {answer !== null && (
          <div className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink" style={{ left: `${at(answer)}%` }} />
        )}
      </div>
      <div className="relative h-4 text-[11px] font-semibold text-text-secondary">
        {TICKS.map((t) => (
          <span
            key={t}
            className={`absolute -translate-x-1/2 ${t >= range.low && t <= range.high ? "text-ink" : ""}`}
            style={{ left: `${at(t)}%` }}
          >
            {t === 10 ? "10+" : t}
          </span>
        ))}
      </div>
    </div>
  );
}
