import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The colour table in CLAUDE.md ("Design"). If a colour changes there,
// change it in app/globals.css too, and this test keeps the two in step.
const tokens: Record<string, string> = {
  background: "#dceee2",
  surface: "#ffffff",
  border: "#c8e0d0",
  ink: "#012b1d",
  "text-secondary": "#3e5448",
  accent: "#8a4f24",
  "accent-bar": "#a8693a",
  "accent-tint": "#f1e4d4",
  "accent-text": "#4a2810",
  bar: "#d3e4d9",
  chip: "#e8f3ec",
  slate: "#64748b",
  brand: "#17754c",
  "brand-tint": "#bdebd1",
  "brand-text": "#012b1d",
};

describe("design tokens", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const [name, hex] of Object.entries(tokens)) {
    it(`defines --color-${name} as ${hex}`, () => {
      expect(css).toContain(`--color-${name}: ${hex};`);
    });
  }
});
