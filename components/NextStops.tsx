import Link from "next/link";
import type { Town } from "@/lib/towns.ts";
import { SectionHeading } from "./SectionHeading.tsx";

export type NextStop = { town: Town; answer: string | null; stopNumber: number };

function MiniScene() {
  return (
    <svg aria-hidden="true" viewBox="0 0 168 64" className="h-16 w-full" preserveAspectRatio="xMidYMax slice">
      <rect width="168" height="64" className="fill-brand-lime" />
      <circle cx="132" cy="20" r="10" className="fill-brand-sun" />
      <path d="M0 64 L0 42 L40 22 L82 46 L124 18 L168 44 L168 64Z" className="fill-brand-mid" />
    </svg>
  );
}

/** The next towns on the route as a sideways-scrolling row of cards, each with its own answer. */
export function NextStops({ stops }: { stops: NextStop[] }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading eyebrow="Keep going" title="Next on the loop" />
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {stops.map(({ town, answer, stopNumber }) => (
          <li key={town.slug} className="w-[168px] shrink-0 snap-start">
            <Link href={`/${town.slug}`} className="flex h-full min-h-11 flex-col overflow-hidden rounded-card bg-surface ring-1 ring-border hover:ring-brand-mid">
              <MiniScene />
              <span className="flex flex-col gap-2 p-4">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent">Stop {stopNumber}</span>
                <span className="flex flex-col">
                  <span className="text-[17px] font-extrabold leading-tight">{town.name}</span>
                  <span className="text-[13px] text-text-secondary">{town.country}</span>
                </span>
                <span className={answer ? "text-[22px] font-extrabold tracking-[-0.03em]" : "text-[13px] font-semibold text-text-secondary"}>
                  {answer ?? "Not enough stays yet"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
