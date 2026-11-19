import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Shape checks for the data files. Full loading and validation of stays
// arrives with lib/data.ts (roadmap task 3).

type Town = { slug: string; name: string; country: string; route: string; aliases: string[] };

const towns: Town[] = JSON.parse(
  readFileSync(new URL("../data/towns.json", import.meta.url), "utf8"),
);

const norm = (s: string) => s.trim().toLowerCase();

describe("data/towns.json", () => {
  it("has between 20 and 30 launch-route towns", () => {
    expect(towns.length).toBeGreaterThanOrEqual(20);
    expect(towns.length).toBeLessThanOrEqual(30);
  });

  it("gives every town a slug, name, country, route and aliases list", () => {
    for (const t of towns) {
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.country.length).toBeGreaterThan(0);
      expect(t.route).toBe("se-asia-loop");
      expect(Array.isArray(t.aliases)).toBe(true);
    }
  });

  it("never lets one name match two towns", () => {
    const seen = new Map<string, string>();
    for (const t of towns) {
      for (const name of [t.slug, t.name, ...t.aliases]) {
        const key = norm(name);
        const owner = seen.get(key);
        expect(owner === undefined || owner === t.slug, `"${name}" matches ${owner} and ${t.slug}`).toBe(true);
        seen.set(key, t.slug);
      }
    }
  });
});

describe("data/sample/stays.csv", () => {
  const lines = readFileSync(new URL("../data/sample/stays.csv", import.meta.url), "utf8")
    .trim()
    .split(/\r?\n/);
  const header = lines[0].split(",");
  const rows = lines.slice(1).map((l) => Object.fromEntries(l.split(",").map((v, i) => [header[i], v])));
  const slugs = new Set(towns.map((t) => t.slug));

  it("has about 60 stays across 3 towns, each a known town", () => {
    expect(rows.length).toBe(60);
    expect(new Set(rows.map((r) => r.townSlug)).size).toBe(3);
    for (const r of rows) expect(slugs.has(r.townSlug)).toBe(true);
  });

  it("uses whole numbers and allowed values only", () => {
    for (const r of rows) {
      expect(r.nightsStayed).toMatch(/^([1-9]|10)$/);
      expect(r.nightsPlanned).toMatch(/^(|[1-9]|10)$/);
      expect(r.month).toMatch(/^(|[1-9]|1[0-2])$/);
      expect(["skip", "fewer", "right", "more"]).toContain(r.verdict);
      expect(["2-4w", "1-3m", "3m+"]).toContain(r.tripLength);
      for (const s of r.styles.split(";")) {
        expect(["party", "chill", "hiking", "budget", "food", "culture"]).toContain(s);
      }
      expect(r.tip.length).toBeLessThanOrEqual(140);
    }
  });

  it("has unique ids", () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });
});
