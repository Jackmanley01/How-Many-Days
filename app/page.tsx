import type { Metadata } from "next";
import { TownSearch, type TownSummary } from "@/components/TownSearch.tsx";
import { buildDate } from "@/lib/build-date.ts";
import { loadStays } from "@/lib/data.ts";
import { answerText } from "@/lib/labels.ts";
import { townStats } from "@/lib/stats.ts";
import { loadTowns } from "@/lib/towns.ts";

export const metadata: Metadata = {
  title: { absolute: "How Many Days: how many nights to spend in each town" },
  description:
    "Search a town on the Southeast Asia loop and see how many nights backpackers actually stayed, and how many wished they'd stayed longer.",
};

export default function Home() {
  const now = buildDate();
  const { stays, isSample } = loadStays();
  const towns: TownSummary[] = loadTowns().map((t, i) => {
    const stats = townStats(stays, t.slug, { now });
    return {
      slug: t.slug,
      name: t.name,
      country: t.country,
      aliases: t.aliases,
      stop: i + 1,
      answer: answerText(stats),
      earlyData: stats.confidence === "early",
      wishedLonger: stats.regret?.longer ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <TownSearch towns={towns} isSample={isSample} />
    </div>
  );
}
