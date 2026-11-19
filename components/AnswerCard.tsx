import type { TownStats } from "@/lib/stats.ts";
import { capitalise, daysAgoText, rangeText, staysText } from "@/lib/labels.ts";
import { RangeRuler } from "./RangeRuler.tsx";

type Props = {
  townName: string;
  stats: TownStats;
  /** The answer filter's group, e.g. "chill travellers"; null for all travellers. */
  people?: string | null;
};

/** The hero: big number (or range) on a 1-10+ ruler, the evidence line, and the regret strip. */
export function AnswerCard({ townName, stats, people = null }: Props) {
  const { n, confidence, answer, range, regret, skipPercent, latestDaysAgo } = stats;
  const evidence = [n > 0 ? staysText(n) : null, latestDaysAgo !== null ? daysAgoText(latestDaysAgo) : null, "last 24 months"]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-label="The answer" className="overflow-hidden rounded-hero bg-surface">
      <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
        {confidence === "none" ? (
          <>
            <p className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">
              {people ? `Not enough ${people} yet.` : "Not enough stays yet."}
            </p>
            <p className="text-[15px] leading-normal text-text-secondary">
              {people
                ? n === 0
                  ? `No ${people} have logged ${townName} yet. Try all travellers.`
                  : `Only ${n} ${people} have logged ${townName}. We show a number once 10 have.`
                : n === 0
                  ? `Nobody's logged ${townName} yet. Been? You're the first data point.`
                  : `Only ${staysText(n)} so far. We show a number once 10 people have logged one.`}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                {confidence === "single" ? `Most ${people ?? "people"} stay` : `${people ? capitalise(people) : "People"} stayed`}
              </p>
              {confidence === "early" && (
                <span className="rounded-full bg-accent-tint px-2.5 py-1 text-xs font-bold text-accent-text">Early data</span>
              )}
            </div>
            <BigNights stats={stats} />
            {range && <RangeRuler range={range} answer={confidence === "single" ? answer : null} />}
            {confidence === "single" && range && <p className="text-[15px] font-semibold">Most stayed {rangeText(range)}</p>}
          </>
        )}
        <p className="text-[13px] text-text-secondary">{evidence}</p>
      </div>

      {regret && (
        <div className="mx-3 mb-3 flex flex-col gap-1 rounded-[20px] bg-more-tint px-5 py-4">
          <p className="flex items-center gap-4">
            <span className="text-[44px] font-bold leading-none tracking-[-0.03em] text-brand">{regret.longer}%</span>
            <span className="text-[15px] font-medium leading-snug text-more-text">wished they&rsquo;d stayed longer</span>
          </p>
          {skipPercent !== null && (
            <p className="text-sm text-fewer-text">
              <span className="font-bold">{skipPercent}%</span> would skip it
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
  let plural = true;
  if (confidence === "single" && answer !== null) {
    number = answer >= 10 ? "10+" : String(answer);
    plural = answer !== 1;
  } else if (range) {
    const high = range.high >= 10 ? "10+" : String(range.high);
    number = range.low === range.high ? high : `${range.low}–${high}`;
    plural = !(range.low === range.high && range.low === 1);
  } else {
    return null;
  }
  return (
    <p className="flex items-end gap-3">
      <span className={`font-bold leading-[0.82] tracking-[-0.06em] ${number.length > 2 ? "text-[112px]" : "text-[148px]"}`}>{number}</span>
      <span className="pb-2 text-[30px] font-bold leading-none tracking-[-0.02em]">{plural ? "nights" : "night"}</span>
    </p>
  );
}
