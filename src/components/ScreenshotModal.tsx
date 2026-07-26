"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { XIcon } from "lucide-react";

import type { ViewingGuideData } from "@/lib/cfbd/types";
import { expandNetworkLanes } from "@/lib/cfbd/expand-rows";
import { CalendarGrid } from "./CalendarGrid";
import { computeLayoutFitWidth } from "./calendar-layout";
import { Logo } from "./Logo";

/**
 * Device screenshot mode: scale the calendar to the stage **width** only
 * (uniform zoom — not height-fit). That keeps the guide legible and fully
 * capturable in a full-page screenshot: no horizontal overflow, vertical
 * scroll is fine.
 */
export function ScreenshotModal({
  data,
  open,
  onClose,
}: {
  data: ViewingGuideData;
  open: boolean;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);

  const lanes = useMemo(
    () => expandNetworkLanes(data.networks),
    [data.networks],
  );

  /** Width-only scale: never compress to fit the viewport height. */
  const layout = useMemo(
    () => computeLayoutFitWidth(data.hourColumns.length, stageWidth),
    [data.hourColumns.length, stageWidth],
  );

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;

    const update = () => setStageWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot view of Saturday calendar"
    >
      {/* Compact chrome — stay out of the white capture surface */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.saturdayLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-black shrink-0 rounded-lg border bg-white"
        >
          <XIcon />
        </button>
      </div>

      {/*
        Vertical scroll only. Calendar is scaled to stage width (uniform zoom)
        so full-page screenshots include every network without horizontal crop.
      */}
      <div
        ref={stageRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white"
      >
        {stageWidth > 0 ? (
          <div className="bg-white text-zinc-900" style={{ width: stageWidth }}>
            <header className="flex justify-between items-center border-b border-zinc-200 px-3 py-2.5 sm:px-4 sm:py-3">
              <Logo size="sm" />

              <p className="truncate text-sm font-semibold">
                Week {data.week} &bull; {data.year}
              </p>
            </header>

            {data.networks.length > 0 && data.hourColumns.length > 0 ? (
              <CalendarGrid
                data={data}
                lanes={lanes}
                layout={layout}
                fitWidth
                screenshotLayout
                className="viewing-guide-table"
              />
            ) : (
              <p className="px-4 py-12 text-center text-sm text-zinc-500">
                No networks to show for this week.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
