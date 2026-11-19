import type { TownStats } from "@/lib/stats.ts";
import { daysAgoText, rangeText, staysText } from "@/lib/labels.ts";

type Props = { townName: string; stats: TownStats };

/** The answer: big number (or range), the evidence line and the regret callout. */
export function AnswerCard({ townName, stats }: Props) {
  const { n, confidence, answer, range, regret, skipPercent, latestDaysAgo } = stats;
  const evidence = [n > 0 ? staysText(n) : null, latestDaysAgo !== null ? daysAgoText(latestDaysAgo) : null, "last 24 months"]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-label="The answer" className="flex flex-col gap-3 rounded-card border border-border bg-surface p-[22px]">
      {confidence === "none" ? (
        <>
          <p className="font-display text-[28px] font-bold leading-tight tracking-tight">Not enough stays yet.</p>
          <p className="text-[15px] leading-normal text-text-secondary">
            {n === 0
              ? `Nobody's logged ${townName} yet. Been? You're the first data point.`
              : `Only ${staysText(n)} so far. We show a number once 10 people have logged one.`}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-text-secondary">
              {confidence === "single" ? "Most people stay" : "People stayed"}
            </p>
            {confidence === "early" && (
              <span className="rounded-full bg-accent-tint px-2.5 py-1 text-xs font-semibold text-accent-text">Early data</span>
            )}
          </div>
          <BigNights stats={stats} />
          {confidence === "single" && range && (
            <p className="text-[15px] leading-snug text-text-secondary">Most stayed {rangeText(range)}</p>
          )}
        </>
      )}

      <p className="text-[13px] text-text-secondary">{evidence}</p>

      {regret && (
        <div className="flex flex-col gap-1 rounded-xl bg-accent-tint px-3.5 py-3">
          <p className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-accent">{regret.longer}%</span>
            <span className="text-sm leading-snug text-accent-text">wished they&rsquo;d stayed longer</span>
          </p>
          {skipPercent !== null && (
            <p className="text-sm text-accent-text">
              <span className="font-display font-bold">{skipPercent}%</span> would skip it
            </p>
          )}
        </div>
      )}
      {confidence === "single" && answer !== null && <span className="sr-only">Answer: {answer} nights.</span>}
    </section>
  );
}

function BigNights({ stats }: { stats: TownStats }) {
  const { answer, range, confidence } = stats;
  let number: string;
  let single: number;
  if (confidence === "single" && answer !== null) {
    number = answer >= 10 ? "10+" : String(answer);
    single = answer;
  } else if (range) {
    const high = range.high >= 10 ? "10+" : String(range.high);
    number = range.low === range.high ? high : `${range.low}–${high}`;
    single = range.low === range.high ? range.low : 2;
  } else {
    return null;
  }
  return (
    <p className="flex items-baseline gap-2.5">
      <span className="font-display text-[104px] font-bold leading-[0.9] tracking-[-0.04em]">{number}</span>
      <span className="font-display text-[32px] font-semibold">{single === 1 ? "night" : "nights"}</span>
    </p>
  );
}
