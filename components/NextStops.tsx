import Link from "next/link";
import type { Town } from "@/lib/towns.ts";
import { SectionHeading } from "./SectionHeading.tsx";

export type NextStop = { town: Town; answer: string | null; stopNumber: number };

/** The next towns on the route as a sideways-scrolling row, each with its own answer. */
export function NextStops({ stops }: { stops: NextStop[] }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading eyebrow="Keep going" title="Next on the loop" />
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {stops.map(({ town, answer, stopNumber }) => (
          <li key={town.slug} className="w-[168px] shrink-0 snap-start">
            <Link href={`/${town.slug}`} className="flex h-full min-h-11 flex-col gap-3 rounded-card bg-surface p-4 hover:bg-chip">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Stop {stopNumber}</span>
              <span className="flex flex-col">
                <span className="text-[17px] font-bold leading-tight">{town.name}</span>
                <span className="text-[13px] text-text-secondary">{town.country}</span>
              </span>
              <span className={answer ? "text-[24px] font-bold tracking-[-0.02em]" : "text-[13px] font-semibold text-text-secondary"}>
                {answer ?? "Not enough stays yet"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
