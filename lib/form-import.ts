// Turns the Google Sheet export of the stays form into normalised stays.
// Pure logic only (no files): scripts/import-form.ts does the reading and writing.

import { createHash } from "node:crypto";
import { parseCsv, toCsv } from "./csv.ts";
import { MAX_TIP_LENGTH, STAY_COLUMNS, type Stay, type Style, type TripLength, type Verdict } from "./data.ts";
import { makeTownMatcher, type Town } from "./towns.ts";

type Field = "timestamp" | "region" | "styles" | "tripLength" | "town" | "planned" | "stayed" | "verdict" | "month" | "tip" | "email";

// Form question titles (lower case, start of the header) -> field.
const HEADERS: [string, Field][] = [
  ["timestamp", "timestamp"],
  ["where was this trip", "region"],
  ["your travel style", "styles"],
  ["how long was the whole trip", "tripLength"],
  ["town", "town"],
  ["how many nights had you planned", "planned"],
  ["nights you actually stayed", "stayed"],
  ["looking back", "verdict"],
  ["month you were there", "month"],
  ["one tip", "tip"],
];

function fieldFor(header: string): Field | null {
  const h = header.trim().toLowerCase();
  if (h.includes("email")) return "email";
  for (const [start, field] of HEADERS) {
    if (h === start || h.startsWith(start + " ") || h.startsWith(start + "?") || h.startsWith(start + ",") || h.startsWith(start + "…")) {
      return field;
    }
  }
  return null;
}

const plain = (s: string) => s.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ");

const VERDICT_LABELS: Record<string, Verdict> = {
  "skip it": "skip",
  "fewer nights": "fewer",
  "about right": "right",
  "more nights": "more",
};

const STYLE_LABELS: Record<string, Style> = {
  party: "party",
  chill: "chill",
  "hiking & outdoors": "hiking",
  "hiking and outdoors": "hiking",
  hiking: "hiking",
  budget: "budget",
  food: "food",
  culture: "culture",
};

const TRIP_LABELS: Record<string, TripLength> = {
  "2-4 weeks": "2-4w",
  "1-3 months": "1-3m",
  "3+ months": "3m+",
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseNights(value: string): number | null {
  const v = plain(value);
  if (v === "10+") return 10;
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= 10 ? n : null;
}

function parseMonth(value: string): number | null {
  const v = plain(value);
  if (/^\d+$/.test(v)) {
    const n = Number(v);
    return n >= 1 && n <= 12 ? n : null;
  }
  const i = MONTHS.indexOf(v.slice(0, 3));
  return i === -1 ? null : i + 1;
}

export type DateOrder = "dmy" | "mdy";

/**
 * Google Sheets writes timestamps in the sheet's locale: "19/11/2026 14:03:22" (UK)
 * or "11/19/2026 14:03:22" (US). Work out which from the whole file.
 */
export function detectDateOrder(timestamps: string[]): { order: DateOrder; certain: boolean } {
  let dmy = false;
  let mdy = false;
  for (const t of timestamps) {
    const m = t.trim().match(/^(\d{1,2})\/(\d{1,2})\/\d{4}/);
    if (!m) continue;
    if (Number(m[1]) > 12) dmy = true;
    if (Number(m[2]) > 12) mdy = true;
  }
  if (dmy && mdy) throw new Error("Timestamps mix day/month and month/day order. Check the sheet's locale.");
  if (mdy) return { order: "mdy", certain: true };
  return { order: "dmy", certain: dmy };
}

export function parseTimestamp(value: string, order: DateOrder): string | null {
  const v = value.trim();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let y: number, m: number, d: number;
  if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else {
    const s = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!s) return null;
    const [a, b] = [Number(s[1]), Number(s[2])];
    y = Number(s[3]);
    [d, m] = order === "dmy" ? [a, b] : [b, a];
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

export type ImportReport = {
  submissions: number;
  imported: number;
  /** Town names that didn't match towns.json (Southeast Asia trips only), with counts. */
  unmatchedTowns: Map<string, number>;
  /** Stops from trips outside Southeast Asia, left out. */
  otherRegionStops: number;
  /** Stops missing nights stayed or verdict, or with a value we couldn't read. */
  incomplete: string[];
  /** Second and later stays in the same town within one submission, left out. */
  duplicateTowns: string[];
  /** Tips over 140 characters: the stay is kept, the tip is dropped. */
  droppedLongTips: string[];
  /** Travel styles we didn't recognise (ignored). */
  unknownStyles: Map<string, number>;
  /** Submissions whose timestamp couldn't be read (left out). */
  badTimestamps: string[];
  dateOrder: DateOrder;
  dateOrderCertain: boolean;
};

const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

export function importFormExport(csvText: string, towns: Town[]): { stays: Stay[]; report: ImportReport } {
  const [header, ...rows] = parseCsv(csvText);
  if (!header) throw new Error("form.csv is empty");

  // Map columns. Each "Town" column starts a new stop group; the stop
  // questions that follow belong to that group.
  const trip: Partial<Record<Field, number>> = {};
  const groups: Partial<Record<Field, number>>[] = [];
  header.forEach((h, col) => {
    const field = fieldFor(h);
    if (!field || field === "email") return; // email is never read
    if (field === "town") groups.push({ town: col });
    else if (["planned", "stayed", "verdict", "month", "tip"].includes(field)) {
      const g = groups[groups.length - 1];
      if (g && g[field] === undefined) g[field] = col;
    } else if (trip[field] === undefined) trip[field] = col;
  });
  if (trip.timestamp === undefined) throw new Error('form.csv has no "Timestamp" column');
  if (groups.length === 0) throw new Error('form.csv has no "Town" columns');
  for (const [i, g] of groups.entries()) {
    for (const f of ["stayed", "verdict"] as const) {
      if (g[f] === undefined) throw new Error(`form.csv stop ${i + 1} has no "${f === "stayed" ? "Nights you actually stayed" : "Looking back"}" column`);
    }
  }

  const emailCols = new Set(header.flatMap((h, i) => (fieldFor(h) === "email" ? [i] : [])));
  const matchTown = makeTownMatcher(towns);
  const { order, certain } = detectDateOrder(rows.map((r) => r[trip.timestamp!] ?? ""));
  const report: ImportReport = {
    submissions: 0,
    imported: 0,
    unmatchedTowns: new Map(),
    otherRegionStops: 0,
    incomplete: [],
    duplicateTowns: [],
    droppedLongTips: [],
    unknownStyles: new Map(),
    badTimestamps: [],
    dateOrder: order,
    dateOrderCertain: certain,
  };
  const stays: Stay[] = [];
  const cell = (row: string[], col: number | undefined) => (col === undefined ? "" : (row[col] ?? "").trim());

  for (const row of rows) {
    if (row.every((c) => c.trim() === "")) continue;
    report.submissions++;
    const rawTimestamp = cell(row, trip.timestamp);
    const submittedAt = parseTimestamp(rawTimestamp, order);
    if (!submittedAt) {
      report.badTimestamps.push(rawTimestamp || "(empty)");
      continue;
    }

    const region = plain(cell(row, trip.region));
    const inSoutheastAsia = region === "" || region === "southeast asia";

    const styles: Style[] = [];
    for (const label of cell(row, trip.styles).split(",").map(plain).filter(Boolean)) {
      const s = STYLE_LABELS[label];
      if (s) {
        if (!styles.includes(s)) styles.push(s);
      } else bump(report.unknownStyles, label);
    }
    const tripLength = TRIP_LABELS[plain(cell(row, trip.tripLength))] ?? null;

    // Submission identity for stable ids: every answer except the email.
    const submissionKey = row.filter((_, i) => !emailCols.has(i)).join("\u001f");
    const seenTowns = new Set<string>();

    groups.forEach((g, stopIndex) => {
      const townRaw = cell(row, g.town);
      const stop = `${rawTimestamp} stop ${stopIndex + 1}${townRaw ? ` (${townRaw})` : ""}`;
      const answers = [g.town, g.planned, g.stayed, g.verdict, g.month, g.tip].map((c) => cell(row, c));
      if (answers.every((a) => a === "")) return; // empty group: skipped silently

      if (!inSoutheastAsia) {
        report.otherRegionStops++;
        return;
      }
      if (!townRaw) {
        report.incomplete.push(`${stop}: no town`);
        return;
      }
      const townSlug = matchTown(townRaw);
      if (!townSlug) {
        bump(report.unmatchedTowns, townRaw);
        return;
      }

      const nightsStayed = parseNights(cell(row, g.stayed));
      const verdict = VERDICT_LABELS[plain(cell(row, g.verdict))];
      if (nightsStayed === null || !verdict) {
        report.incomplete.push(`${stop}: nights stayed "${cell(row, g.stayed)}", verdict "${cell(row, g.verdict)}"`);
        return;
      }
      if (seenTowns.has(townSlug)) {
        report.duplicateTowns.push(stop);
        return;
      }
      seenTowns.add(townSlug);

      const plannedRaw = plain(cell(row, g.planned));
      const nightsPlanned = plannedRaw === "" || plannedRaw.startsWith("hadn") ? null : parseNights(plannedRaw);
      const month = cell(row, g.month) === "" ? null : parseMonth(cell(row, g.month));

      let tip: string | null = cell(row, g.tip).replace(/\s+/g, " ") || null;
      if (tip && tip.length > MAX_TIP_LENGTH) {
        report.droppedLongTips.push(`${stop}: ${tip.length} characters`);
        tip = null;
      }

      const id = createHash("sha256").update(`${submissionKey}#${stopIndex}`).digest("hex").slice(0, 12);
      stays.push({ id, submittedAt, townSlug, nightsPlanned, nightsStayed, verdict, month, styles, tripLength, tip });
    });
  }

  report.imported = stays.length;
  return { stays, report };
}

export function staysToCsv(stays: Stay[]): string {
  return toCsv([
    [...STAY_COLUMNS],
    ...stays.map((s) => [
      s.id,
      s.submittedAt,
      s.townSlug,
      s.nightsPlanned === null ? "" : String(s.nightsPlanned),
      String(s.nightsStayed),
      s.verdict,
      s.month === null ? "" : String(s.month),
      s.styles.join(";"),
      s.tripLength ?? "",
      s.tip ?? "",
    ]),
  ]);
}

export function formatReport(r: ImportReport): string {
  const lines: string[] = [];
  const list = (title: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push("", `${title} (${items.length}):`, ...items.map((i) => `  - ${i}`));
  };
  lines.push(`Read ${r.submissions} submissions. Imported ${r.imported} stays.`);
  lines.push(
    `Dates read as ${r.dateOrder === "dmy" ? "day/month/year" : "month/day/year"}` +
      (r.dateOrderCertain ? "." : " (guessed: no date in the file proves it either way)."),
  );
  const unmatched = [...r.unmatchedTowns].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ×${c}`);
  list("Towns not in towns.json, left out. Add an alias in data/towns.json if one should count", unmatched);
  if (r.otherRegionStops > 0) lines.push("", `Left out ${r.otherRegionStops} stops from trips outside Southeast Asia.`);
  list("Stops left out because something was missing or unreadable", r.incomplete);
  list("Same town twice in one submission: kept the first, left these out", r.duplicateTowns);
  list("Tips over 140 characters: stay kept, tip dropped", r.droppedLongTips);
  list("Travel styles not recognised (ignored)", [...r.unknownStyles].map(([n, c]) => `${n} ×${c}`));
  list("Submissions with unreadable timestamps, left out", r.badTimestamps);
  return lines.join("\n");
}
