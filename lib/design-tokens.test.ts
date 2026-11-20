import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The colour table in CLAUDE.md ("Design"). If a colour changes there,
// change it in app/globals.css too, and this test keeps the two in step.
const tokens: Record<string, string> = {
  background: "#f5fbef",
  surface: "#ffffff",
  border: "#e3f1d6",
  ink: "#1c2a12",
  "text-secondary": "#56664a",
  accent: "#a85200",
  "accent-bar": "#ff9600",
  "accent-tint": "#fff0d9",
  "accent-text": "#8a4500",
  bar: "#e3f1d6",
  chip: "#eef7e4",
  brand: "#2f7a00",
  "brand-lime": "#58cc02",
  "brand-mid": "#46a302",
  "brand-sun": "#ffe15a",
  "brand-tint": "#d7f5b8",
  "brand-text": "#1c2a12",
  fewer: "#b23b2a",
  "fewer-tint": "#f9e1dc",
  "fewer-text": "#7a2318",
  about: "#b5e48c",
  "about-tint": "#eef7e4",
  "about-text": "#3d7a1f",
  "more-tint": "#e5f6d3",
  "more-text": "#1f4d00",
};

describe("design tokens", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const [name, hex] of Object.entries(tokens)) {
    it(`defines --color-${name} as ${hex}`, () => {
      expect(css).toContain(`--color-${name}: ${hex};`);
    });
  }
});
