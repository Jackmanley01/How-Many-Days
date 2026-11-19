import type { RegretShares } from "@/lib/stats.ts";

/** "Looking back": fewer / about right / more, as one bar plus visible percentages. */
export function RegretBar({ regret }: { regret: RegretShares }) {
  const parts = [
    { key: "shorter", label: "Fewer nights", percent: regret.shorter, bar: "bg-bar", text: "text-text-secondary" },
    { key: "right", label: "About right", percent: regret.right, bar: "bg-brand", text: "text-brand" },
    { key: "longer", label: "More nights", percent: regret.longer, bar: "bg-accent", text: "text-accent" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[15px] font-semibold">Looking back, they&rsquo;d have stayed…</h3>
      <div aria-hidden="true" className="flex h-3.5 gap-[3px] overflow-hidden rounded-full">
        {parts
          .filter((p) => p.percent > 0)
          .map((p) => (
            <div key={p.key} className={p.bar} style={{ flex: `${p.percent} 1 0px` }} />
          ))}
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.key} className="flex flex-col-reverse">
            <dt className="mt-0.5 text-[13px] text-text-secondary">{p.label}</dt>
            <dd className={`font-display text-[22px] font-bold ${p.text}`}>{p.percent}%</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
