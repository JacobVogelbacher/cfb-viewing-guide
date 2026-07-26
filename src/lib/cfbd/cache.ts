/**
 * Process-local TTL cache for CFBD responses.
 *
 * Next.js Data Cache helps in production, but:
 * - `next dev` often still hits the network frequently
 * - free tier is 1,000 calls/month
 *
 * This in-memory layer dedupes concurrent requests and serves warm data
 * across requests for the life of the Node process.
 */

import { getDefaultSeasonYear } from "@/lib/time";

export type CacheTier =
  | "teams"
  | "calendar"
  | "schedule"
  | "scheduleHistorical"
  | "scheduleHorizonFar"
  | "schedulePastSeason";

/** TTLs tuned for free-tier (1k calls/month). */
export const CFBD_CACHE_TTL_SECONDS: Record<CacheTier, number> = {
  /** Logos/colors rarely change mid-season */
  teams: 7 * 24 * 60 * 60, // 7 days
  /** Season week boundaries are stable */
  calendar: 24 * 60 * 60, // 24 hours
  /** TV windows / kickoffs for current or near-term weeks */
  schedule: 6 * 60 * 60, // 6 hours
  /**
   * Completed weeks in the current season, or upcoming weeks 4–5 weeks out
   * (TV slate still sparse; no need to refresh often).
   */
  scheduleHistorical: 7 * 24 * 60 * 60, // 7 days
  /** Upcoming weeks 6+ weeks out — almost nothing useful changes yet */
  scheduleHorizonFar: 14 * 24 * 60 * 60, // 14 days
  /** Prior seasons — schedules are effectively frozen */
  schedulePastSeason: 30 * 24 * 60 * 60, // 30 days
};

type Entry = {
  expiresAt: number;
  value: unknown;
};

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function cacheKey(
  path: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return sorted ? `${path}?${sorted}` : path;
}

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Dedup concurrent callers for the same key and populate the memory cache.
 */
export async function withMemoryCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ data: T; hit: boolean }> {
  const existing = getCached<T>(key);
  if (existing !== undefined) {
    return { data: existing, hit: true };
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) {
    const data = await pending;
    return { data, hit: true };
  }

  const promise = loader()
    .then((data) => {
      setCached(key, data, ttlSeconds);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  const data = await promise;
  return { data, hit: false };
}

export function clearCfbdMemoryCache(): void {
  store.clear();
  inflight.clear();
}

export function memoryCacheStats(): { size: number; keys: string[] } {
  // Drop expired while reporting
  const now = Date.now();
  for (const [k, v] of store) {
    if (now >= v.expiresAt) store.delete(k);
  }
  return { size: store.size, keys: [...store.keys()] };
}

/**
 * Pick schedule TTL by how "done" / far away the data is:
 * - Prior seasons → 30 days (frozen)
 * - Completed weeks in the current season → 7 days
 * - Upcoming weeks 6+ weeks out → 14 days
 * - Upcoming weeks 4–5 weeks out → 7 days
 * - Current / near-term weeks → 6 hours (TV windows still shift)
 */
export function scheduleCacheTier(
  year: number,
  week: number | undefined,
  now = new Date(),
): CacheTier {
  const seasonYear = getDefaultSeasonYear(now);

  if (year < seasonYear) return "schedulePastSeason";
  if (year > seasonYear) return "schedule";

  // Season fully over (calendar year after the season, from February on) →
  // treat as past season even while default season year hasn't rolled yet.
  if (now.getFullYear() > year && now.getMonth() >= 1) {
    return "schedulePastSeason";
  }

  // Within the current season. Approximate calendar is fine for cache tiers only.
  if (week != null) {
    const approxWeekEnd = approximateWeekEnd(year, week);
    if (
      approxWeekEnd &&
      now.getTime() - approxWeekEnd.getTime() > 2 * 24 * 60 * 60 * 1000
    ) {
      return "scheduleHistorical";
    }

    const approxWeekStart = approximateWeekStart(year, week);
    if (approxWeekStart && approxWeekStart.getTime() > now.getTime()) {
      const msUntilStart = approxWeekStart.getTime() - now.getTime();
      const weeksUntilStart = msUntilStart / (7 * 24 * 60 * 60 * 1000);
      if (weeksUntilStart >= 6) return "scheduleHorizonFar";
      if (weeksUntilStart >= 4) return "scheduleHistorical";
    }
  }

  return "schedule";
}

/** Saturday kickoff weekend for week N (coarse; cache tier only). */
function approximateWeekStart(year: number, week: number): Date | null {
  if (!Number.isFinite(week) || week < 0) return null;
  const laborDay = firstMondayOfSeptember(year);
  const saturdayOfWeek1 = new Date(laborDay);
  saturdayOfWeek1.setDate(laborDay.getDate() - 2); // Saturday before Labor Day
  const start = new Date(saturdayOfWeek1);
  start.setDate(saturdayOfWeek1.getDate() + (week - 1) * 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

function approximateWeekEnd(year: number, week: number): Date | null {
  const start = approximateWeekStart(year, week);
  if (!start) return null;
  // Sunday after that Saturday.
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  return end;
}

function firstMondayOfSeptember(year: number): Date {
  const d = new Date(year, 8, 1); // Sep 1
  const day = d.getDay(); // 0 Sun … 1 Mon
  const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  d.setDate(1 + offset);
  return d;
}
