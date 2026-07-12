import type { NetworkRow, ViewingGame } from "./types";

/** One horizontal lane: non-overlapping 3-hour game bars. */
export type NetworkLane = {
  network: string;
  displayName: string;
  isFirstLane: boolean;
  laneCount: number;
  laneIndex: number;
  games: ViewingGame[];
};

function intervalsOverlap(a: ViewingGame, b: ViewingGame): boolean {
  const aEnd = a.startOffsetMinutes + a.durationMinutes;
  const bEnd = b.startOffsetMinutes + b.durationMinutes;
  return a.startOffsetMinutes < bEnd && b.startOffsetMinutes < aEnd;
}

/**
 * Pack each network's Saturday games into lanes so 3-hour bars
 * never overlap on the same row (Action Network-style multi-row ESPN+).
 */
export function expandNetworkLanes(networks: NetworkRow[]): NetworkLane[] {
  const result: NetworkLane[] = [];

  for (const network of networks) {
    const sorted = [...network.games].sort(
      (a, b) =>
        a.startOffsetMinutes - b.startOffsetMinutes ||
        a.awayTeam.localeCompare(b.awayTeam),
    );

    const packed: ViewingGame[][] = [];
    for (const game of sorted) {
      let placed = false;
      for (const lane of packed) {
        if (!lane.some((other) => intervalsOverlap(game, other))) {
          lane.push(game);
          placed = true;
          break;
        }
      }
      if (!placed) packed.push([game]);
    }

    // Empty network shouldn't appear, but keep one blank row if it does
    if (packed.length === 0) packed.push([]);

    const laneCount = packed.length;
    packed.forEach((games, laneIndex) => {
      result.push({
        network: network.network,
        displayName: network.displayName,
        isFirstLane: laneIndex === 0,
        laneCount,
        laneIndex,
        games,
      });
    });
  }

  return result;
}
