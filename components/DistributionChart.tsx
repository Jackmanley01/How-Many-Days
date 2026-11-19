import type { TownStats } from "@/lib/stats.ts";

type Props = { distribution: NonNullable<TownStats["distribution"]>; scope: string };

const CHART_HEIGHT = 150;

/** "How long people stayed": 1, 2, 3, 4, 5+ nights. Percentages are visible text. */
export function DistributionChart({ distribution, scope }: Props) {
  const max = Math.max(...distribution.map((b) => b.percent), 1);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="whitespace-nowrap font-display text-[19px] font-semibold">How long people stayed</h2>
        <span className="text-xs font-semibold text-text-secondary">{scope}</span>
      </div>
      <ul className="grid h-[200px] grid-cols-5 gap-2.5" aria-label="Share of stays by nights">
        {distribution.map((b) => (
          <li key={b.bucket} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className={`text-xs font-semibold ${b.highlighted ? "text-accent" : "text-text-secondary"}`}>
              {b.percent}%<span className="sr-only"> stayed {b.bucket} {b.bucket === "1" ? "night" : "nights"}</span>
            </span>
            <div
              aria-hidden="true"
              className={`w-full rounded-t-lg rounded-b-sm ${b.highlighted ? "bg-accent" : "bg-bar"}`}
              style={{ height: `${Math.round((b.percent / max) * CHART_HEIGHT)}px` }}
            />
            <span aria-hidden="true" className={`font-display text-[15px] font-semibold ${b.highlighted ? "text-accent" : "text-text-secondary"}`}>
              {b.bucket}
            </span>
          </li>
        ))}
      </ul>
      <p className="-mt-1.5 text-center text-xs text-text-secondary">nights stayed</p>
    </div>
  );
}
