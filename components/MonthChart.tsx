import type { MonthStats } from "@/lib/stats.ts";
import { monthName } from "@/lib/labels.ts";
import { SectionHeading } from "./SectionHeading.tsx";

/** "When people went": 12 small bars, with the busiest months and every percentage as text. */
export function MonthChart({ stats }: { stats: MonthStats }) {
  const max = Math.max(...stats.months.map((m) => m.percent), 1);
  const busiest = new Set(stats.busiest);
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading eyebrow="Timing" title="When people went" />
      <div className="flex flex-col gap-3 rounded-card bg-surface px-5 py-5">
        <p className="text-[15px]">
          Busiest <span className="font-extrabold">{stats.busiest.map(monthName).join(", ")}</span>
        </p>
        <ul className="grid h-[84px] grid-cols-12 gap-1" aria-label="Share of stays by month">
          {stats.months.map((m) => (
            <li key={m.month} className="flex h-full flex-col items-center justify-end gap-1">
              <span className="sr-only">
                {monthName(m.month)}: {m.percent}%
              </span>
              <div
                aria-hidden="true"
                className={`w-full rounded-[4px] ${busiest.has(m.month) ? "bg-brand-mid" : "bg-bar"}`}
                style={{ height: `${Math.max(3, Math.round((m.percent / max) * 60))}px` }}
              />
              <span aria-hidden="true" className={`text-[11px] font-bold ${busiest.has(m.month) ? "text-brand" : "text-text-secondary"}`}>
                {monthName(m.month).slice(0, 1)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-text-secondary">From {stats.n} stays that gave a month</p>
      </div>
    </section>
  );
}
