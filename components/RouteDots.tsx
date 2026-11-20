/** One dot per stop on the loop, with this town ringed. Decorative: the "Stop N of 26" text says the same. */
export function RouteDots({ stop, total }: { stop: number; total: number }) {
  return (
    <div aria-hidden="true" className="relative flex max-w-[260px] flex-wrap items-center gap-[5px]">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <span
          key={n}
          className={
            n === stop
              ? "size-3.5 rounded-full border-[3px] border-ink bg-surface"
              : `size-2 rounded-full ${n < stop ? "bg-surface" : "bg-surface/45"}`
          }
        />
      ))}
    </div>
  );
}
