/** Editorial section heading: a small green eyebrow over a bold title, with an optional note on the right. */
export function SectionHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-accent">{eyebrow}</p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.03em]">{title}</h2>
        {note && <span className="text-[13px] font-semibold text-text-secondary">{note}</span>}
      </div>
    </div>
  );
}
