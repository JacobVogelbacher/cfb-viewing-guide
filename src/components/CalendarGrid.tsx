import type { ViewingGuideData } from "@/lib/cfbd/types";
import type { NetworkLane } from "@/lib/cfbd/expand-rows";
import { getNetworkLogo, NETWORK_COLORS } from "@/lib/networks";
import type { CalendarLayout } from "./calendar-layout";
import { MatchupCard } from "./MatchupCard";
import { cn } from "@/lib/utils";

/** Network logo box density for the sticky column (main table only). */
export type NetworkLogoDensity = "default" | "tablet" | "mobile";

const NETWORK_LOGO_BOX: Record<
  NetworkLogoDensity,
  { baseH: number; baseW: number; minH: number; minW: number }
> = {
  // Full desktop marks
  default: { baseH: 30, baseW: 80, minH: 16, minW: 40 },
  // Between mobile and desktop
  tablet: { baseH: 24, baseW: 64, minH: 14, minW: 36 },
  // Narrow phones — ~60% of desktop
  mobile: { baseH: 18, baseW: 48, minH: 12, minW: 28 },
};

function NetworkLabel({
  network,
  displayName,
  accent,
  scale,
  networkFontPx,
  networkBadgeMinH,
  networkBadgeMinW,
  cellPadY,
  logoDensity = "default",
}: {
  network: string;
  displayName: string;
  accent: string;
  scale: number;
  networkFontPx: number;
  networkBadgeMinH: number;
  networkBadgeMinW: number;
  cellPadY: number;
  logoDensity?: NetworkLogoDensity;
}) {
  const logo = getNetworkLogo(network);
  if (logo) {
    const boxScale = logo.boxScale ?? 1;
    const { baseH, baseW, minH, minW } = NETWORK_LOGO_BOX[logoDensity];
    const logoH = Math.max(minH, Math.round(baseH * scale * boxScale));
    const logoW = Math.max(minW, Math.round(baseW * scale * boxScale));
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local static SVG from /public
      <img
        src={logo.src}
        alt={displayName}
        title={displayName}
        width={logoW}
        height={logoH}
        className="max-w-full object-contain object-center"
        style={{ width: logoW, height: logoH }}
      />
    );
  }

  return (
    <span
      className="inline-flex max-w-full items-center justify-center rounded px-1 font-extrabold leading-tight tracking-tight text-white"
      style={{
        backgroundColor: accent,
        fontSize: networkFontPx,
        minHeight: networkBadgeMinH,
        minWidth: networkBadgeMinW,
        paddingTop: Math.max(1, cellPadY / 2),
        paddingBottom: Math.max(1, cellPadY / 2),
      }}
      title={displayName}
    >
      {displayName}
    </span>
  );
}

export function CalendarGrid({
  data,
  lanes,
  layout,
  fitWidth,
  className,
  /**
   * Screenshot view: roomier vertical chrome (headers, rows, logos). Width is
   * already fit to the stage; height can grow with scroll.
   */
  screenshotLayout = false,
  /**
   * Drop sticky network columns (html-to-image / canvas capture often mishandles
   * position:sticky). Use for fixed-width PNG export.
   */
  disableSticky = false,
  /** Mobile/tablet: smaller network logos in the sticky column. */
  networkLogoDensity = "default",
}: {
  data: ViewingGuideData;
  lanes: NetworkLane[];
  layout: CalendarLayout;
  /** When true, table stretches to 100% width with equal % hour columns. */
  fitWidth?: boolean;
  className?: string;
  screenshotLayout?: boolean;
  disableSticky?: boolean;
  networkLogoDensity?: NetworkLogoDensity;
}) {
  const networkColPosition = disableSticky ? "relative" : "sticky";
  const timelineMinutes = data.timelineMinutes;
  const {
    timeCol,
    networkCol,
    rowHeight: baseRowHeight,
    headerHeight: baseHeaderHeight,
    logoSize: baseLogoSize,
    tableWidth,
    timelineWidth,
    scale,
  } = layout;

  // Screenshot mode: taller rows + larger team marks (vertical space is free).
  const rowHeight = screenshotLayout ? baseRowHeight * 2 : baseRowHeight;
  const logoSize = screenshotLayout
    ? Math.max(baseLogoSize * 1.55, baseLogoSize + 15)
    : baseLogoSize;
  const headerHeight = screenshotLayout ? baseHeaderHeight : baseHeaderHeight;

  let networkGroupIndex = -1;
  const groupIndexByRow = lanes.map((lane) => {
    if (lane.isFirstLane) networkGroupIndex += 1;
    return networkGroupIndex;
  });

  const headerFontPx = Math.max(7, Math.round(11 * scale));
  const networkFontPx = Math.max(7, Math.round(11 * scale));
  const networkBadgeMinH = Math.max(14, Math.round(32 * scale));
  const networkBadgeMinW = Math.max(24, Math.round(72 * scale));
  const cellPadY = Math.max(1, Math.round(6 * scale));
  const barPadX = Math.max(0.5, Math.round(2 * scale));

  return (
    <div
      className={className}
      style={{
        width: fitWidth ? "100%" : tableWidth,
        minWidth: fitWidth ? undefined : tableWidth,
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header — same off-white as even body rows (bg-zinc-50 / #fafafa) */}
      <div
        className="flex border-b border-zinc-300 bg-zinc-50 text-zinc-800"
        style={{
          width: fitWidth ? "100%" : tableWidth,
        }}
      >
        <div
          className={`${networkColPosition} left-0 z-20 flex shrink-0 items-center justify-center border-r border-zinc-200 bg-zinc-50 px-1`}
          style={{ width: networkCol, minWidth: networkCol }}
        >
          <span className="sr-only">Network</span>
        </div>
        <div
          className="flex min-w-0 flex-1"
          style={{ width: fitWidth ? undefined : timelineWidth }}
        >
          {data.hourColumns.map((col) => {
            // Compact noon label in screenshot mode / narrow Fit to Screen.
            const isNoon = col.hour24 === 12;
            const label =
              isNoon && screenshotLayout ? (
                "12PM"
              ) : isNoon && fitWidth ? (
                <>
                  <span className="sm:hidden">12pm</span>
                  <span className="hidden sm:inline">{col.label}</span>
                </>
              ) : (
                col.label
              );
            return (
              <div
                key={col.index}
                className={cn(
                  "flex shrink-0 items-center justify-center py-2 border-r border-zinc-200 px-0.5 text-center font-bold uppercase tracking-wide text-zinc-700 last:border-r-0",
                  screenshotLayout && "py-1",
                )}
                style={{
                  width: fitWidth
                    ? `${100 / data.hourColumns.length}%`
                    : timeCol,
                  flexBasis: fitWidth
                    ? `${100 / data.hourColumns.length}%`
                    : timeCol,
                  fontSize: headerFontPx,
                }}
              >
                <span className="block truncate">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {lanes.map((lane, rowIndex) => {
        const accent = NETWORK_COLORS[lane.network] ?? "#3f3f46";
        const groupIndex = groupIndexByRow[rowIndex];
        const stickyBg = groupIndex % 2 === 0 ? "#ffffff" : "#fafafa";
        const rowBg = groupIndex % 2 === 0 ? "bg-white" : "bg-zinc-50";
        const showNetworkLabel = lane.isFirstLane;
        // Multi-lane networks: no bottom border on the sticky network column
        // until the last lane, so stacked rows read as one network cell.
        const isLastLaneOfNetwork = lane.laneIndex === lane.laneCount - 1;

        return (
          <div
            key={`${lane.network}-lane-${lane.laneIndex}`}
            className={`flex ${rowBg}`}
            style={{
              width: fitWidth ? "100%" : tableWidth,
              height: rowHeight,
            }}
          >
            <div
              className={`${networkColPosition} left-0 z-10 flex shrink-0 items-center justify-center border-r border-zinc-200 px-1 ${
                isLastLaneOfNetwork ? "border-b border-zinc-200" : ""
              }`}
              style={{
                width: networkCol,
                minWidth: networkCol,
                backgroundColor: stickyBg,
              }}
            >
              {showNetworkLabel ? (
                <NetworkLabel
                  network={lane.network}
                  displayName={lane.displayName}
                  accent={accent}
                  scale={scale}
                  networkFontPx={networkFontPx}
                  networkBadgeMinH={networkBadgeMinH}
                  networkBadgeMinW={networkBadgeMinW}
                  cellPadY={cellPadY}
                  logoDensity={networkLogoDensity}
                />
              ) : (
                <span className="sr-only">
                  {lane.displayName} (row {lane.laneIndex + 1})
                </span>
              )}
            </div>

            <div
              className="relative min-w-0 flex-1 border-b border-zinc-200"
              style={{
                width: fitWidth ? undefined : timelineWidth,
                height: rowHeight,
              }}
            >
              <div className="pointer-events-none absolute inset-0 flex">
                {data.hourColumns.map((col) => (
                  <div
                    key={col.index}
                    className="relative h-full shrink-0 border-r border-zinc-300 last:border-r-0"
                    style={{
                      width: fitWidth
                        ? `${100 / data.hourColumns.length}%`
                        : timeCol,
                      flexBasis: fitWidth
                        ? `${100 / data.hourColumns.length}%`
                        : timeCol,
                    }}
                  >
                    <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-200/70" />
                  </div>
                ))}
              </div>

              {lane.games.map((game) => {
                const leftPct =
                  (game.startOffsetMinutes / timelineMinutes) * 100;
                const widthPct = (game.durationMinutes / timelineMinutes) * 100;
                const clampedWidth = Math.min(
                  widthPct,
                  Math.max(0, 100 - leftPct),
                );

                return (
                  <div
                    key={game.id}
                    className="absolute z-[1]"
                    style={{
                      left: `${leftPct}%`,
                      width: `${clampedWidth}%`,
                      top: cellPadY,
                      bottom: cellPadY,
                      paddingLeft: barPadX,
                      paddingRight: barPadX,
                    }}
                  >
                    <MatchupCard game={game} logoSizePx={logoSize} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
