import type { Stay, Verdict } from "@/lib/data.ts";
import { STYLE_LABEL, VERDICT_LABEL, monthName } from "@/lib/labels.ts";

const VERDICT_TONE: Record<Verdict, string> = {
  more: "bg-more-tint text-more-text",
  right: "bg-about-tint text-about-text",
  fewer: "bg-fewer-tint text-fewer-text",
  skip: "bg-fewer-tint text-fewer-text",
};

/** Reviews as one list: a night-count tile on the left, verdict, tip and month on the right. */
export function ReviewList({ reviews }: { reviews: Stay[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className="flex flex-col rounded-card bg-surface px-5 ring-1 ring-border">
      {reviews.map((r, i) => (
        <li key={r.id} className={`flex gap-4 py-5 ${i > 0 ? "border-t-2 border-dashed border-border" : ""}`}>
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent-tint leading-none">
            <span className="text-[24px] font-extrabold tracking-[-0.04em] text-accent-text">{r.nightsStayed >= 10 ? "10+" : r.nightsStayed}</span>
            <span className="mt-0.5 text-[10px] font-bold text-accent-text">{r.nightsStayed === 1 ? "night" : "nights"}</span>
          </div>
          <article className="flex flex-col items-start gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${VERDICT_TONE[r.verdict]}`}>{VERDICT_LABEL[r.verdict]}</span>
            <p className="text-[16px] leading-[1.45]">{r.tip}</p>
            <p className="text-[13px] text-text-secondary">
              {[r.month !== null ? monthName(r.month) : "Month not given", r.styles.map((s) => STYLE_LABEL[s]).join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
