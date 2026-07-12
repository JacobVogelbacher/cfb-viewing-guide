export type SeasonType =
  | "regular"
  | "postseason"
  | "both"
  | "allstar"
  | "spring_regular"
  | "spring_postseason";

export type DivisionClassification = "fbs" | "fcs" | "ii" | "iii";

export type MediaType = "tv" | "radio" | "web" | "ppv" | "mobile";

export interface CfbdGame {
  id: number;
  season: number;
  week: number;
  seasonType: SeasonType;
  startDate: string;
  startTimeTBD: boolean | null;
  completed: boolean | null;
  neutralSite: boolean | null;
  conferenceGame: boolean | null;
  attendance: number | null;
  venueId: number | null;
  venue: string | null;
  homeId: number;
  homeTeam: string;
  homeConference: string | null;
  homeClassification: DivisionClassification | null;
  homePoints: number | null;
  awayId: number;
  awayTeam: string;
  awayConference: string | null;
  awayClassification: DivisionClassification | null;
  awayPoints: number | null;
  notes: string | null;
}

export interface CfbdGameMedia {
  id: number;
  season: number;
  week: number;
  seasonType: SeasonType;
  startTime: string | null;
  isStartTimeTBD: boolean | null;
  homeTeam: string;
  homeConference: string | null;
  awayTeam: string;
  awayConference: string | null;
  mediaType: MediaType | string;
  outlet: string;
}

export interface CfbdTeam {
  id: number;
  school: string;
  mascot: string | null;
  abbreviation: string | null;
  alternateNames: string[] | null;
  conference: string | null;
  classification: string | null;
  color: string | null;
  alternateColor: string | null;
  logos: string[] | null;
}

export interface CfbdCalendarWeek {
  season: number;
  week: number;
  seasonType: SeasonType;
  startDate: string;
  endDate: string;
  firstGameStart: string | null;
  lastGameStart: string | null;
}

export interface ViewingGame {
  id: number;
  awayTeam: string;
  homeTeam: string;
  awayLogo: string | null;
  homeLogo: string | null;
  awayColor: string | null;
  homeColor: string | null;
  startTime: string | null;
  isStartTimeTbd: boolean;
  outlet: string;
  venue: string | null;
  neutralSite: boolean;
  conferenceGame: boolean;
  completed: boolean;
  awayPoints: number | null;
  homePoints: number | null;
  notes: string | null;
  /**
   * Minutes after the guide timeline origin until kickoff.
   * Origin is usually Saturday noon ET; earlier (e.g. 11am) only when needed.
   * Quarter-hours place the bar mid-column (:30 = halfway through the hour).
   */
  startOffsetMinutes: number;
  /** Timeline bar length (default 180 = 3 hours). */
  durationMinutes: number;
}

export interface HourColumn {
  /** 0-based index from the timeline origin hour. */
  index: number;
  /** Hour in 0–23 (Eastern wall clock). */
  hour24: number;
  /** Display label: 11am, Noon, 1pm, … */
  label: string;
}

export interface NetworkRow {
  network: string;
  displayName: string;
  games: ViewingGame[];
}

export interface ViewingGuideData {
  year: number;
  week: number;
  seasonType: SeasonType;
  /**
   * Continuous hour headers from timeline origin → last needed hour (no gaps).
   * Origin defaults to noon; pre-noon hours appear only when a game needs them.
   */
  hourColumns: HourColumn[];
  /** Eastern hour where the calendar starts (usually 12). */
  timelineStartHour: number;
  /** Total timeline length in minutes (hourColumns.length * 60). */
  timelineMinutes: number;
  networks: NetworkRow[];
  gameCount: number;
  weekLabel: string | null;
  saturdayLabel: string | null;
  startDate: string | null;
  endDate: string | null;
}
