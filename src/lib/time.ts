const DEFAULT_TZ = "America/New_York";

/** Assumed game length for timeline bar width (kickoff → end). */
export const GAME_DURATION_MINUTES = 180;

/**
 * Default calendar origin when no pre-noon Saturday games exist.
 * Earlier hours (e.g. 11am) are only added when a kickoff needs them.
 */
export const DEFAULT_TIMELINE_START_HOUR = 12; // noon ET

export function getDefaultSeasonYear(now = new Date()): number {
  // CFB season year is the calendar year of the fall.
  // From June 1 onward, default to the upcoming season; before that, prior season.
  return now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
}

export type EasternParts = {
  weekday: string;
  year: number;
  month: number;
  day: number;
  hour24: number;
  minute: number;
};

export function getEasternParts(
  iso: string | Date,
  timeZone = DEFAULT_TZ,
): EasternParts | null {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;

  const weekday = get("weekday");
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour24 = Number(get("hour"));
  const minute = Number(get("minute"));

  if (
    !weekday ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour24) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return { weekday, year, month, day, hour24, minute };
}

export function isSaturdayEastern(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const parts = getEasternParts(iso);
  return parts?.weekday === "Sat";
}

/**
 * Minutes from local midnight on Saturday (Eastern) for a kickoff.
 * Includes pre-noon games (e.g. 11:00 → 660). Null if not Saturday / invalid.
 */
export function saturdayMinutesFromMidnight(
  iso: string | null | undefined,
): number | null {
  if (!iso) return null;
  const parts = getEasternParts(iso);
  if (!parts || parts.weekday !== "Sat") return null;
  return parts.hour24 * 60 + parts.minute;
}

/**
 * Default calendar starts at noon. If any Saturday kickoff is earlier,
 * pull the origin back to that kickoff's hour (e.g. 11am only when needed).
 */
export function resolveTimelineStartHour(
  kickoffMinutesFromMidnight: number[],
): number {
  let startHour = DEFAULT_TIMELINE_START_HOUR;

  for (const mins of kickoffMinutesFromMidnight) {
    if (mins < DEFAULT_TIMELINE_START_HOUR * 60) {
      startHour = Math.min(startHour, Math.floor(mins / 60));
    }
  }

  return startHour;
}

export function formatHourLabel(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return "12am";
  if (h === 12) return "Noon";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

/**
 * Continuous hour columns from `startHour` through the last hour needed
 * to show the full 3-hour bar of the latest game (no skipped hours).
 *
 * @param startHour - Eastern wall-clock hour (0–23); usually 12, sometimes 11
 * @param maxEndOffsetMinutes - minutes after timeline origin of the latest bar end
 */
export function buildHourColumns(
  startHour: number,
  maxEndOffsetMinutes: number,
): { hour24: number; label: string; index: number }[] {
  const totalMinutes = Math.max(
    60,
    Math.ceil(Math.max(0, maxEndOffsetMinutes) / 60) * 60,
  );
  const hourCount = Math.max(1, totalMinutes / 60);
  const columns: { hour24: number; label: string; index: number }[] = [];

  for (let i = 0; i < hourCount; i++) {
    const hour24 = (startHour + i) % 24;
    columns.push({
      index: i,
      hour24,
      label: formatHourLabel(hour24),
    });
  }

  return columns;
}

export function formatGameKickoff(
  iso: string | null | undefined,
  timeZone = DEFAULT_TZ,
): string {
  if (!iso) return "TBD";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatWeekRange(
  start: string | null | undefined,
  end: string | null | undefined,
  timeZone = DEFAULT_TZ,
): string | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(s)} – ${fmt.format(e)}`;
}

export function formatSaturdayLabel(
  iso: string | null | undefined,
  timeZone = DEFAULT_TZ,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
