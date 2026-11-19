import type { MonthStats } from "@/lib/stats.ts";
import { monthName } from "@/lib/labels.ts";

/** "When people went": 12 small bars, with the busiest months and every percentage as text. */
export function MonthChart({ stats }: { stats: MonthStats }) {
  const max = Math.max(...stats.months.map((m) => m.percent), 1);
  const busiest = new Set(stats.busiest);
  return (
    <section className="flex flex-col gap-3.5 rounded-card border border-border bg-surface px-[22px] py-5">
      <h2 className="font-display text-[19px] font-semibold">When people went</h2>
      <ul className="grid h-[88px] grid-cols-12 gap-1" aria-label="Share of stays by month">
        {stats.months.map((m) => (
          <li key={m.month} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="sr-only">
              {monthName(m.month)}: {m.percent}%
            </span>
            <div
              aria-hidden="true"
              className={`w-full rounded-t-[4px] ${busiest.has(m.month) ? "bg-accent" : "bg-bar"}`}
              style={{ height: `${Math.max(2, Math.round((m.percent / max) * 64))}px` }}
            />
            <span aria-hidden="true" className="text-[11px] font-semibold text-text-secondary">
              {monthName(m.month).slice(0, 1)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-text-secondary">
        Busiest: <span className="font-semibold text-ink">{stats.busiest.map(monthName).join(", ")}</span> · from{" "}
        {stats.n} stays that gave a month
      </p>
    </section>
  );
}
