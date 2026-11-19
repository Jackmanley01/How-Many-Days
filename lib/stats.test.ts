import { describe, expect, it } from "vitest";
import { loadStays, type Stay, type Style, type Verdict } from "./data.ts";
import {
  answerNights,
  bucketFor,
  confidenceFor,
  distribution,
  eligibleStays,
  largestRemainder,
  latestDaysAgo,
  median,
  monthStats,
  townReviews,
  nightRange,
  percentile,
  recencyCutoff,
  seasonOrder,
  regretShares,
  skipPercent,
  townStats,
  townStatsByStyle,
} from "./stats.ts";

const NOW = new Date("2026-11-19T12:00:00Z");
let seq = 0;

function stay(nightsStayed: number, verdict: Verdict = "right", extra: Partial<Stay> = {}): Stay {
  seq++;
  return {
    id: `t${seq}`,
    submittedAt: "2026-10-01",
    townSlug: "pai",
    nightsPlanned: null,
    nightsStayed,
    verdict,
    month: null,
    styles: [],
    tripLength: null,
    tip: null,
    ...extra,
  };
}

/** n stays, all `nights` nights and "About right". */
const many = (n: number, nights = 3, extra: Partial<Stay> = {}) => Array.from({ length: n }, () => stay(nights, "right", extra));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("percentile (same method as Google Sheets PERCENTILE)", () => {
  it("interpolates between ranks", () => {
    expect(percentile([1, 2, 3, 4], 0.25)).toBe(1.75);
    expect(percentile([1, 2, 3, 4], 0.75)).toBe(3.25);
    expect(percentile([4, 1, 3, 2], 0.5)).toBe(2.5); // unsorted input
    expect(percentile([7], 0.25)).toBe(7);
  });

  it("refuses an empty list", () => {
    expect(() => percentile([], 0.5)).toThrow();
  });

  it("median is the 50th percentile", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([2, 3])).toBe(2.5);
  });
});

describe("answerNights", () => {
  it("uses a whole-number median as it is", () => {
    expect(answerNights([stay(2), stay(3), stay(9)])).toBe(3);
  });

  it("rounds a .5 median UP when more people wished longer", () => {
    expect(answerNights([stay(2, "more"), stay(3, "more"), stay(2, "fewer"), stay(3, "right")])).toBe(3);
  });

  it("rounds a .5 median DOWN when more people wished shorter (fewer + skip)", () => {
    expect(answerNights([stay(2, "more"), stay(3, "skip"), stay(2, "fewer"), stay(3, "right")])).toBe(2);
  });

  it("rounds a .5 median UP on a tie", () => {
    expect(answerNights([stay(2, "more"), stay(3, "fewer")])).toBe(3);
    expect(answerNights([stay(2, "right"), stay(3, "right")])).toBe(3); // 0 vs 0 is a tie too
  });

  it("counts 'About right' on neither side", () => {
    expect(answerNights([stay(2, "right"), stay(3, "right"), stay(2, "right"), stay(3, "fewer")])).toBe(2);
  });
});

describe("nightRange (25th-75th percentile)", () => {
  it("rounds each end to the nearest whole night", () => {
    // 25th = 1.75 -> 2, 75th = 3.25 -> 3
    expect(nightRange([stay(1), stay(2), stay(3), stay(4)])).toEqual({ low: 2, high: 3 });
  });

  it("widens on exact halves: bottom end down, top end up", () => {
    // [1, 2, 3]: 25th percentile = 1.5 -> rounds down to 1; 75th = 2.5 -> rounds up to 3.
    expect(nightRange([stay(1), stay(2), stay(3)])).toEqual({ low: 1, high: 3 });
  });

  it("can collapse to a single number", () => {
    expect(nightRange(many(12, 2))).toEqual({ low: 2, high: 2 });
  });
});

describe("confidence levels", () => {
  it.each([
    [0, "none"],
    [9, "none"],
    [10, "early"],
    [29, "early"],
    [30, "single"],
    [500, "single"],
  ] as const)("%i stays -> %s", (n, level) => {
    expect(confidenceFor(n)).toBe(level);
  });
});

describe("largestRemainder (whole percentages that sum to 100)", () => {
  it("splits three equal groups 34/33/33", () => {
    expect(largestRemainder([1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("gives the leftover points to the largest remainders", () => {
    // 2/7 = 28.57, 2/7 = 28.57, 3/7 = 42.86 -> floors 28, 28, 42 (= 98).
    // Two points left: the .86 gets one, then the first .57 (equal remainders: earlier wins).
    expect(largestRemainder([2, 2, 3])).toEqual([29, 28, 43]);
  });

  it("handles one group, zeros and an empty set", () => {
    expect(largestRemainder([5])).toEqual([100]);
    expect(largestRemainder([0, 4, 0])).toEqual([0, 100, 0]);
    expect(largestRemainder([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("always sums to 100, with whole numbers only, for every split of up to 40 stays", () => {
    for (let total = 1; total <= 40; total++) {
      for (let a = 0; a <= total; a++) {
        for (let b = 0; a + b <= total; b++) {
          const p = largestRemainder([a, b, total - a - b]);
          expect(sum(p)).toBe(100);
          for (const x of p) expect(Number.isInteger(x)).toBe(true);
        }
      }
    }
  });
});

describe("regretShares", () => {
  it("counts Fewer nights and Skip it together as 'wished shorter'", () => {
    const stays = [stay(3, "more"), stay(3, "more"), stay(3, "right"), stay(3, "fewer"), stay(3, "skip")];
    expect(regretShares(stays)).toEqual({ longer: 40, right: 20, shorter: 40 });
  });

  it("sums to 100", () => {
    const stays = [stay(3, "more"), stay(3, "right"), stay(3, "skip")];
    const r = regretShares(stays);
    expect(r.longer + r.right + r.shorter).toBe(100);
  });
});

describe("skipPercent", () => {
  it("shows when Skip it is exactly 10%", () => {
    expect(skipPercent([stay(1, "skip"), ...many(9)])).toBe(10);
  });

  it("hides when Skip it is under 10%", () => {
    expect(skipPercent([stay(1, "skip"), ...many(10)])).toBeNull();
    expect(skipPercent(many(10))).toBeNull();
    expect(skipPercent([])).toBeNull();
  });

  it("is a whole number", () => {
    expect(skipPercent([stay(1, "skip"), stay(1, "skip"), ...many(7)])).toBe(22); // 2/9 = 22.2
  });
});

describe("distribution", () => {
  it("groups 5 nights and more into the 5+ bar", () => {
    expect([1, 2, 3, 4, 5, 7, 10].map(bucketFor)).toEqual(["1", "2", "3", "4", "5+", "5+", "5+"]);
  });

  it("gives whole percentages summing to 100", () => {
    const d = distribution([stay(1), stay(2), stay(2), stay(6), stay(10), stay(3)], () => false);
    expect(d.map((b) => b.percent)).toEqual([17, 33, 17, 0, 33]);
    expect(sum(d.map((b) => b.percent))).toBe(100);
  });
});

describe("recency (last 24 months)", () => {
  it("cuts off 24 months before today", () => {
    expect(recencyCutoff(NOW)).toBe("2024-11-19");
  });

  it("counts a stay from 23 months ago and on the cutoff day, not 25 months or the day before", () => {
    const kept = eligibleStays(
      [
        stay(3, "right", { submittedAt: "2024-12-19", id: "23m" }),
        stay(3, "right", { submittedAt: "2024-11-19", id: "cutoff" }),
        stay(3, "right", { submittedAt: "2024-11-18", id: "day-before" }),
        stay(3, "right", { submittedAt: "2024-10-19", id: "25m" }),
      ],
      NOW,
    );
    expect(kept.map((s) => s.id)).toEqual(["23m", "cutoff"]);
  });

  it("reports how many days ago the newest stay was", () => {
    expect(latestDaysAgo([stay(3, "right", { submittedAt: "2026-11-13" }), stay(3, "right", { submittedAt: "2026-01-01" })], NOW)).toBe(6);
    expect(latestDaysAgo([], NOW)).toBeNull();
  });
});

describe("townStats", () => {
  it("empty set: no number, no percentages, no chart", () => {
    expect(townStats([], "pai", { now: NOW })).toEqual({
      n: 0,
      confidence: "none",
      latestDaysAgo: null,
      answer: null,
      range: null,
      regret: null,
      skipPercent: null,
      distribution: null,
    });
  });

  it("9 stays: not enough, hides every number but the count", () => {
    const s = townStats([stay(2, "more"), ...many(8)], "pai", { now: NOW });
    expect(s).toMatchObject({ n: 9, confidence: "none", answer: null, range: null, regret: null, distribution: null, skipPercent: null });
    expect(s.latestDaysAgo).toBe(49);
  });

  it("10 stays: Early data range, regret and chart, but no single answer", () => {
    const stays = [stay(2, "more"), stay(2, "more"), stay(3), stay(3), stay(3), stay(3), stay(4, "fewer"), stay(4), stay(5), stay(6, "skip")];
    const s = townStats(stays, "pai", { now: NOW });
    expect(s.confidence).toBe("early");
    expect(s.answer).toBeNull();
    // 25th: rank 2.25 -> 3 ; 75th: rank 6.75 -> 4
    expect(s.range).toEqual({ low: 3, high: 4 });
    expect(s.regret).toEqual({ longer: 20, right: 60, shorter: 20 });
    expect(s.skipPercent).toBe(10);
    // Early data highlights every bar inside the range.
    expect(s.distribution!.filter((b) => b.highlighted).map((b) => b.bucket)).toEqual(["3", "4"]);
  });

  it("29 stays is still Early data, 30 is one number", () => {
    expect(townStats(many(29), "pai", { now: NOW }).confidence).toBe("early");
    const s = townStats(many(30), "pai", { now: NOW });
    expect(s.confidence).toBe("single");
    expect(s.answer).toBe(3);
    expect(s.range).toEqual({ low: 3, high: 3 });
  });

  it("highlights the bar containing a single answer, including 5+", () => {
    const s = townStats(many(30, 7), "pai", { now: NOW });
    expect(s.answer).toBe(7);
    expect(s.distribution!.filter((b) => b.highlighted).map((b) => b.bucket)).toEqual(["5+"]);
  });

  it("only counts the requested town and recent stays", () => {
    const stays = [...many(30), ...many(5, 3, { townSlug: "hoi-an" }), ...many(5, 3, { submittedAt: "2023-01-01" })];
    expect(townStats(stays, "pai", { now: NOW }).n).toBe(30);
  });
});

describe("style filter", () => {
  const withStyle = (styles: Style[], nights: number, verdict: Verdict = "right") => stay(nights, verdict, { styles });

  it("keeps only stays tagged with the style, then re-runs every rule", () => {
    const stays = [
      ...Array.from({ length: 30 }, () => withStyle(["party"], 2)),
      ...Array.from({ length: 12 }, () => withStyle(["chill", "hiking"], 5, "more")),
    ];
    const all = townStats(stays, "pai", { now: NOW });
    const chill = townStats(stays, "pai", { now: NOW, style: "chill" });
    expect(all).toMatchObject({ n: 42, confidence: "single", answer: 2 });
    expect(chill).toMatchObject({ n: 12, confidence: "early", answer: null, range: { low: 5, high: 5 } });
    expect(chill.regret).toEqual({ longer: 100, right: 0, shorter: 0 });
  });

  it("a filtered set below 10 shows nothing but the count", () => {
    const stays = [...many(40, 3, { styles: ["party"] }), ...many(7, 3, { styles: ["chill"] })];
    expect(townStats(stays, "pai", { now: NOW }).confidence).toBe("single");
    expect(townStats(stays, "pai", { now: NOW, style: "chill" })).toMatchObject({
      n: 7,
      confidence: "none",
      answer: null,
      regret: null,
      distribution: null,
    });
    expect(townStats(stays, "pai", { now: NOW, style: "food" })).toMatchObject({ n: 0, confidence: "none" });
  });
});

describe("sample data gives each confidence level", () => {
  const { stays } = loadStays();

  it("Pai: one number", () => {
    const s = townStats(stays, "pai", { now: NOW });
    expect(s.n).toBe(32);
    expect(s.confidence).toBe("single");
    expect(Number.isInteger(s.answer)).toBe(true);
    expect(s.regret!.longer + s.regret!.right + s.regret!.shorter).toBe(100);
  });

  it("Chiang Mai: Early data range", () => {
    const s = townStats(stays, "chiang-mai", { now: NOW });
    expect(s.n).toBe(17);
    expect(s.confidence).toBe("early");
    expect(s.range).not.toBeNull();
  });

  it("Hoi An: not enough yet", () => {
    expect(townStats(stays, "hoi-an", { now: NOW })).toMatchObject({ n: 8, confidence: "none" });
  });
});

describe("monthStats (When people went)", () => {
  const withMonth = (month: number | null, extra: Partial<Stay> = {}) => stay(3, "right", { month, ...extra });

  it("hides under 10 stays that gave a month", () => {
    expect(monthStats([...Array.from({ length: 9 }, () => withMonth(1)), withMonth(null), withMonth(null)], "pai", { now: NOW })).toBeNull();
  });

  it("gives 12 whole percentages summing to 100, and the 3 busiest months in calendar order", () => {
    const stays = [
      ...Array.from({ length: 4 }, () => withMonth(12)),
      ...Array.from({ length: 3 }, () => withMonth(1)),
      ...Array.from({ length: 2 }, () => withMonth(2)),
      withMonth(3),
      withMonth(null),
    ];
    const m = monthStats(stays, "pai", { now: NOW })!;
    expect(m.n).toBe(10);
    expect(m.months).toHaveLength(12);
    expect(m.months.map((x) => x.percent)).toEqual([30, 20, 10, 0, 0, 0, 0, 0, 0, 0, 0, 40]);
    expect(sum(m.months.map((x) => x.percent))).toBe(100);
    expect(m.busiest).toEqual([12, 1, 2]);
  });

  it("breaks ties for busiest by the earlier month", () => {
    const stays = [5, 5, 6, 6, 7, 7, 8, 8, 9, 9].map((mo) => withMonth(mo));
    expect(monthStats(stays, "pai", { now: NOW })!.busiest).toEqual([5, 6, 7]);
  });

  it("follows the style filter and recency like the answer", () => {
    const stays = [
      ...Array.from({ length: 10 }, () => withMonth(1, { styles: ["chill"] })),
      ...Array.from({ length: 10 }, () => withMonth(6, { styles: ["party"] })),
      ...Array.from({ length: 10 }, () => withMonth(7, { styles: ["chill"], submittedAt: "2020-01-01" })),
    ];
    expect(monthStats(stays, "pai", { now: NOW, style: "chill" })!.busiest).toEqual([1]);
  });
});

describe("seasonOrder", () => {
  it.each([
    [[1, 11, 12], [11, 12, 1]],
    [[1, 2, 12], [12, 1, 2]],
    [[3, 4, 5], [3, 4, 5]],
    [[7, 1], [1, 7]],
    [[6], [6]],
    [[], []],
  ])("%j reads as %j", (input, expected) => {
    expect(seasonOrder(input)).toEqual(expected);
  });
});

describe("townReviews", () => {
  it("lists recent stays with a tip, newest first, and counts all recent stays", () => {
    const stays = [
      stay(2, "more", { id: "old-tip", tip: "Too old", submittedAt: "2020-01-01" }),
      stay(2, "more", { id: "a", tip: "First", submittedAt: "2026-01-01" }),
      stay(2, "more", { id: "b", tip: "Newest", submittedAt: "2026-09-01" }),
      stay(2, "more", { id: "c", tip: null, submittedAt: "2026-10-01" }),
      stay(2, "more", { id: "d", tip: "Other town", townSlug: "hoi-an" }),
    ];
    const { reviews, totalStays } = townReviews(stays, "pai", NOW);
    expect(reviews.map((r) => r.id)).toEqual(["b", "a"]);
    expect(totalStays).toBe(3);
  });
});

describe("townStatsByStyle (answer filter, worked out ahead of time)", () => {
  const stays = [
    ...many(30, 2, { styles: ["party"] }),
    ...many(12, 5, { styles: ["chill", "hiking"] }),
    ...many(3, 4, { styles: ["food"] }),
  ];
  const byStyle = townStatsByStyle(stays, "pai", NOW);

  it("has an entry for all travellers and every style", () => {
    expect(Object.keys(byStyle)).toEqual(["all", "party", "chill", "hiking", "budget", "food", "culture"]);
  });

  it("matches townStats for each style, every rule re-run", () => {
    expect(byStyle.all).toEqual(townStats(stays, "pai", { now: NOW }));
    expect(byStyle.chill).toEqual(townStats(stays, "pai", { now: NOW, style: "chill" }));
    expect(byStyle.all).toMatchObject({ n: 45, confidence: "single" });
    expect(byStyle.party).toMatchObject({ n: 30, confidence: "single", answer: 2 });
    expect(byStyle.hiking).toMatchObject({ n: 12, confidence: "early" });
    expect(byStyle.food).toMatchObject({ n: 3, confidence: "none", answer: null, regret: null, distribution: null });
    expect(byStyle.budget).toMatchObject({ n: 0, confidence: "none" });
  });
});
