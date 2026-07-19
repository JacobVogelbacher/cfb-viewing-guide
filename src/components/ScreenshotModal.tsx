"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { expandNetworkLanes } from "@/lib/cfbd/expand-rows";
import { CalendarGrid } from "./CalendarGrid";
import { fitScaleToViewport, layoutFromScale } from "./calendar-layout";

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
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  /** Narrow viewports: compact noon label + roomier time-header padding. */
  const [mobileScreenshot, setMobileScreenshot] = useState(false);

  const lanes = useMemo(
    () => expandNetworkLanes(data.networks),
    [data.networks],
  );

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const mq = window.matchMedia("(max-width: 639px)");
    const syncMobile = () => setMobileScreenshot(mq.matches);
    syncMobile();
    mq.addEventListener("change", syncMobile);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", syncMobile);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;

    const update = () => {
      setStageSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const layout = useMemo(() => {
    const scale = fitScaleToViewport(
      data.hourColumns.length,
      lanes.length,
      stageSize.width,
      stageSize.height,
    );
    return layoutFromScale(data.hourColumns.length, scale);
  }, [data.hourColumns.length, lanes.length, stageSize]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot view of Saturday calendar"
    >
      {/* Compact chrome — stay out of the way for OS screenshots */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            Week {data.week} · {data.year}
            {data.saturdayLabel ? ` · ${data.saturdayLabel}` : ""}
          </p>
          <p className="text-[11px] text-zinc-400">
            Take a screenshot with your device
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100"
        >
          Close
        </button>
      </div>

      {/* Stage: calendar scaled to fit width + height of remaining viewport */}
      <div
        ref={stageRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white p-1 sm:p-2"
      >
        {stageSize.width > 0 && stageSize.height > 0 ? (
          <CalendarGrid
            data={data}
            lanes={lanes}
            layout={layout}
            mobileScreenshot={mobileScreenshot}
            className="viewing-guide-table shadow-sm"
          />
        ) : null}
      </div>
    </div>
  );
}
