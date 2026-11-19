/** "Today" for the stats: when the site was built (set in next.config.ts). */
export function buildDate(): Date {
  const value = process.env.BUILD_DATE;
  if (!value) throw new Error("BUILD_DATE is not set (it comes from next.config.ts)");
  return new Date(value);
}
