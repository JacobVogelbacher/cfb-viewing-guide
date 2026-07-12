/**
 * Tracks CFBD monthly call budget from response headers.
 * Header observed in production: `x-calllimit-remaining`
 */

export type CfbdUsageSnapshot = {
  remaining: number | null;
  limit: number | null;
  used: number | null;
  lastPath: string | null;
  lastStatus: number | null;
  lastNetworkAt: string | null;
  networkCallsThisProcess: number;
};

const FREE_TIER_MONTHLY_LIMIT = 1000;

const state: CfbdUsageSnapshot = {
  remaining: null,
  limit: null,
  used: null,
  lastPath: null,
  lastStatus: null,
  lastNetworkAt: null,
  networkCallsThisProcess: 0,
};

/** Headers CFBD (or proxies) may send for monthly quota. */
const REMAINING_HEADERS = [
  "x-calllimit-remaining",
  "x-call-limit-remaining",
  "x-ratelimit-remaining",
  "x-rate-limit-remaining",
] as const;

const LIMIT_HEADERS = [
  "x-calllimit-limit",
  "x-call-limit-limit",
  "x-ratelimit-limit",
  "x-rate-limit-limit",
] as const;

function readHeader(
  headers: Headers,
  names: readonly string[],
): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value != null && value !== "") return value;
  }
  // Case-insensitive scan (some runtimes normalize differently)
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (names.includes(lower as (typeof names)[number])) return value;
  }
  return null;
}

function parseOptionalInt(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getCfbdUsage(): CfbdUsageSnapshot {
  return { ...state };
}

export function recordCfbdResponse(
  pathWithQuery: string,
  response: Response,
): CfbdUsageSnapshot {
  state.networkCallsThisProcess += 1;
  state.lastPath = pathWithQuery;
  state.lastStatus = response.status;
  state.lastNetworkAt = new Date().toISOString();

  const remaining = parseOptionalInt(
    readHeader(response.headers, REMAINING_HEADERS),
  );
  const limit = parseOptionalInt(readHeader(response.headers, LIMIT_HEADERS));

  if (remaining != null) state.remaining = remaining;
  if (limit != null) {
    state.limit = limit;
  } else if (state.limit == null && remaining != null) {
    // Free tier is 1,000/month when the API only reports remaining.
    state.limit = FREE_TIER_MONTHLY_LIMIT;
  }

  if (state.remaining != null && state.limit != null) {
    state.used = Math.max(0, state.limit - state.remaining);
  }

  return getCfbdUsage();
}

export function formatUsageLine(usage: CfbdUsageSnapshot): string {
  const parts: string[] = [];

  if (usage.remaining != null) {
    if (usage.limit != null) {
      const used =
        usage.used ?? Math.max(0, usage.limit - usage.remaining);
      const pct = Math.round((used / usage.limit) * 100);
      parts.push(
        `monthly ${used}/${usage.limit} used (${usage.remaining} remaining, ${pct}%)`,
      );
    } else {
      parts.push(`remaining=${usage.remaining}`);
    }
  } else {
    parts.push("usage headers not provided");
  }

  parts.push(`process network calls=${usage.networkCallsThisProcess}`);
  return parts.join(" · ");
}

/** Log levels escalate as the free-tier budget runs down. */
export function logCfbdUsage(
  event: "network" | "cache-hit",
  detail: {
    path: string;
    status?: number;
    cacheLayer?: "memory" | "next-fetch";
    revalidateSeconds?: number;
    durationMs?: number;
  },
): void {
  const usage = getCfbdUsage();
  const prefix = "[CFBD]";

  if (event === "cache-hit") {
    // Cache hits are debug-level noise; only log in development.
    if (process.env.NODE_ENV === "development") {
      const layer = detail.cacheLayer ?? "unknown";
      const duration =
        detail.durationMs != null
          ? ` ${Math.round(detail.durationMs)}ms`
          : "";
      console.debug(
        `${prefix} CACHE HIT (${layer}) ${detail.path}${duration}`,
      );
    }
    return;
  }

  const duration =
    detail.durationMs != null ? ` ${Math.round(detail.durationMs)}ms` : "";
  const reval =
    detail.revalidateSeconds != null
      ? ` revalidate=${detail.revalidateSeconds}s`
      : "";
  const status = detail.status != null ? ` status=${detail.status}` : "";

  const line = `${prefix} NETWORK ${detail.path}${status}${duration}${reval} · ${formatUsageLine(usage)}`;

  if (usage.remaining != null && usage.remaining <= 50) {
    console.error(
      `${line} · CRITICAL: free-tier monthly budget nearly exhausted`,
    );
  } else if (usage.remaining != null && usage.remaining <= 150) {
    console.warn(`${line} · WARNING: low monthly call budget`);
  } else {
    console.info(line);
  }
}
