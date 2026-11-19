import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The colour table in CLAUDE.md ("Design"). If a colour changes there,
// change it in app/globals.css too, and this test keeps the two in step.
const tokens: Record<string, string> = {
  background: "#f5f6f8",
  surface: "#ffffff",
  border: "#e3e6eb",
  ink: "#111827",
  "text-secondary": "#4b5563",
  accent: "#c2410c",
  "accent-tint": "#fff4ec",
  "accent-text": "#7c2d12",
  bar: "#cbd2dc",
  slate: "#64748b",
};

describe("design tokens", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const [name, hex] of Object.entries(tokens)) {
    it(`defines --color-${name} as ${hex}`, () => {
      expect(css).toContain(`--color-${name}: ${hex};`);
    });
  }
});
