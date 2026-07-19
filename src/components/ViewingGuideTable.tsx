"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { expandNetworkLanes } from "@/lib/cfbd/expand-rows";
import { CalendarGrid } from "./CalendarGrid";
import { computeLayoutFitWidth, layoutFromScale } from "./calendar-layout";
import { ScreenshotModal } from "./ScreenshotModal";

function naturalLayout(hourCount: number) {
  return layoutFromScale(hourCount, 1);
}

export function ViewingGuideTable({ data }: { data: ViewingGuideData }) {
  const [fitToScreen, setFitToScreen] = useState(false);
  const [hideEspnPlus, setHideEspnPlus] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    if (fitToScreen) {
      return computeLayoutFitWidth(
        visibleData.hourColumns.length,
        containerWidth,
      );
    }
    return naturalLayout(visibleData.hourColumns.length);
  }, [visibleData.hourColumns.length, fitToScreen, containerWidth]);

  if (data.networks.length === 0 || data.hourColumns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
        <p className="text-lg font-semibold text-zinc-800">No Saturday games</p>
        <p className="mt-2 text-sm text-zinc-500">
          No FBS games kick off on Saturday (ET) for Week {data.week},{" "}
          {data.year}. Try another week.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

        <button
          type="button"
          onClick={() => setScreenshotOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm cursor-pointer transition hover:bg-emerald-800"
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Screenshot view
        </button>
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
        </div>
      ) : (
        <div
          ref={containerRef}
          className={
            fitToScreen
              ? "overflow-x-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
              : "overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm"
          }
        >
          <CalendarGrid
            data={visibleData}
            lanes={lanes}
            layout={layout}
            fitWidth={fitToScreen}
            className="viewing-guide-table"
          />
        </div>
      )}

      <ScreenshotModal
        data={visibleData}
        open={screenshotOpen}
        onClose={() => setScreenshotOpen(false)}
      />
    </div>
  );
}
