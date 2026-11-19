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
