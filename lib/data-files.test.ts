import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseStays } from "./data.ts";

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
  const stays = parseStays(
    readFileSync(new URL("../data/sample/stays.csv", import.meta.url), "utf8"),
    new Set(towns.map((t) => t.slug)),
  );

  it("passes the same checks as real data", () => {
    expect(stays.length).toBe(60);
  });

  it("covers 3 towns: 34, 18 and 8 stays", () => {
    const count = (slug: string) => stays.filter((s) => s.townSlug === slug).length;
    expect([count("pai"), count("chiang-mai"), count("hoi-an")]).toEqual([34, 18, 8]);
  });
});
