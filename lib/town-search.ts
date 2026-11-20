import { normaliseTownName } from "./town-names.ts";

export type SearchableTown = { name: string; country: string; aliases: string[] };

/** Towns whose name, country or any alias contains the query (ignoring capitals, accents and spaces). Empty query: all. */
export function searchTowns<T extends SearchableTown>(towns: T[], query: string): T[] {
  const q = normaliseTownName(query);
  if (!q) return towns;
  return towns.filter((t) => [t.name, t.country, ...t.aliases].some((n) => normaliseTownName(n).includes(q)));
}
