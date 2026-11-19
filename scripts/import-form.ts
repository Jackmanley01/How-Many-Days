// npm run import: data/raw/form.csv -> data/stays.csv, plus a report.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseStays } from "../lib/data.ts";
import { formatReport, importFormExport, staysToCsv } from "../lib/form-import.ts";
import { loadTowns } from "../lib/towns.ts";

const root = process.cwd();
const input = join(root, "data", "raw", "form.csv");
const output = join(root, "data", "stays.csv");

if (!existsSync(input)) {
  console.error("No form export found at data/raw/form.csv.");
  console.error("In Google Sheets: File → Download → Comma-separated values, then save it there.");
  process.exit(1);
}

const towns = loadTowns(root);
const { stays, report } = importFormExport(readFileSync(input, "utf8"), towns);
const csv = staysToCsv(stays);

// Check the output with the same rules the website uses before writing it.
parseStays(csv, new Set(towns.map((t) => t.slug)), "data/stays.csv");
writeFileSync(output, csv);

console.log(formatReport(report));
console.log(`\nWrote data/stays.csv`);
