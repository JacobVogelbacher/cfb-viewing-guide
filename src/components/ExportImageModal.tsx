"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { expandNetworkLanes } from "@/lib/cfbd/expand-rows";
import { formatUnknownError, savePngDataUrl } from "@/lib/download-image";
import {
  EXPORT_TABLE_WIDTH_PX,
  captureCalendarPng,
  exportFilename,
} from "@/lib/export-calendar-image";
import { CalendarGrid } from "./CalendarGrid";
import { computeLayoutFitWidth } from "./calendar-layout";
import { Logo } from "./Logo";

type CaptureStatus = "loading" | "ready" | "error";

/**
 * Mount only while the export UI should be open (parent unmounts on close)
 * so capture state starts clean each time.
 */
export function ExportImageModal({
  data,
  onClose,
}: {
  data: ViewingGuideData;
  onClose: () => void;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const captureGen = useRef(0);
  const [status, setStatus] = useState<CaptureStatus>("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  /** Bumped to re-run capture (retry). */
  const [attempt, setAttempt] = useState(0);

  const lanes = useMemo(
    () => expandNetworkLanes(data.networks),
    [data.networks],
  );

  const layout = useMemo(
    () => computeLayoutFitWidth(data.hourColumns.length, EXPORT_TABLE_WIDTH_PX),
    [data.hourColumns.length],
  );

  const titleLine = useMemo(
    () =>
      [`Week ${data.week}`, String(data.year), data.saturdayLabel || null]
        .filter(Boolean)
        .join(" · "),
    [data.week, data.year, data.saturdayLabel],
  );

  // Body scroll lock + Escape.
  useEffect(() => {
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
  }, [onClose]);

  // Generate PNG once the off-screen surface is mounted.
  useEffect(() => {
    if (data.networks.length === 0 || data.hourColumns.length === 0) {
      // Async to satisfy react-hooks/set-state-in-effect (external sync path).
      const t = window.setTimeout(() => {
        setStatus("error");
        setError("No networks to export for this week.");
        setImageUrl(null);
      }, 0);
      return () => window.clearTimeout(t);
    }

    const root = captureRef.current;
    if (!root) {
      const t = window.setTimeout(() => {
        setStatus("error");
        setError("Export surface is not ready. Close and try again.");
      }, 0);
      return () => window.clearTimeout(t);
    }

    const gen = ++captureGen.current;
    let cancelled = false;

    const t = window.setTimeout(() => {
      if (cancelled || gen !== captureGen.current) return;
      setStatus("loading");
      setError(null);
      setImageUrl(null);

      void (async () => {
        try {
          const dataUrl = await captureCalendarPng(root);
          if (cancelled || gen !== captureGen.current) return;
          setImageUrl(dataUrl);
          setStatus("ready");
        } catch (err) {
          if (cancelled || gen !== captureGen.current) return;
          console.error("[export] capture failed", err);
          setError(formatUnknownError(err));
          setStatus("error");
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [data, attempt]);

  async function handleDownload() {
    if (!imageUrl || downloading) return;
    setDownloading(true);
    setError(null);
    try {
      await savePngDataUrl(imageUrl, exportFilename(data.week, data.year));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(formatUnknownError(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      role="dialog"
      aria-modal="true"
      aria-label="Save calendar image"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{titleLine}</p>
          <p className="text-[11px] text-zinc-400">
            Right-click or long-press the image to save
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status === "ready" && imageUrl ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm cursor-pointer transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? "Saving…" : "Download"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm cursor-pointer transition hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto bg-zinc-900 p-3 sm:p-4">
        {status === "loading" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-300">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400"
              aria-hidden
            />
            <p className="text-sm font-medium">Generating image…</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm font-semibold text-red-300">
              Could not generate image
            </p>
            <p className="max-w-md text-xs text-zinc-400">
              {error ?? "Unknown error"}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100"
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === "ready" && imageUrl ? (
          <div className="mx-auto w-full max-w-[1080px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG data URL for save */}
            <img
              src={imageUrl}
              alt={`CFB Saturday viewing guide, week ${data.week}, ${data.year}`}
              className="mx-auto h-auto w-full rounded-lg bg-white shadow-lg"
              draggable={false}
            />
            {error ? (
              <p className="mt-2 text-center text-xs text-amber-300">{error}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/*
        Off-viewport capture surface: real layout at fixed width so the PNG
        is never squished to the phone viewport. Not display:none (html-to-image
        needs laid-out boxes).
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[10000px] z-[-1] overflow-hidden"
        style={{ width: EXPORT_TABLE_WIDTH_PX }}
      >
        <div
          ref={captureRef}
          className="bg-white text-zinc-900"
          style={{ width: EXPORT_TABLE_WIDTH_PX }}
        >
          <header
            className="flex justify-between items-center border-b border-zinc-200 px-4 py-3"
            style={{ width: EXPORT_TABLE_WIDTH_PX }}
          >
            <Logo />
            <p className="mt-0.5 text-base font-bold text-zinc-900">
              {titleLine}
            </p>
          </header>
          {data.networks.length > 0 && data.hourColumns.length > 0 ? (
            <CalendarGrid
              data={data}
              lanes={lanes}
              layout={layout}
              fitWidth={false}
              mobileScreenshot={false}
              disableSticky
              className="viewing-guide-export"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
