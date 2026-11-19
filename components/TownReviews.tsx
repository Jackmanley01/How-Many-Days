"use client";

import { useState } from "react";
import type { Stay, Style } from "@/lib/data.ts";
import { STYLE_LABEL, STYLE_PEOPLE } from "@/lib/labels.ts";
import { STYLE_KEYS } from "@/lib/stats.ts";
import { ReviewList } from "./ReviewList.tsx";
import { StylePills } from "./StylePills.tsx";

type ReviewFilter = "all" | Style;

/** Reviews with their own style pills. This filter changes only which reviews show (product rule 7). */
export function TownReviews({ reviews, totalStays }: { reviews: Stay[]; totalStays: number }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");

  // Only offer styles that have at least one tip, so no pill leads to an empty list.
  const styles = STYLE_KEYS.filter((s) => reviews.some((r) => r.styles.includes(s)));
  const shown = filter === "all" ? reviews : reviews.filter((r) => r.styles.includes(filter));

  let countLine: string;
  if (reviews.length === 0) countLine = "No tips yet.";
  else if (filter === "all") countLine = `${reviews.length} of ${totalStays} ${totalStays === 1 ? "stay" : "stays"} left a tip.`;
  else countLine = `${shown.length} ${shown.length === 1 ? "tip" : "tips"} from ${STYLE_PEOPLE[filter]}.`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[19px] font-semibold">What people said</h2>
      {styles.length > 0 && (
        <StylePills
          label="Filter reviews by travel style"
          selected={filter}
          onSelect={setFilter}
          options={[{ value: "all" as ReviewFilter, label: "All" }, ...styles.map((s) => ({ value: s as ReviewFilter, label: STYLE_LABEL[s] }))]}
        />
      )}
      <p className="text-sm text-text-secondary" aria-live="polite">
        {countLine}
      </p>
      <ReviewList reviews={shown} />
    </section>
  );
}
