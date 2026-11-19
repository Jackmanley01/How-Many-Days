import { mkdirSync, mkdtempSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadStays, parseStays, STAY_COLUMNS } from "./data.ts";

const slugs = new Set(["pai", "hoi-an"]);
const HEADER = STAY_COLUMNS.join(",");
const good = "s1,2026-03-01,pai,2,3,more,2,chill;hiking,1-3m,Go early";

describe("parseStays", () => {
  it("reads a valid row into a Stay", () => {
    expect(parseStays(`${HEADER}\n${good}\n`, slugs)).toEqual([
      {
        id: "s1",
        submittedAt: "2026-03-01",
        townSlug: "pai",
        nightsPlanned: 2,
        nightsStayed: 3,
        verdict: "more",
        month: 2,
        styles: ["chill", "hiking"],
        tripLength: "1-3m",
        tip: "Go early",
      },
    ]);
  });

  it("turns empty optional fields into null or an empty list", () => {
    const [s] = parseStays(`${HEADER}\ns2,2026-03-01,pai,,10,skip,,,,\n`, slugs);
    expect(s).toMatchObject({ nightsPlanned: null, nightsStayed: 10, month: null, styles: [], tripLength: null, tip: null });
  });

  it("returns no stays for an empty file or a header only", () => {
    expect(parseStays("", slugs)).toEqual([]);
    expect(parseStays(`${HEADER}\n`, slugs)).toEqual([]);
  });

  it.each([
    ["nightsStayed 0", "s,2026-03-01,pai,2,0,more,2,chill,1-3m,", /nightsStayed "0"/],
    ["nightsStayed 11", "s,2026-03-01,pai,2,11,more,2,chill,1-3m,", /nightsStayed "11"/],
    ["decimal nights", "s,2026-03-01,pai,2,2.5,more,2,chill,1-3m,", /nightsStayed "2.5"/],
    ["decimal planned", "s,2026-03-01,pai,1.5,2,more,2,chill,1-3m,", /nightsPlanned "1.5"/],
    ["unknown verdict", "s,2026-03-01,pai,2,3,4 stars,2,chill,1-3m,", /verdict "4 stars"/],
    ["month 13", "s,2026-03-01,pai,2,3,more,13,chill,1-3m,", /month "13"/],
    ["unknown style", "s,2026-03-01,pai,2,3,more,2,surfing,1-3m,", /style "surfing"/],
    ["unknown trip length", "s,2026-03-01,pai,2,3,more,2,chill,1 year,", /tripLength "1 year"/],
    ["unknown town", "s,2026-03-01,bali,2,3,more,2,chill,1-3m,", /townSlug "bali"/],
    ["bad date", "s,2026-02-30,pai,2,3,more,2,chill,1-3m,", /submittedAt "2026-02-30"/],
    ["missing id", ",2026-03-01,pai,2,3,more,2,chill,1-3m,", /id is empty/],
    ["long tip", `s,2026-03-01,pai,2,3,more,2,chill,1-3m,${"x".repeat(141)}`, /tip is 141 characters/],
    ["wrong column count", "s,2026-03-01,pai", /has 3 columns/],
  ])("rejects %s, naming the line", (_label, row, message) => {
    expect(() => parseStays(`${HEADER}\n${good}\n${row}\n`, slugs)).toThrow(message);
    expect(() => parseStays(`${HEADER}\n${good}\n${row}\n`, slugs)).toThrow(/line 3/);
  });

  it("accepts a tip of exactly 140 characters", () => {
    const row = `s,2026-03-01,pai,2,3,more,2,chill,1-3m,${"x".repeat(140)}`;
    expect(parseStays(`${HEADER}\n${row}\n`, slugs)).toHaveLength(1);
  });

  it("rejects duplicate ids", () => {
    expect(() => parseStays(`${HEADER}\n${good}\n${good}\n`, slugs)).toThrow(/id "s1" appears twice/);
  });

  it("rejects a wrong header", () => {
    expect(() => parseStays(`id,town\n${good}\n`, slugs)).toThrow(/header must be exactly/);
  });

  it("lists every problem at once", () => {
    const bad = "s,2026-03-01,bali,2,0,meh,2,chill,1-3m,";
    expect(() => parseStays(`${HEADER}\n${bad}\n`, slugs)).toThrow(/3 problem/);
  });
});

describe("loadStays", () => {
  function fakeRoot(realStays?: string) {
    const root = mkdtempSync(join(tmpdir(), "hmd-"));
    mkdirSync(join(root, "data", "sample"), { recursive: true });
    copyFileSync("data/towns.json", join(root, "data", "towns.json"));
    copyFileSync("data/sample/stays.csv", join(root, "data", "sample", "stays.csv"));
    if (realStays !== undefined) writeFileSync(join(root, "data", "stays.csv"), realStays);
    return root;
  }

  it("uses the labelled sample when there is no data/stays.csv", () => {
    const { stays, isSample } = loadStays(fakeRoot());
    expect(isSample).toBe(true);
    expect(stays).toHaveLength(60);
  });

  it("uses the sample when data/stays.csv has no rows yet", () => {
    expect(loadStays(fakeRoot(`${HEADER}\n`)).isSample).toBe(true);
  });

  it("uses real data once data/stays.csv has rows", () => {
    const { stays, isSample } = loadStays(fakeRoot(`${HEADER}\n${good}\n`));
    expect(isSample).toBe(false);
    expect(stays.map((s) => s.id)).toEqual(["s1"]);
  });

  it("stops with an error when data/stays.csv is broken", () => {
    expect(() => loadStays(fakeRoot(`${HEADER}\ns,2026-03-01,pai,2,0,more,2,chill,1-3m,\n`))).toThrow(/data\/stays.csv/);
  });
});
