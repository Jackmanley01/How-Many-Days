import Link from "next/link";
import type { Town } from "@/lib/towns.ts";

export type NextStop = { town: Town; answer: string };

/** The next towns on the route, each with its own answer. */
export function NextStops({ stops }: { stops: NextStop[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[19px] font-semibold">Next on the loop</h2>
      <ul className="flex flex-col rounded-review border border-border bg-surface">
        {stops.map(({ town, answer }, i) => (
          <li key={town.slug} className={i > 0 ? "border-t border-border" : ""}>
            <Link href={`/${town.slug}`} className="flex min-h-11 items-center justify-between gap-3 px-4 py-3.5 hover:bg-background">
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-semibold">{town.name}</span>
                <span className="text-[13px] text-text-secondary">{town.country}</span>
              </span>
              <span className={`text-right font-display text-[15px] font-semibold ${answer.startsWith("Not") ? "text-text-secondary" : ""}`}>
                {answer}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
