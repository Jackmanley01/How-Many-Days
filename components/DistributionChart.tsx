import type { TownStats } from "@/lib/stats.ts";

const CHART_HEIGHT = 140;

/** 1, 2, 3, 4, 5+ nights. Percentages are visible text. */
export function DistributionChart({ distribution }: { distribution: NonNullable<TownStats["distribution"]> }) {
  const max = Math.max(...distribution.map((b) => b.percent), 1);
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid h-[190px] grid-cols-5 gap-2" aria-label="Share of stays by nights">
        {distribution.map((b) => (
          <li key={b.bucket} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className={`text-[13px] font-bold ${b.highlighted ? "text-brand" : "text-text-secondary"}`}>
              {b.percent}%<span className="sr-only"> stayed {b.bucket} {b.bucket === "1" ? "night" : "nights"}</span>
            </span>
            <div
              aria-hidden="true"
              className={`w-full rounded-[12px] ${b.highlighted ? "bg-brand-mid" : "bg-bar"}`}
              style={{ height: `${Math.max(4, Math.round((b.percent / max) * CHART_HEIGHT))}px` }}
            />
            <span aria-hidden="true" className={`text-[15px] font-extrabold ${b.highlighted ? "text-brand" : "text-text-secondary"}`}>
              {b.bucket}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-text-secondary">nights stayed</p>
    </div>
  );
}
