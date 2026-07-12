import { cache } from "react";
import {
  cacheKey,
  CFBD_CACHE_TTL_SECONDS,
  scheduleCacheTier,
  withMemoryCache,
  type CacheTier,
} from "./cache";
import type {
  CfbdCalendarWeek,
  CfbdGame,
  CfbdGameMedia,
  CfbdTeam,
  DivisionClassification,
  SeasonType,
} from "./types";
import { logCfbdUsage, recordCfbdResponse } from "./usage";

const CFBD_BASE_URL = "https://api.collegefootballdata.com";

function getApiKey(): string {
  const key = process.env.CFBD_API_KEY;
  if (!key) {
    throw new Error(
      "Missing CFBD_API_KEY. Get a free key at https://collegefootballdata.com/key and add it to .env.local",
    );
  }
  return key;
}

function buildUrl(
  path: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const url = new URL(path, CFBD_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Cached CFBD GET.
 *
 * Layers (cheapest first):
 * 1. Process memory TTL cache + in-flight dedupe
 * 2. Next.js fetch Data Cache (`force-cache` + `revalidate`)
 * 3. Network → logs `x-calllimit-remaining` when present
 */
async function cfbdFetch<T>(
  path: string,
  params: Record<string, string | number | undefined | null>,
  tier: CacheTier,
): Promise<T> {
  const ttlSeconds = CFBD_CACHE_TTL_SECONDS[tier];
  const key = cacheKey(path, params);
  const url = buildUrl(path, params);

  const { data, hit } = await withMemoryCache<T>(key, ttlSeconds, async () => {
    const started = performance.now();
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        Accept: "application/json",
      },
      // Persist across requests in production; TTL matches free-tier budget.
      cache: "force-cache",
      next: {
        revalidate: ttlSeconds,
        tags: [`cfbd:${path}`, `cfbd:${key}`],
      },
    });

    // CFBD sends `x-calllimit-remaining` on real upstream responses.
    // Next Data Cache hits typically lack that header — treat those as non-network.
    const hasCallLimitHeader =
      response.headers.has("x-calllimit-remaining") ||
      response.headers.has("x-call-limit-remaining");

    if (hasCallLimitHeader) {
      recordCfbdResponse(key, response);
      logCfbdUsage("network", {
        path: key,
        status: response.status,
        revalidateSeconds: ttlSeconds,
        durationMs: performance.now() - started,
      });
    } else {
      logCfbdUsage("cache-hit", {
        path: key,
        cacheLayer: "next-fetch",
        status: response.status,
        revalidateSeconds: ttlSeconds,
        durationMs: performance.now() - started,
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `CFBD API error ${response.status} for ${key}: ${body || response.statusText}`,
      );
    }

    return (await response.json()) as T;
  });

  if (hit) {
    logCfbdUsage("cache-hit", { path: key, cacheLayer: "memory" });
  }

  return data;
}

/** Calendar for a season — stable; shared by guide + week nav. */
export const getCalendar = cache(async function getCalendar(
  year: number,
): Promise<CfbdCalendarWeek[]> {
  return cfbdFetch<CfbdCalendarWeek[]>(
    "/calendar",
    { year },
    "calendar",
  );
});

export const getGames = cache(async function getGames(options: {
  year: number;
  week?: number;
  seasonType?: SeasonType;
  classification?: DivisionClassification;
}): Promise<CfbdGame[]> {
  const seasonType = options.seasonType ?? "regular";
  const classification = options.classification ?? "fbs";
  return cfbdFetch<CfbdGame[]>(
    "/games",
    {
      year: options.year,
      week: options.week,
      seasonType,
      classification,
    },
    scheduleCacheTier(options.year, options.week),
  );
});

export const getGameMedia = cache(async function getGameMedia(options: {
  year: number;
  week?: number;
  seasonType?: SeasonType;
  classification?: DivisionClassification;
  mediaType?: string;
}): Promise<CfbdGameMedia[]> {
  const seasonType = options.seasonType ?? "regular";
  const classification = options.classification ?? "fbs";
  return cfbdFetch<CfbdGameMedia[]>(
    "/games/media",
    {
      year: options.year,
      week: options.week,
      seasonType,
      classification,
      mediaType: options.mediaType,
    },
    scheduleCacheTier(options.year, options.week),
  );
});

/** Team logos — one of the most reusable (and previously most wasteful) calls. */
export const getTeams = cache(async function getTeams(options?: {
  year?: number;
  classification?: DivisionClassification;
}): Promise<CfbdTeam[]> {
  return cfbdFetch<CfbdTeam[]>(
    "/teams",
    {
      year: options?.year,
      classification: options?.classification ?? "fbs",
    },
    "teams",
  );
});
