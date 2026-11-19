import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonthChart } from "@/components/MonthChart.tsx";
import { NextStops } from "@/components/NextStops.tsx";
import { TownAnswer } from "@/components/TownAnswer.tsx";
import { TownReviews } from "@/components/TownReviews.tsx";
import { buildDate } from "@/lib/build-date.ts";
import { loadStays } from "@/lib/data.ts";
import { nightsText, rangeText } from "@/lib/labels.ts";
import { monthStats, townReviews, townStats, townStatsByStyle, type TownStats } from "@/lib/stats.ts";
import { loadTowns, nextStops } from "@/lib/towns.ts";

// One page per launch-route town, built ahead of time. 'navigation' keeps the
// whole page static and makes an unknown town answer with a real 404
// (see notFound() below) instead of streaming a 200 first.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return loadTowns().map((t) => ({ town: t.slug }));
}

function findTown(slug: string) {
  return loadTowns().find((t) => t.slug === slug);
}

/** "4 nights" / "3–5 nights" / null: the answer in words, for titles and next stops. */
function answerWords(stats: TownStats): string | null {
  if (stats.confidence === "single" && stats.answer !== null) return nightsText(stats.answer);
  if (stats.confidence === "early" && stats.range) return rangeText(stats.range);
  return null;
}

export async function generateMetadata({ params }: PageProps<"/[town]">): Promise<Metadata> {
  const { town: slug } = await params;
  const town = findTown(slug);
  if (!town) return {};
  const stats = townStats(loadStays().stays, town.slug, { now: buildDate() });
  const answer = answerWords(stats);
  const title = answer
    ? `How many days in ${town.name}? ${answer}, from ${stats.n} backpackers`
    : `How many days in ${town.name}?`;
  const description = answer
    ? `Backpackers who logged a stay in ${town.name}, ${town.country} stayed ${answer}. ${stats.regret!.longer}% wished they'd stayed longer. From ${stats.n} real stays in the last 24 months.`
    : `Not enough stays logged in ${town.name}, ${town.country} yet to give an answer. How Many Days only shows a number once 10 backpackers have logged a stay.`;
  return { title: { absolute: `${title} | How Many Days` }, description };
}

export default async function TownPage({ params }: PageProps<"/[town]">) {
  const { town: slug } = await params;
  const town = findTown(slug);
  if (!town) notFound();

  const now = buildDate();
  const { stays } = loadStays();
  const towns = loadTowns();
  const answers = townStatsByStyle(stays, town.slug, now);
  const months = monthStats(stays, town.slug, { now });
  const { reviews, totalStays } = townReviews(stays, town.slug, now);
  const stops = nextStops(towns, town.slug).map((t) => ({
    town: t,
    answer: answerWords(townStats(stays, t.slug, { now })) ?? "Not enough stays yet",
  }));

  return (
    <div className="flex flex-col gap-5">
      <TownAnswer townName={town.name} country={town.country} answers={answers} />

      {months && <MonthChart stats={months} />}

      <TownReviews reviews={reviews} totalStays={totalStays} />

      <NextStops stops={stops} />
    </div>
  );
}
