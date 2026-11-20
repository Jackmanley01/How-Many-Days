import Link from "next/link";

/** Logo and the "Sample data" badge, sitting on the lime page header. */
export function SiteHeader({ isSample }: { isSample: boolean }) {
  return (
    <div className="relative flex items-center justify-between gap-3">
      <Link href="/" className="flex min-h-11 items-center text-[18px] font-extrabold tracking-[-0.03em] text-ink">
        howmanydays
      </Link>
      {isSample && <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-ink">Sample data</span>}
    </div>
  );
}
