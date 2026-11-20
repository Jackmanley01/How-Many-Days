import { describe, expect, it } from "vitest";
import { searchTowns } from "./town-search.ts";
import { loadTowns } from "./towns.ts";

const towns = loadTowns();
const names = (q: string) => searchTowns(towns, q).map((t) => t.name);

describe("searchTowns", () => {
  it("shows every town for an empty search", () => {
    expect(searchTowns(towns, "  ")).toHaveLength(towns.length);
  });

  it("matches the start or middle of a name, ignoring capitals", () => {
    expect(names("pa")).toContain("Pai");
    expect(names("CHIANG")).toEqual(["Chiang Mai", "Chiang Rai"]);
  });

  it("matches other spellings and accents", () => {
    expect(names("saigon")).toEqual(["Ho Chi Minh City"]);
    expect(names("hội")).toEqual(["Hoi An"]);
    expect(names("ha long")).toEqual(["Cat Ba"]);
  });

  it("matches a country", () => {
    expect(names("laos")).toEqual(["Luang Prabang", "Vang Vieng", "Vientiane"]);
  });

  it("returns nothing for a town not on the loop", () => {
    expect(names("bali")).toEqual([]);
  });
});
