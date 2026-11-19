import { describe, expect, it } from "vitest";
import { loadTowns, makeTownMatcher, nextStops, normaliseTownName, type Town } from "./towns.ts";

describe("normaliseTownName", () => {
  it("ignores capitals, accents, punctuation and extra spaces", () => {
    expect(normaliseTownName("  Hội  An ")).toBe("hoi an");
    expect(normaliseTownName("Đà Lạt")).toBe("da lat");
    expect(normaliseTownName("Phong Nha-Ke Bang")).toBe("phong nha ke bang");
  });
});

describe("makeTownMatcher (real towns.json)", () => {
  const match = makeTownMatcher(loadTowns());

  it.each([
    ["Pai", "pai"],
    ["saigon ", "ho-chi-minh-city"],
    ["HCMC", "ho-chi-minh-city"],
    ["Hội An", "hoi-an"],
    ["Ha Long Bay", "cat-ba"],
    ["Halong", "cat-ba"],
    ["Ao Nang", "krabi"],
    ["Railay", "krabi"],
    ["ko pha ngan", "koh-phangan"],
    ["chiang-mai", "chiang-mai"],
  ])("matches %j to %s", (typed, slug) => {
    expect(match(typed)).toBe(slug);
  });

  it("returns null for towns not on the route", () => {
    expect(match("Pai Canyon")).toBeNull();
    expect(match("Cusco")).toBeNull();
    expect(match("")).toBeNull();
  });
});

describe("makeTownMatcher (clashes)", () => {
  it("refuses a name that would match two towns", () => {
    const towns: Town[] = [
      { slug: "a", name: "A", country: "X", route: "r", aliases: ["Same"] },
      { slug: "b", name: "B", country: "X", route: "r", aliases: ["same"] },
    ];
    expect(() => makeTownMatcher(towns)).toThrow(/matches both a and b/);
  });
});

describe("nextStops", () => {
  const towns = loadTowns();

  it("returns the next 3 towns in route order", () => {
    expect(nextStops(towns, "pai").map((t) => t.slug)).toEqual(["chiang-rai", "luang-prabang", "vang-vieng"]);
  });

  it("wraps round at the end of the loop", () => {
    expect(nextStops(towns, "koh-phi-phi").map((t) => t.slug)).toEqual(["bangkok", "chiang-mai", "pai"]);
  });

  it("returns nothing for an unknown town", () => {
    expect(nextStops(towns, "atlantis")).toEqual([]);
  });
});
