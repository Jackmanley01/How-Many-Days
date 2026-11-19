import type { Stay, Verdict } from "@/lib/data.ts";
import { STYLE_LABEL, VERDICT_LABEL, monthName, nightsText } from "@/lib/labels.ts";

const VERDICT_TONE: Record<Verdict, string> = {
  more: "bg-accent-tint text-accent-text",
  right: "bg-brand-tint text-brand-text",
  fewer: "bg-[#F1F3F6] text-text-secondary",
  skip: "bg-[#F1F3F6] text-text-secondary",
};

/** Reviews: every card carries nights stayed, the verdict and the month; the tip is the text. */
export function ReviewList({ reviews }: { reviews: Stay[] }) {
  return (
    <div className="flex flex-col gap-3">
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
    </div>
  );
}
