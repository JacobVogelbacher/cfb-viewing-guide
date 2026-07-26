/** Canonical path for a season week guide. */
export function weekPath(year: number | string, week: number | string): string {
  return `/${year}/week/${week}`;
}
