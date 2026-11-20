// Words shown on the site for data values. No maths here: that's lib/stats.ts.

import type { Style, Verdict } from "./data.ts";
import { MONTH_SHORT, type NightRange } from "./stats.ts";

export const VERDICT_LABEL: Record<Verdict, string> = {
  skip: "Skip it",
  fewer: "Fewer nights",
  right: "About right",
  more: "More nights",
};

export const STYLE_LABEL: Record<Style, string> = {
  party: "Party",
  chill: "Chill",
  hiking: "Hiking",
  budget: "Budget",
  food: "Food",
  culture: "Culture",
};

/** 10 is stored for "10+". */
export function nightsText(n: number): string {
  if (n >= 10) return "10+ nights";
  return n === 1 ? "1 night" : `${n} nights`;
}

export function rangeText(range: NightRange): string {
  if (range.low === range.high) return nightsText(range.low);
  const high = range.high >= 10 ? "10+" : String(range.high);
  return `${range.low}–${high} nights`;
}

export function monthName(month: number): string {
  return MONTH_SHORT[month - 1];
}

export function staysText(n: number): string {
  return n === 1 ? "1 stay" : `${n} stays`;
}

export function daysAgoText(days: number): string {
  if (days === 0) return "latest today";
  if (days === 1) return "latest yesterday";
  return `latest ${days} days ago`;
}

/** How a filtered group of travellers is named: "Not enough chill travellers yet". */
export const STYLE_PEOPLE: Record<Style, string> = {
  party: "party travellers",
  chill: "chill travellers",
  hiking: "hikers",
  budget: "budget travellers",
  food: "food lovers",
  culture: "culture lovers",
};

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "4 nights" / "3–5 nights" / null: a town's answer in words, for titles, lists and next stops. */
export function answerText(stats: { confidence: "single" | "early" | "none"; answer: number | null; range: NightRange | null }): string | null {
  if (stats.confidence === "single" && stats.answer !== null) return nightsText(stats.answer);
  if (stats.confidence === "early" && stats.range) return rangeText(stats.range);
  return null;
}
