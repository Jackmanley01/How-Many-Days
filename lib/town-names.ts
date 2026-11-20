// Name matching that is safe to use in the browser (no file access).

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

