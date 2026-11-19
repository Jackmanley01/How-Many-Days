import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv.ts";

describe("parseCsv", () => {
  it("reads plain rows", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("reads quoted fields with commas, quotes and line breaks", () => {
    expect(parseCsv('tip\n"Go early, ""really"" early"\n"two\nlines"\n')).toEqual([
      ["tip"],
      ['Go early, "really" early'],
      ["two\nlines"],
    ]);
  });

  it("handles Windows line endings, a byte-order mark and blank lines", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps empty fields", () => {
    expect(parseCsv("a,,c\n,,\n")).toEqual([["a", "", "c"], ["", "", ""]]);
  });
});

describe("toCsv", () => {
  it("round-trips awkward values", () => {
    const rows = [["id", "tip"], ["1", 'Say "hi", then\nleave'], ["2", ""]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
