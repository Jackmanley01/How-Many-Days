/** Editorial section heading: a small green eyebrow over a bold title, with an optional note on the right. */
export function SectionHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-ink/15 pt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">{title}</h2>
        {note && <span className="text-[13px] font-semibold text-text-secondary">{note}</span>}
      </div>
    </div>
  );
}
