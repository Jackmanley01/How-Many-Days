import type { Stay, Verdict } from "@/lib/data.ts";
import { STYLE_LABEL, VERDICT_LABEL, monthName } from "@/lib/labels.ts";

const VERDICT_TONE: Record<Verdict, string> = {
  more: "bg-accent-tint text-accent-text",
  right: "bg-brand-tint text-brand-text",
  fewer: "bg-chip text-text-secondary",
  skip: "bg-chip text-text-secondary",
};

/** Reviews as one list: big night count on the left, verdict, tip and month on the right. */
export function ReviewList({ reviews }: { reviews: Stay[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className="flex flex-col rounded-card bg-surface px-5">
      {reviews.map((r, i) => (
        <li key={r.id} className={`grid grid-cols-[56px_1fr] gap-4 py-5 ${i > 0 ? "border-t border-border" : ""}`}>
          <div className="flex flex-col">
            <span className="text-[34px] font-bold leading-none tracking-[-0.04em] text-accent">{r.nightsStayed >= 10 ? "10+" : r.nightsStayed}</span>
            <span className="text-[12px] font-semibold text-text-secondary">{r.nightsStayed === 1 ? "night" : "nights"}</span>
          </div>
          <article className="flex flex-col items-start gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${VERDICT_TONE[r.verdict]}`}>{VERDICT_LABEL[r.verdict]}</span>
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
