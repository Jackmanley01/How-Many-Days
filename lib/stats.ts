// All the maths behind every number on the site (CLAUDE.md, "The maths").
// Pure functions only: pages display what these return and never calculate.

import type { Stay, Style } from "./data.ts";

export const MIN_STAYS_FOR_RANGE = 10;
export const MIN_STAYS_FOR_SINGLE = 30;
export const RECENCY_MONTHS = 24;
export const SKIP_SHOW_THRESHOLD = 0.1;

/** "single": one number (n >= 30). "early": a range labelled Early data (10-29). "none": not enough yet (< 10). */
export type Confidence = "single" | "early" | "none";

export const BUCKETS = ["1", "2", "3", "4", "5+"] as const;
export type Bucket = (typeof BUCKETS)[number];

export type NightRange = { low: number; high: number };

export type RegretShares = {
  /** % who picked "More nights". */
  longer: number;
  /** % who picked "About right". */
  right: number;
  /** % who picked "Fewer nights" or "Skip it". */
  shorter: number;
};

export type TownStats = {
  /** Eligible stays after any style filter. */
  n: number;
  confidence: Confidence;
  /** Days since the newest eligible stay was submitted, or null if there are none. */
  latestDaysAgo: number | null;
  /** The big number. Only when confidence is "single". */
  answer: number | null;
  /**
   * The middle half of stays (25th-75th percentile).
   * "early": this IS the answer ("2–4 nights"; low === high means show one number, still Early data).
   * "single": the "Most stayed" line under the answer.
   * "none": null.
   */
  range: NightRange | null;
  /** Whole-number percentages summing to 100. Null when confidence is "none". */
  regret: RegretShares | null;
  /** "X% would skip it": only when Skip it is at least 10% of n. */
  skipPercent: number | null;
  /** Chart bars, whole-number percentages summing to 100. Null when confidence is "none". */
  distribution: { bucket: Bucket; percent: number; highlighted: boolean }[] | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** The date 24 months before `now` (same calendar day, UTC). Stays on or after it count. */
export function recencyCutoff(now: Date): string {
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - RECENCY_MONTHS, now.getUTCDate()));
  return cutoff.toISOString().slice(0, 10);
}

/** Stays that count: last 24 months, 1-10 nights, a verdict. (Town matching is checked when data loads.) */
export function eligibleStays(stays: Stay[], now: Date): Stay[] {
  const cutoff = recencyCutoff(now);
  return stays.filter(
    (s) =>
      s.submittedAt.slice(0, 10) >= cutoff &&
      Number.isInteger(s.nightsStayed) &&
      s.nightsStayed >= 1 &&
      s.nightsStayed <= 10 &&
      Boolean(s.verdict),
  );
}

export function confidenceFor(n: number): Confidence {
  if (n >= MIN_STAYS_FOR_SINGLE) return "single";
  if (n >= MIN_STAYS_FOR_RANGE) return "early";
  return "none";
}

/**
 * Percentile with linear interpolation between ranks, the same method as
 * Google Sheets' PERCENTILE (and PERCENTILE.INC). p is 0-1.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) throw new Error("percentile of an empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const rank = p * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  return sorted[lower] + (rank - lower) * (sorted[upper] - sorted[lower]);
}

export function median(values: number[]): number {
  return percentile(values, 0.5);
}

/** Verdict counts: more / right / shorter (fewer + skip) / skip. */
function verdictCounts(stays: Stay[]) {
  let more = 0;
  let right = 0;
  let fewer = 0;
  let skip = 0;
  for (const s of stays) {
    if (s.verdict === "more") more++;
    else if (s.verdict === "right") right++;
    else if (s.verdict === "fewer") fewer++;
    else skip++;
  }
  return { more, right, shorter: fewer + skip, skip };
}

/**
 * The answer: the median of nights stayed. A median ending in .5 rounds
 * towards what people wished: up if more wanted longer than shorter, down if
 * fewer did, up on a tie.
 */
export function answerNights(stays: Stay[]): number {
  const m = median(stays.map((s) => s.nightsStayed));
  if (Number.isInteger(m)) return m;
  const { more, shorter } = verdictCounts(stays);
  return more >= shorter ? Math.ceil(m) : Math.floor(m);
}

/**
 * Round a value to the nearest whole night; exact halves go the way that
 * widens the range (bottom end down, top end up).
 */
function roundRangeEnd(value: number, end: "low" | "high"): number {
  const frac = value - Math.floor(value);
  if (frac === 0.5) return end === "low" ? Math.floor(value) : Math.ceil(value);
  return Math.round(value);
}

/** The middle half of stays: 25th to 75th percentile, each end rounded to a whole night. */
export function nightRange(stays: Stay[]): NightRange {
  const nights = stays.map((s) => s.nightsStayed);
  return {
    low: roundRangeEnd(percentile(nights, 0.25), "low"),
    high: roundRangeEnd(percentile(nights, 0.75), "high"),
  };
}

/**
 * Whole-number percentages that always sum to 100 (largest-remainder method).
 * Each share gets its rounded-down percentage; the points left over go to the
 * largest remainders. Equal remainders: the earlier item in the list wins.
 */
export function largestRemainder(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);
  const floors = counts.map((c) => Math.floor((c * 100) / total));
  const remainders = counts.map((c, i) => ({ i, r: (c * 100) % total }));
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  remainders.sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of remainders) {
    if (left === 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

export function regretShares(stays: Stay[]): RegretShares {
  const { more, right, shorter } = verdictCounts(stays);
  const [longer, aboutRight, wishedShorter] = largestRemainder([more, right, shorter]);
  return { longer, right: aboutRight, shorter: wishedShorter };
}

/** "X% would skip it", or null when Skip it is under 10% of stays. */
export function skipPercent(stays: Stay[]): number | null {
  if (stays.length === 0) return null;
  const { skip } = verdictCounts(stays);
  if (skip < SKIP_SHOW_THRESHOLD * stays.length) return null;
  return Math.round((skip * 100) / stays.length);
}

export function bucketFor(nights: number): Bucket {
  return nights >= 5 ? "5+" : (String(nights) as Bucket);
}

/** Chart bars: 1, 2, 3, 4, 5+ nights as percentages summing to 100. */
export function distribution(stays: Stay[], highlight: (bucket: Bucket) => boolean): NonNullable<TownStats["distribution"]> {
  const counts = BUCKETS.map((b) => stays.filter((s) => bucketFor(s.nightsStayed) === b).length);
  const percents = largestRemainder(counts);
  return BUCKETS.map((bucket, i) => ({ bucket, percent: percents[i], highlighted: highlight(bucket) }));
}

function bucketsInRange(range: NightRange): Set<Bucket> {
  const set = new Set<Bucket>();
  for (let n = range.low; n <= range.high; n++) set.add(bucketFor(n));
  return set;
}

export function latestDaysAgo(stays: Stay[], now: Date): number | null {
  if (stays.length === 0) return null;
  const today = utcDay(now.toISOString());
  const latest = Math.max(...stays.map((s) => utcDay(s.submittedAt)));
  return Math.max(0, Math.round((today - latest) / DAY_MS));
}

export type StatsOptions = {
  /** "Today": the build date. */
  now: Date;
  /** Answer filter: keep only stays tagged with this travel style. */
  style?: Style;
};

/** Everything a city page shows for one town, optionally filtered by travel style. */
export function townStats(allStays: Stay[], townSlug: string, { now, style }: StatsOptions): TownStats {
  let stays = eligibleStays(
    allStays.filter((s) => s.townSlug === townSlug),
    now,
  );
  if (style) stays = stays.filter((s) => s.styles.includes(style));

  const n = stays.length;
  const confidence = confidenceFor(n);
  const base = { n, confidence, latestDaysAgo: latestDaysAgo(stays, now) };

  if (confidence === "none") {
    return { ...base, answer: null, range: null, regret: null, skipPercent: null, distribution: null };
  }

  const range = nightRange(stays);
  const regret = regretShares(stays);
  const skip = skipPercent(stays);

  if (confidence === "early") {
    const inRange = bucketsInRange(range);
    return { ...base, answer: null, range, regret, skipPercent: skip, distribution: distribution(stays, (b) => inRange.has(b)) };
  }

  const answer = answerNights(stays);
  return {
    ...base,
    answer,
    range,
    regret,
    skipPercent: skip,
    distribution: distribution(stays, (b) => b === bucketFor(answer)),
  };
}

// ---------------------------------------------------------------------------
// "When people went" and reviews

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type MonthStats = {
  /** Stays that gave a month. */
  n: number;
  /** 12 entries, January first: whole percentages summing to 100. */
  months: { month: number; percent: number }[];
  /** Up to the 3 most common months, in season order (Nov, Dec, Jan, not Jan, Nov, Dec). Ties: earlier month wins. */
  busiest: number[];
};

/**
 * When people went, for one town (optionally style-filtered like the answer).
 * Null when fewer than 10 eligible stays gave a month: never guess.
 */
export function monthStats(allStays: Stay[], townSlug: string, { now, style }: StatsOptions): MonthStats | null {
  let stays = eligibleStays(
    allStays.filter((s) => s.townSlug === townSlug),
    now,
  );
  if (style) stays = stays.filter((s) => s.styles.includes(style));
  const withMonth = stays.filter((s) => s.month !== null);
  if (withMonth.length < MIN_STAYS_FOR_RANGE) return null;

  const counts = Array.from({ length: 12 }, (_, i) => withMonth.filter((s) => s.month === i + 1).length);
  const percents = largestRemainder(counts);
  const busiest = counts
    .map((count, i) => ({ count, month: i + 1 }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count || a.month - b.month)
    .slice(0, 3)
    .map((m) => m.month);

  return { n: withMonth.length, months: percents.map((percent, i) => ({ month: i + 1, percent })), busiest: seasonOrder(busiest) };
}

/**
 * Orders months round the year so a season that crosses New Year reads
 * naturally: start just after the biggest gap between the chosen months.
 */
export function seasonOrder(months: number[]): number[] {
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length < 2) return sorted;
  let start = 0;
  let biggestGap = -1;
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[(i - 1 + sorted.length) % sorted.length];
    const gap = (sorted[i] - prev + 12) % 12;
    if (gap > biggestGap) {
      biggestGap = gap;
      start = i;
    }
  }
  return [...sorted.slice(start), ...sorted.slice(0, start)];
}

/** Reviews: eligible stays for a town that left a tip, newest first. */
export function townReviews(allStays: Stay[], townSlug: string, now: Date): { reviews: Stay[]; totalStays: number } {
  const stays = eligibleStays(
    allStays.filter((s) => s.townSlug === townSlug),
    now,
  );
  const reviews = stays
    .filter((s) => s.tip !== null && s.tip !== "")
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : a.submittedAt > b.submittedAt ? -1 : a.id.localeCompare(b.id)));
  return { reviews, totalStays: stays.length };
}

// ---------------------------------------------------------------------------
// Answer filter: everything worked out ahead of time for every style, so the
// page only switches between ready-made results and never calculates.

export const STYLE_KEYS = ["party", "chill", "hiking", "budget", "food", "culture"] as const satisfies readonly Style[];
export type AnswerFilter = "all" | Style;

export function townStatsByStyle(allStays: Stay[], townSlug: string, now: Date): Record<AnswerFilter, TownStats> {
  const result = { all: townStats(allStays, townSlug, { now }) } as Record<AnswerFilter, TownStats>;
  for (const style of STYLE_KEYS) result[style] = townStats(allStays, townSlug, { now, style });
  return result;
}
