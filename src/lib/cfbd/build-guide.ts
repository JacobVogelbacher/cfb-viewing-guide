import { unstable_cache } from "next/cache";
import { compareNetworks, normalizeOutlet } from "@/lib/networks";
import {
  buildHourColumns,
  formatSaturdayLabel,
  formatWeekRange,
  GAME_DURATION_MINUTES,
  resolveTimelineStartHour,
  saturdayMinutesFromMidnight,
  usThanksgivingDate,
} from "@/lib/time";
import { CFBD_CACHE_TTL_SECONDS, scheduleCacheTier } from "./cache";
import { getCalendar, getGameMedia, getGames, getTeams } from "./client";
import type {
  NetworkRow,
  SeasonType,
  ViewingGame,
  ViewingGuideData,
} from "./types";

function teamLogoMap(
  teams: Awaited<ReturnType<typeof getTeams>>,
): Map<string, { logo: string | null; color: string | null }> {
  const map = new Map<string, { logo: string | null; color: string | null }>();
  for (const team of teams) {
    const logo = team.logos?.[0] ?? null;
    const color = team.color ?? null;
    map.set(team.school.toLowerCase(), { logo, color });
    if (team.abbreviation) {
      map.set(team.abbreviation.toLowerCase(), { logo, color });
    }
    for (const alt of team.alternateNames ?? []) {
      map.set(alt.toLowerCase(), { logo, color });
    }
  }
  return map;
}

type GameDraft = Omit<ViewingGame, "startOffsetMinutes" | "durationMinutes"> & {
  /** Minutes from Saturday midnight ET (any time that day). */
  minutesFromMidnight: number;
};

function toGameDraft(
  partial: Omit<ViewingGame, "startOffsetMinutes" | "durationMinutes">,
): GameDraft | null {
  if (partial.isStartTimeTbd || !partial.startTime) return null;
  const minutesFromMidnight = saturdayMinutesFromMidnight(partial.startTime);
  if (minutesFromMidnight == null) return null;

  return {
    ...partial,
    minutesFromMidnight,
  };
}

async function buildViewingGuideUncached(options: {
  year: number;
  week: number;
  seasonType: SeasonType;
}): Promise<ViewingGuideData> {
  const { year, week, seasonType } = options;

  const [games, media, teams, calendar] = await Promise.all([
    getGames({ year, week, seasonType, classification: "fbs" }),
    getGameMedia({ year, week, seasonType, classification: "fbs" }),
    getTeams({ classification: "fbs" }),
    getCalendar(year),
  ]);

  const logos = teamLogoMap(teams);
  const gameById = new Map(games.map((g) => [g.id, g]));

  const mediaByGame = new Map<number, (typeof media)[number]>();
  const preferredTypes = ["tv", "web", "ppv", "mobile"];

  const sortedMedia = [...media].sort((a, b) => {
    const ai = preferredTypes.indexOf(String(a.mediaType).toLowerCase());
    const bi = preferredTypes.indexOf(String(b.mediaType).toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const m of sortedMedia) {
    if (!mediaByGame.has(m.id)) {
      mediaByGame.set(m.id, m);
    }
  }

  const drafts: GameDraft[] = [];

  for (const m of mediaByGame.values()) {
    const game = gameById.get(m.id);
    const awayMeta = logos.get(m.awayTeam.toLowerCase());
    const homeMeta = logos.get(m.homeTeam.toLowerCase());
    const draft = toGameDraft({
      id: m.id,
      awayTeam: m.awayTeam,
      homeTeam: m.homeTeam,
      awayLogo: awayMeta?.logo ?? null,
      homeLogo: homeMeta?.logo ?? null,
      awayColor: awayMeta?.color ?? null,
      homeColor: homeMeta?.color ?? null,
      startTime: m.startTime ?? game?.startDate ?? null,
      isStartTimeTbd: Boolean(m.isStartTimeTBD ?? game?.startTimeTBD),
      outlet: normalizeOutlet(m.outlet),
      venue: game?.venue ?? null,
      neutralSite: Boolean(game?.neutralSite),
      conferenceGame: Boolean(game?.conferenceGame),
      completed: Boolean(game?.completed),
      awayPoints: game?.awayPoints ?? null,
      homePoints: game?.homePoints ?? null,
      notes: game?.notes ?? null,
    });
    if (draft) drafts.push(draft);
  }

  for (const game of games) {
    if (mediaByGame.has(game.id)) continue;
    const awayMeta = logos.get(game.awayTeam.toLowerCase());
    const homeMeta = logos.get(game.homeTeam.toLowerCase());
    const draft = toGameDraft({
      id: game.id,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      awayLogo: awayMeta?.logo ?? null,
      homeLogo: homeMeta?.logo ?? null,
      awayColor: awayMeta?.color ?? null,
      homeColor: homeMeta?.color ?? null,
      startTime: game.startDate,
      isStartTimeTbd: Boolean(game.startTimeTBD),
      outlet: "TBD",
      venue: game.venue,
      neutralSite: Boolean(game.neutralSite),
      conferenceGame: Boolean(game.conferenceGame),
      completed: Boolean(game.completed),
      awayPoints: game.awayPoints,
      homePoints: game.homePoints,
      notes: game.notes,
    });
    if (draft) drafts.push(draft);
  }

  // Timeline origin: noon by default; pull earlier only for pre-noon Saturday games
  const timelineStartHour = resolveTimelineStartHour(
    drafts.map((d) => d.minutesFromMidnight),
  );
  const originMinutes = timelineStartHour * 60;

  const viewingGames: ViewingGame[] = drafts.map(
    ({ minutesFromMidnight, ...rest }) => ({
      ...rest,
      startOffsetMinutes: minutesFromMidnight - originMinutes,
      durationMinutes: GAME_DURATION_MINUTES,
    }),
  );

  // Continuous hours: origin → hour covering latest (kickoff + 3h)
  let maxEnd = GAME_DURATION_MINUTES;
  for (const g of viewingGames) {
    maxEnd = Math.max(maxEnd, g.startOffsetMinutes + g.durationMinutes);
  }
  const hourColumns = buildHourColumns(timelineStartHour, maxEnd);
  const timelineMinutes = hourColumns.length * 60;

  const networkMap = new Map<string, NetworkRow>();
  for (const g of viewingGames) {
    const network = g.outlet;
    if (!networkMap.has(network)) {
      networkMap.set(network, {
        network,
        displayName: network,
        games: [],
      });
    }
    const row = networkMap.get(network)!;
    if (!row.games.some((x) => x.id === g.id)) {
      row.games.push(g);
    }
  }

  const networks = [...networkMap.values()]
    .map((row) => ({
      ...row,
      games: row.games.sort(
        (a, b) =>
          a.startOffsetMinutes - b.startOffsetMinutes ||
          a.awayTeam.localeCompare(b.awayTeam),
      ),
    }))
    .sort((a, b) => compareNetworks(a.network, b.network));

  const calWeek = calendar.find(
    (c) => c.week === week && c.seasonType === seasonType,
  );

  const sampleStart =
    viewingGames.find((g) => g.startTime)?.startTime ?? null;

  return {
    year,
    week,
    seasonType,
    hourColumns,
    timelineStartHour,
    timelineMinutes,
    networks,
    gameCount: viewingGames.length,
    weekLabel: formatWeekRange(calWeek?.startDate, calWeek?.endDate),
    saturdayLabel: formatSaturdayLabel(sampleStart),
    startDate: calWeek?.startDate ?? null,
    endDate: calWeek?.endDate ?? null,
  };
}

export async function buildViewingGuide(options: {
  year: number;
  week: number;
  seasonType?: SeasonType;
}): Promise<ViewingGuideData> {
  const seasonType = options.seasonType ?? "regular";
  const { year, week } = options;
  const tier = scheduleCacheTier(year, week);
  const revalidate = CFBD_CACHE_TTL_SECONDS[tier];

  // Bump cache key prefix when guide shape changes
  return unstable_cache(
    () => buildViewingGuideUncached({ year, week, seasonType }),
    ["viewing-guide-v3-saturday-any-kickoff", String(year), String(week), seasonType],
    {
      revalidate,
      tags: [
        `guide:${year}`,
        `guide:${year}:w${week}`,
        `guide:${year}:w${week}:${seasonType}`,
      ],
    },
  )();
}

/**
 * Regular-season weeks through Thanksgiving / rivalry weekend only.
 *
 * CFBD keeps later slots as seasonType "regular" (conference championships,
 * Army–Navy, and sometimes an empty gap week after Thanksgiving). Those all
 * start after Thanksgiving and are dropped from nav + default week.
 *
 * Year-dependent: e.g. 2025 Thanksgiving = week 14; 2026 = week 13.
 */
function isDisplayedRegularWeek(
  week: { seasonType: SeasonType; startDate: string },
  thanksgiving: Date,
): boolean {
  if (week.seasonType !== "regular") return false;
  const start = new Date(week.startDate);
  if (Number.isNaN(start.getTime())) return false;
  // Keep weeks whose Monday start is on/before Thanksgiving (that week's Sat
  // is rivalry weekend). Drop weeks that begin after Thanksgiving.
  return start.getTime() <= thanksgiving.getTime();
}

async function getDisplayedRegularWeeks(year: number) {
  const calendar = await getCalendar(year);
  const thanksgiving = usThanksgivingDate(year);
  return calendar
    .filter((w) => isDisplayedRegularWeek(w, thanksgiving))
    .sort((a, b) => a.week - b.week);
}

export async function resolveDefaultWeek(year: number): Promise<number> {
  try {
    const regular = await getDisplayedRegularWeeks(year);

    if (regular.length === 0) return 1;

    const now = Date.now();
    for (const w of regular) {
      const start = new Date(w.startDate).getTime();
      const end = new Date(w.endDate).getTime();
      if (now >= start && now <= end) return w.week;
    }
    for (const w of regular) {
      if (new Date(w.startDate).getTime() > now) return w.week;
    }
    return regular[regular.length - 1].week;
  } catch {
    return 1;
  }
}

export async function getAvailableWeeks(year: number): Promise<number[]> {
  try {
    const regular = await getDisplayedRegularWeeks(year);
    return regular.map((c) => c.week);
  } catch {
    // Typical FBS regular season through late November (no December slots).
    return Array.from({ length: 14 }, (_, i) => i + 1);
  }
}
