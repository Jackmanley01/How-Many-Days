import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Town = {
  slug: string;
  name: string;
  country: string;
  route: string;
  aliases: string[];
};

export function loadTowns(root: string = process.cwd()): Town[] {
  return JSON.parse(readFileSync(join(root, "data", "towns.json"), "utf8")) as Town[];
}

/** "  Hội  An " -> "hoi an": lower case, no accents, single spaces. */
export function normaliseTownName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Returns a function that turns a typed town name into a slug, or null if it doesn't match. */
export function makeTownMatcher(towns: Town[]): (name: string) => string | null {
  const lookup = new Map<string, string>();
  for (const t of towns) {
    for (const n of [t.slug, t.name, ...t.aliases]) {
      const key = normaliseTownName(n);
      const existing = lookup.get(key);
      if (existing && existing !== t.slug) {
        throw new Error(`towns.json: "${n}" matches both ${existing} and ${t.slug}`);
      }
      lookup.set(key, t.slug);
    }
  }
  return (name) => lookup.get(normaliseTownName(name)) ?? null;
}

/** The next `count` towns after this one in route order, wrapping round (it's a loop). */
export function nextStops(towns: Town[], slug: string, count = 3): Town[] {
  const i = towns.findIndex((t) => t.slug === slug);
  if (i === -1) return [];
  return Array.from({ length: Math.min(count, towns.length - 1) }, (_, k) => towns[(i + 1 + k) % towns.length]);
}
