import type { Stay, Verdict } from "@/lib/data.ts";
import { STYLE_LABEL, VERDICT_LABEL, monthName, nightsText } from "@/lib/labels.ts";

const VERDICT_TONE: Record<Verdict, string> = {
  more: "bg-accent-tint text-accent-text",
  right: "bg-[#EEF2F6] text-[#334155]",
  fewer: "bg-[#F1F3F6] text-text-secondary",
  skip: "bg-[#F1F3F6] text-text-secondary",
};

/** Reviews: every card carries nights stayed, the verdict and the month; the tip is the text. */
export function ReviewList({ reviews, totalStays }: { reviews: Stay[]; totalStays: number }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[19px] font-semibold">What people said</h2>
      <p className="text-sm text-text-secondary">
        {reviews.length === 0
          ? "No tips yet."
          : `${reviews.length} of ${totalStays} ${totalStays === 1 ? "stay" : "stays"} left a tip.`}
      </p>
      {reviews.map((r) => (
        <article key={r.id} className="flex flex-col gap-2.5 rounded-review border border-border bg-surface p-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#F1F3F6] px-2.5 py-1 text-xs font-semibold">Stayed {nightsText(r.nightsStayed)}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_TONE[r.verdict]}`}>{VERDICT_LABEL[r.verdict]}</span>
          </div>
          <p className="text-[15px] leading-[1.45]">{r.tip}</p>
          <p className="text-[13px] text-text-secondary">
            {[r.month !== null ? monthName(r.month) : "Month not given", r.styles.map((s) => STYLE_LABEL[s]).join(", ")]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </article>
      ))}
    </section>
  );
}
