import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseStays } from "./data.ts";
import { detectDateOrder, formatReport, importFormExport, parseTimestamp, staysToCsv } from "./form-import.ts";
import { loadTowns } from "./towns.ts";

const towns = loadTowns();
const slugs = new Set(towns.map((t) => t.slug));
// Made-up export with the real form's questions (see data/sample/form-export.csv).
const fixture = readFileSync("data/sample/form-export.csv", "utf8");

describe("importFormExport on the sample form export", () => {
  const { stays, report } = importFormExport(fixture, towns);

  it("imports the four usable stops", () => {
    expect(stays.map((s) => s.townSlug)).toEqual(["pai", "ho-chi-minh-city", "hoi-an", "cat-ba"]);
    expect(report.submissions).toBe(5);
    expect(report.imported).toBe(4);
  });

  it("converts form answers into data", () => {
    const [pai, saigon, hoiAn, catBa] = stays;
    expect(pai).toMatchObject({
      submittedAt: "2026-11-19",
      nightsPlanned: 2,
      nightsStayed: 5,
      verdict: "more",
      month: 12,
      styles: ["hiking", "chill"],
      tripLength: "1-3m",
      tip: "Rent a scooter, carefully.",
    });
    expect(saigon).toMatchObject({ nightsPlanned: null, nightsStayed: 10, verdict: "right", month: 1, tip: null });
    expect(hoiAn).toMatchObject({ verdict: "fewer", month: null });
    expect(catBa).toMatchObject({ submittedAt: "2026-10-03", verdict: "skip", styles: ["party", "budget"], tripLength: "2-4w" });
  });

  it("never carries the email anywhere", () => {
    expect(JSON.stringify(stays)).not.toContain("@");
    expect(staysToCsv(stays)).not.toContain("example.com");
  });

  it("reports unmatched towns with counts and leaves them out", () => {
    expect([...report.unmatchedTowns]).toEqual([["Pai Canyon", 1]]);
  });

  it("keeps one stay per town per submission (Ha Long Bay and Cat Ba are the same town)", () => {
    expect(report.duplicateTowns).toEqual(["03/10/2026 09:15:00 stop 3 (Cat Ba)"]);
  });

  it("keeps the stay but drops a tip over 140 characters", () => {
    expect(stays[3].tip).toBeNull();
    expect(report.droppedLongTips).toHaveLength(1);
  });

  it("leaves out other regions, incomplete stops and unreadable timestamps", () => {
    expect(report.otherRegionStops).toBe(1);
    expect(report.incomplete).toHaveLength(1);
    expect(report.badTimestamps).toEqual(["not a date"]);
    expect([...report.unknownStyles]).toEqual([["snorkelling", 1]]);
  });

  it("gives stable ids: importing twice gives the same ids", () => {
    const again = importFormExport(fixture, towns).stays.map((s) => s.id);
    expect(again).toEqual(stays.map((s) => s.id));
    expect(new Set(again).size).toBe(again.length);
  });

  it("writes a stays.csv that the website's validator accepts", () => {
    expect(parseStays(staysToCsv(stays), slugs)).toEqual(stays);
  });

  it("prints a readable report", () => {
    const text = formatReport(report);
    expect(text).toContain("Imported 4 stays");
    expect(text).toContain("Pai Canyon ×1");
  });
});

describe("timestamps", () => {
  it("detects day/month order from a day above 12", () => {
    expect(detectDateOrder(["03/10/2026 09:00:00", "19/11/2026 14:03:22"])).toEqual({ order: "dmy", certain: true });
  });

  it("detects month/day order", () => {
    expect(detectDateOrder(["11/19/2026 14:03:22"])).toEqual({ order: "mdy", certain: true });
  });

  it("guesses day/month and says so when nothing proves it", () => {
    expect(detectDateOrder(["03/10/2026 09:00:00"])).toEqual({ order: "dmy", certain: false });
  });

  it("refuses a file that mixes both orders", () => {
    expect(() => detectDateOrder(["19/11/2026", "11/19/2026"])).toThrow(/mix/);
  });

  it("parses each format to an ISO date", () => {
    expect(parseTimestamp("19/11/2026 14:03:22", "dmy")).toBe("2026-11-19");
    expect(parseTimestamp("11/19/2026 14:03:22", "mdy")).toBe("2026-11-19");
    expect(parseTimestamp("2026-11-19T14:03:22Z", "dmy")).toBe("2026-11-19");
    expect(parseTimestamp("31/02/2026", "dmy")).toBeNull();
    expect(parseTimestamp("not a date", "dmy")).toBeNull();
  });
});

describe("form layout problems", () => {
  it("refuses an export with no Town columns", () => {
    expect(() => importFormExport("Timestamp,Email\n19/11/2026,x\n", towns)).toThrow(/no "Town" columns/);
  });

  it("refuses an export with no Timestamp column", () => {
    expect(() => importFormExport("Town,Nights you actually stayed,Looking back\nPai,2,About right\n", towns)).toThrow(/Timestamp/);
  });

  it("skips empty stop groups silently", () => {
    const csv = "Timestamp,Town,Nights you actually stayed,Looking back,Town,Nights you actually stayed,Looking back\n19/11/2026,Pai,3,More nights,,,\n";
    const { stays, report } = importFormExport(csv, towns);
    expect(stays).toHaveLength(1);
    expect(report.incomplete).toEqual([]);
  });
});
