import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./csv.ts";
import { loadTowns } from "./towns.ts";

export const VERDICTS = ["skip", "fewer", "right", "more"] as const;
export const STYLES = ["party", "chill", "hiking", "budget", "food", "culture"] as const;
export const TRIP_LENGTHS = ["2-4w", "1-3m", "3m+"] as const;
export const MAX_TIP_LENGTH = 140;

export type Verdict = (typeof VERDICTS)[number];
export type Style = (typeof STYLES)[number];
export type TripLength = (typeof TRIP_LENGTHS)[number];

/** One stay, as described in CLAUDE.md ("Stay (normalised)"). */
export type Stay = {
  id: string;
  submittedAt: string; // ISO date, YYYY-MM-DD
  townSlug: string;
  nightsPlanned: number | null; // null = "Hadn't planned"
  nightsStayed: number; // 1-10, 10 means "10+"
  verdict: Verdict;
  month: number | null; // 1-12
  styles: Style[];
  tripLength: TripLength | null; // null = left blank on the form
  tip: string | null;
};

export const STAY_COLUMNS = [
  "id",
  "submittedAt",
  "townSlug",
  "nightsPlanned",
  "nightsStayed",
  "verdict",
  "month",
  "styles",
  "tripLength",
  "tip",
] as const;

function wholeNumber(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Turns one CSV row into a Stay, or returns the list of problems with it. */
export function validateStay(
  row: Record<string, string>,
  townSlugs: Set<string>,
): { stay: Stay } | { problems: string[] } {
  const problems: string[] = [];

  const id = row.id.trim();
  if (!id) problems.push("id is empty");

  const submittedAt = row.submittedAt.trim();
  if (!isIsoDate(submittedAt)) problems.push(`submittedAt "${row.submittedAt}" is not a YYYY-MM-DD date`);

  const townSlug = row.townSlug.trim();
  if (!townSlugs.has(townSlug)) problems.push(`townSlug "${row.townSlug}" is not in data/towns.json`);

  let nightsPlanned: number | null = null;
  if (row.nightsPlanned.trim() !== "") {
    nightsPlanned = wholeNumber(row.nightsPlanned.trim(), 1, 10);
    if (nightsPlanned === null) problems.push(`nightsPlanned "${row.nightsPlanned}" must be a whole number 1-10 or empty`);
  }

  const nightsStayed = wholeNumber(row.nightsStayed.trim(), 1, 10);
  if (nightsStayed === null) problems.push(`nightsStayed "${row.nightsStayed}" must be a whole number 1-10`);

  const verdict = row.verdict.trim() as Verdict;
  if (!VERDICTS.includes(verdict)) problems.push(`verdict "${row.verdict}" must be one of ${VERDICTS.join(", ")}`);

  let month: number | null = null;
  if (row.month.trim() !== "") {
    month = wholeNumber(row.month.trim(), 1, 12);
    if (month === null) problems.push(`month "${row.month}" must be a whole number 1-12 or empty`);
  }

  const styles = row.styles
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean) as Style[];
  for (const s of styles) {
    if (!STYLES.includes(s)) problems.push(`style "${s}" must be one of ${STYLES.join(", ")}`);
  }

  let tripLength: TripLength | null = null;
  if (row.tripLength.trim() !== "") {
    tripLength = row.tripLength.trim() as TripLength;
    if (!TRIP_LENGTHS.includes(tripLength)) problems.push(`tripLength "${row.tripLength}" must be one of ${TRIP_LENGTHS.join(", ")} or empty`);
  }

  const tipText = row.tip.trim();
  if (tipText.length > MAX_TIP_LENGTH) problems.push(`tip is ${tipText.length} characters (max ${MAX_TIP_LENGTH})`);

  if (problems.length > 0) return { problems };
  return {
    stay: {
      id,
      submittedAt,
      townSlug,
      nightsPlanned,
      nightsStayed: nightsStayed as number,
      verdict,
      month,
      styles,
      tripLength,
      tip: tipText === "" ? null : tipText,
    },
  };
}

/**
 * Reads a stays CSV. Throws one error listing every bad row, so a broken
 * file stops the build instead of quietly reaching the website.
 */
export function parseStays(text: string, townSlugs: Set<string>, fileLabel = "stays.csv"): Stay[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const expected = STAY_COLUMNS.join(",");
  if (header.map((h) => h.trim()).join(",") !== expected) {
    throw new Error(`${fileLabel}: header must be exactly\n  ${expected}\nbut is\n  ${header.join(",")}`);
  }

  const stays: Stay[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  rows.forEach((cells, index) => {
    const line = index + 2; // header is line 1
    if (cells.length !== STAY_COLUMNS.length) {
      errors.push(`line ${line}: has ${cells.length} columns, expected ${STAY_COLUMNS.length}`);
      return;
    }
    const row = Object.fromEntries(STAY_COLUMNS.map((c, i) => [c, cells[i]]));
    const result = validateStay(row, townSlugs);
    if ("problems" in result) {
      for (const p of result.problems) errors.push(`line ${line}: ${p}`);
      return;
    }
    if (seenIds.has(result.stay.id)) {
      errors.push(`line ${line}: id "${result.stay.id}" appears twice`);
      return;
    }
    seenIds.add(result.stay.id);
    stays.push(result.stay);
  });

  if (errors.length > 0) {
    throw new Error(`${fileLabel} has ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  }
  return stays;
}

export type StayData = {
  stays: Stay[];
  /** true when the site is running on made-up data/sample/ stays: pages must show the "Sample data" badge. */
  isSample: boolean;
};

/**
 * Loads the stays the site is built from: data/stays.csv once it has rows,
 * otherwise the labelled sample in data/sample/stays.csv.
 */
export function loadStays(root: string = process.cwd()): StayData {
  const slugs = new Set(loadTowns(root).map((t) => t.slug));
  const realPath = join(root, "data", "stays.csv");
  if (existsSync(realPath)) {
    const stays = parseStays(readFileSync(realPath, "utf8"), slugs, "data/stays.csv");
    if (stays.length > 0) return { stays, isSample: false };
  }
  const samplePath = join(root, "data", "sample", "stays.csv");
  return {
    stays: parseStays(readFileSync(samplePath, "utf8"), slugs, "data/sample/stays.csv"),
    isSample: true,
  };
}
