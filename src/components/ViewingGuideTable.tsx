"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { expandNetworkLanes } from "@/lib/cfbd/expand-rows";
import {
  CalendarGrid,
  type NetworkLogoDensity,
} from "./CalendarGrid";
import {
  computeLayoutFitWidth,
  layoutFromScale,
  NATURAL_NETWORK_COL_PX,
  NATURAL_TIME_COL_PX,
} from "./calendar-layout";
import { ExportImageModal } from "./ExportImageModal";
import { MobileCalendarFilter } from "./MobileCalendarFilter";
import { ScreenshotModal } from "./ScreenshotModal";
import { cn } from "@/lib/utils";

/** Tailwind `sm` (640px): Fit to Screen is desktop-only below this width. */
const MOBILE_MAX_WIDTH_MQ = "(max-width: 639px)";
/**
 * Tailwind `lg` (1024px): tablet (and below) get reduced network chrome vs desktop.
 */
const TABLET_MAX_WIDTH_MQ = "(max-width: 1023px)";
/** Fraction of natural network column width by density. */
const NETWORK_COL_SCALE: Record<NetworkLogoDensity, number> = {
  default: 1,
  tablet: 0.8,
  mobile: 0.62,
};
/** Mobile-only: slightly narrower hour columns (network col unchanged). */
const MOBILE_TIME_COL_SCALE = 0.86;
/**
 * Container widths at/below this (tablet / small laptop) get taller rows and
 * larger team logos under Fit to Screen — width-fit otherwise shrinks them.
 */
const TABLET_FIT_MAX_CONTAINER_PX = 1100;

function naturalLayout(hourCount: number) {
  return layoutFromScale(hourCount, 1);
}

export function ViewingGuideTable({
  data,
  screenshotOpen,
  onScreenshotOpenChange,
  fitToScreen,
  hideEspnPlus,
  onHideEspnPlusChange,
}: {
  data: ViewingGuideData;
  /** Controlled by page header action (mobile Screenshot view). */
  screenshotOpen: boolean;
  onScreenshotOpenChange: (open: boolean) => void;
  fitToScreen: boolean;
  hideEspnPlus: boolean;
  onHideEspnPlusChange: (value: boolean) => void;
}) {
  /** True below Tailwind `sm`; Fit to Screen is ignored while true. */
  const [isMobile, setIsMobile] = useState(false);
  /** True below Tailwind `lg` (includes phone + tablet). */
  const [isTabletOrBelow, setIsTabletOrBelow] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mobileMq = window.matchMedia(MOBILE_MAX_WIDTH_MQ);
    const tabletMq = window.matchMedia(TABLET_MAX_WIDTH_MQ);
    const sync = () => {
      setIsMobile(mobileMq.matches);
      setIsTabletOrBelow(tabletMq.matches);
    };
    sync();
    mobileMq.addEventListener("change", sync);
    tabletMq.addEventListener("change", sync);
    return () => {
      mobileMq.removeEventListener("change", sync);
      tabletMq.removeEventListener("change", sync);
    };
  }, []);

  const networkLogoDensity: NetworkLogoDensity = isMobile
    ? "mobile"
    : isTabletOrBelow
      ? "tablet"
      : "default";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Preference may be on in sessionStorage; never scale-to-width on mobile. */
  const applyFitToScreen = fitToScreen && !isMobile;

  const hasEspnPlus = useMemo(
    () => data.networks.some((n) => n.network === "ESPN+"),
    [data.networks],
  );

  /** Guide data after optional filters (e.g. Hide ESPN+). */
  const visibleData = useMemo((): ViewingGuideData => {
    if (!hideEspnPlus) return data;
    const networks = data.networks.filter((n) => n.network !== "ESPN+");
    const gameCount = networks.reduce((sum, n) => sum + n.games.length, 0);
    return { ...data, networks, gameCount };
  }, [data, hideEspnPlus]);

  const lanes = useMemo(
    () => expandNetworkLanes(visibleData.networks),
    [visibleData.networks],
  );

  const layout = useMemo(() => {
    const colScale = NETWORK_COL_SCALE[networkLogoDensity];

    if (applyFitToScreen) {
      const base = computeLayoutFitWidth(
        visibleData.hourColumns.length,
        containerWidth,
      );
      // Tablet Fit to Screen: keep width fit, restore legible row/logo size.
      let next =
        containerWidth > 0 && containerWidth <= TABLET_FIT_MAX_CONTAINER_PX
          ? {
              ...base,
              rowHeight: base.rowHeight * 1.4,
              logoSize: Math.max(base.logoSize * 1.45, base.logoSize + 8),
            }
          : base;
      // Mobile/tablet: narrower sticky network column to match logo density.
      if (colScale < 1) {
        const networkCol = Math.round(next.networkCol * colScale);
        next = {
          ...next,
          networkCol,
          tableWidth: networkCol + next.timelineWidth,
        };
      }
      return next;
    }
    const base = naturalLayout(visibleData.hourColumns.length);
    let next = base;
    if (colScale < 1) {
      const networkCol = Math.round(NATURAL_NETWORK_COL_PX * colScale);
      next = {
        ...next,
        networkCol,
        tableWidth: networkCol + next.timelineWidth,
      };
    }
    // Mobile: tighter hour slots; keep network column width as-is.
    if (networkLogoDensity === "mobile") {
      const timeCol = Math.round(NATURAL_TIME_COL_PX * MOBILE_TIME_COL_SCALE);
      const timelineWidth = timeCol * visibleData.hourColumns.length;
      next = {
        ...next,
        timeCol,
        timelineWidth,
        tableWidth: next.networkCol + timelineWidth,
      };
    }
    return next;
  }, [
    visibleData.hourColumns.length,
    applyFitToScreen,
    containerWidth,
    networkLogoDensity,
  ]);

  // Mobile only: filter popover in the network header corner.
  // Desktop/tablet use the inline nav toggles instead.
  const filterControl =
    isMobile && hasEspnPlus ? (
      <MobileCalendarFilter
        hideEspnPlus={hideEspnPlus}
        onHideEspnPlusChange={onHideEspnPlusChange}
      />
    ) : (
      <span className="sr-only">Network</span>
    );

  if (data.networks.length === 0 || data.hourColumns.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-zinc-800">No Saturday games</p>
          <p className="mt-2 text-sm text-zinc-500">
            No FBS games kick off on Saturday (ET) for Week {data.week},{" "}
            {data.year}. Try another week.
          </p>
        </div>
        <ScreenshotModal
          data={visibleData}
          open={screenshotOpen}
          onClose={() => onScreenshotOpenChange(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {visibleData.networks.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-zinc-800">
            No networks to show
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Uncheck &ldquo;Hide ESPN+&rdquo; to see streaming games for this
            week.
          </p>
          {hasEspnPlus ? (
            <div className="mt-6">
              <MobileCalendarFilter
                hideEspnPlus={hideEspnPlus}
                onHideEspnPlusChange={onHideEspnPlusChange}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div
          ref={containerRef}
          className={cn(
            // Full-bleed scrollport (x + y) so sticky headers work edge-to-edge.
            "min-h-0 flex-1 border-y border-zinc-200 bg-white",
            applyFitToScreen
              ? "overflow-x-hidden overflow-y-auto"
              : "overflow-auto",
          )}
        >
          <CalendarGrid
            data={visibleData}
            lanes={lanes}
            layout={layout}
            fitWidth={applyFitToScreen}
            networkLogoDensity={networkLogoDensity}
            className="viewing-guide-table"
            networkCorner={filterControl}
          />
        </div>
      )}

      <ScreenshotModal
        data={visibleData}
        open={screenshotOpen}
        onClose={() => onScreenshotOpenChange(false)}
      />

      {exportOpen ? (
        <ExportImageModal
          data={visibleData}
          onClose={() => setExportOpen(false)}
        />
      ) : null}
    </div>
  );
}
