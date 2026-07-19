import type { ViewingGuideData } from "@/lib/cfbd/types";
import type { NetworkLane } from "@/lib/cfbd/expand-rows";
import { getNetworkLogo, NETWORK_COLORS } from "@/lib/networks";
import type { CalendarLayout } from "./calendar-layout";
import { MatchupCard } from "./MatchupCard";

function NetworkLabel({
  network,
  displayName,
  accent,
  scale,
  networkFontPx,
  networkBadgeMinH,
  networkBadgeMinW,
  cellPadY,
}: {
  network: string;
  displayName: string;
  accent: string;
  scale: number;
  networkFontPx: number;
  networkBadgeMinH: number;
  networkBadgeMinW: number;
  cellPadY: number;
}) {
  const logo = getNetworkLogo(network);
  if (logo) {
    const boxScale = logo.boxScale ?? 1;
    const logoH = Math.max(16, Math.round(30 * scale * boxScale));
    const logoW = Math.max(40, Math.round(80 * scale * boxScale));
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
}: {
  data: ViewingGuideData;
  lanes: NetworkLane[];
  layout: CalendarLayout;
  /** When true, table stretches to 100% width with equal % hour columns. */
  fitWidth?: boolean;
  className?: string;
}) {
  const timelineMinutes = data.timelineMinutes;
  const {
    timeCol,
    networkCol,
    rowHeight,
    headerHeight,
    logoSize,
    tableWidth,
    timelineWidth,
    scale,
  } = layout;

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
      {/* Header */}
      <div
        className="flex border-b border-zinc-300 bg-zinc-900 text-white"
        style={{
          width: fitWidth ? "100%" : tableWidth,
          height: headerHeight,
        }}
      >
        <div
          className="sticky left-0 z-20 flex shrink-0 items-center justify-center border-r border-zinc-700 bg-zinc-900 px-1"
          style={{ width: networkCol, minWidth: networkCol }}
        >
          <span className="sr-only">Network</span>
        </div>
        <div
          className="flex min-w-0 flex-1"
          style={{ width: fitWidth ? undefined : timelineWidth }}
        >
          {data.hourColumns.map((col) => (
            <div
              key={col.index}
              className="flex shrink-0 items-center justify-center border-r border-zinc-700 px-0.5 text-center font-bold uppercase tracking-wide text-zinc-100 last:border-r-0"
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
              <span className="block truncate">{col.label}</span>
            </div>
          ))}
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
              className={`sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-zinc-200 px-1 ${
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
                const widthPct =
                  (game.durationMinutes / timelineMinutes) * 100;
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
