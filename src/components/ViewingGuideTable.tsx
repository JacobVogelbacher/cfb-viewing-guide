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
} from "./calendar-layout";
import { ExportImageModal } from "./ExportImageModal";
import { MobileCalendarFilter } from "./MobileCalendarFilter";
import { ScreenshotModal } from "./ScreenshotModal";
import { cn } from "@/lib/utils";

const PREF_FIT_TO_SCREEN = "cfb-guide:fitToScreen";
const PREF_HIDE_ESPN_PLUS = "cfb-guide:hideEspnPlus";
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
/**
 * Container widths at/below this (tablet / small laptop) get taller rows and
 * larger team logos under Fit to Screen — width-fit otherwise shrinks them.
 */
const TABLET_FIT_MAX_CONTAINER_PX = 1100;

function readSessionBool(key: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // sessionStorage unavailable (private mode, SSR, etc.)
  }
  return null;
}

function writeSessionBool(key: string, value: boolean) {
  try {
    sessionStorage.setItem(key, value ? "true" : "false");
  } catch {
    // ignore quota / access errors
  }
}

function naturalLayout(hourCount: number) {
  return layoutFromScale(hourCount, 1);
}

export function ViewingGuideTable({
  data,
  screenshotOpen,
  onScreenshotOpenChange,
}: {
  data: ViewingGuideData;
  /** Controlled by page header action (mobile Screenshot view). */
  screenshotOpen: boolean;
  onScreenshotOpenChange: (open: boolean) => void;
}) {
  const [fitToScreen, setFitToScreen] = useState(false);
  const [hideEspnPlus, setHideEspnPlus] = useState(false);
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  /** True below Tailwind `sm`; Fit to Screen is ignored while true. */
  const [isMobile, setIsMobile] = useState(false);
  /** True below Tailwind `lg` (includes phone + tablet). */
  const [isTabletOrBelow, setIsTabletOrBelow] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore UI prefs from sessionStorage after mount (avoid SSR mismatch).
  useEffect(() => {
    const fit = readSessionBool(PREF_FIT_TO_SCREEN);
    const hide = readSessionBool(PREF_HIDE_ESPN_PLUS);
    if (fit !== null) setFitToScreen(fit);
    if (hide !== null) setHideEspnPlus(hide);
    setPrefsHydrated(true);
  }, []);

  // Persist when the user toggles (skip the initial default false,false write).
  useEffect(() => {
    if (!prefsHydrated) return;
    writeSessionBool(PREF_FIT_TO_SCREEN, fitToScreen);
    writeSessionBool(PREF_HIDE_ESPN_PLUS, hideEspnPlus);
  }, [fitToScreen, hideEspnPlus, prefsHydrated]);

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
    if (colScale < 1) {
      const networkCol = Math.round(NATURAL_NETWORK_COL_PX * colScale);
      return {
        ...base,
        networkCol,
        tableWidth: networkCol + base.timelineWidth,
      };
    }
    return base;
  }, [
    visibleData.hourColumns.length,
    applyFitToScreen,
    containerWidth,
    networkLogoDensity,
  ]);

  if (data.networks.length === 0 || data.hourColumns.length === 0) {
    return (
      <>
        <div className="sm:rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
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
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-3 max-sm:overflow-hidden sm:px-6 lg:px-8">
      {/* sm+ only — mobile uses header screenshot + calendar filter controls */}
      <div className="hidden shrink-0 flex-wrap items-center gap-2 sm:flex sm:gap-3">
        <label className="inline-flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:ring-offset-1"
            checked={fitToScreen}
            onChange={(e) => setFitToScreen(e.target.checked)}
          />
          <span>Fit to Screen</span>
        </label>

        {hasEspnPlus ? (
          <label className="inline-flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:ring-offset-1"
              checked={hideEspnPlus}
              onChange={(e) => setHideEspnPlus(e.target.checked)}
            />
            <span>Hide ESPN+</span>
          </label>
        ) : null}

        {/* // ! Hiding this for now since the team logos were showing up blank on prod */}
        {/* <button
          type="button"
          onClick={() => setExportOpen(true)}
          disabled={visibleData.networks.length === 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Save image
        </button> */}
      </div>

      {visibleData.networks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-zinc-800">
            No networks to show
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Uncheck &ldquo;Hide ESPN+&rdquo; to see streaming games for this
            week.
          </p>
          {/* Toolbar control is sm+ only; keep a mobile escape hatch when the grid is gone. */}
          {hasEspnPlus ? (
            <label className="mt-6 inline-flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 sm:hidden">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:ring-offset-1"
                checked={hideEspnPlus}
                onChange={(e) => setHideEspnPlus(e.target.checked)}
              />
              <span>Hide ESPN+</span>
            </label>
          ) : null}
        </div>
      ) : (
        <div
          ref={containerRef}
          className={cn(
            "min-h-0 border border-zinc-200 bg-white shadow-sm max-sm:flex-1 max-sm:overflow-auto sm:rounded-xl",
            // Mobile: one scrollport (x + y) so hour header can stick inside it.
            // Desktop/tablet: horizontal scroll only; page scrolls vertically.
            applyFitToScreen
              ? "sm:overflow-x-hidden sm:overflow-y-visible"
              : "sm:overflow-x-auto sm:overflow-y-visible",
          )}
        >
          <CalendarGrid
            data={visibleData}
            lanes={lanes}
            layout={layout}
            fitWidth={applyFitToScreen}
            networkLogoDensity={networkLogoDensity}
            className="viewing-guide-table"
            networkCorner={
              hasEspnPlus ? (
                <MobileCalendarFilter
                  hideEspnPlus={hideEspnPlus}
                  onHideEspnPlusChange={setHideEspnPlus}
                />
              ) : (
                <span className="sr-only">Network</span>
              )
            }
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
