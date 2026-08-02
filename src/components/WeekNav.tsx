"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { weekPath } from "@/lib/routes";
import { getAllowedSeasonYears } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const arrowBtnClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50";
const arrowBtnDisabledClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-zinc-300";
const nativeSelectClass =
  "h-7 w-full appearance-none rounded-[min(var(--radius-md),10px)] border border-input bg-white py-0 pl-2.5 pr-7 text-sm font-medium tabular-nums outline-none";

export function WeekNav({
  year,
  week,
  weeks,
}: {
  year: number;
  week: number;
  weeks: number[];
}) {
  const router = useRouter();
  const prev = weeks.filter((w) => w < week).at(-1);
  const next = weeks.find((w) => w > week);
  const seasonYears = getAllowedSeasonYears();

  return (
    <nav
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Week navigation"
    >
      {/* Prev / next with labels — tablet & desktop only */}
      <div className="hidden items-center gap-2 sm:flex">
        {prev != null ? (
          <Link
            href={weekPath(year, prev)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            ← Week {prev}
          </Link>
        ) : (
          <span className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-zinc-300">
            ← Week
          </span>
        )}
        {next != null ? (
          <Link
            href={weekPath(year, next)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Week {next} →
          </Link>
        ) : (
          <span className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-zinc-300">
            Week →
          </span>
        )}
      </div>

      {/*
        Mobile: [←] Week · Season [→]
        sm+: Week · Season (labeled prev/next above)
      */}
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3",
          "max-sm:w-full max-sm:justify-between",
        )}
      >
        {prev != null ? (
          <Link
            href={weekPath(year, prev)}
            className={cn(arrowBtnClass, "sm:hidden")}
            aria-label={`Previous week, Week ${prev}`}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        ) : (
          <span className={cn(arrowBtnDisabledClass, "sm:hidden")} aria-hidden>
            <ChevronLeft className="size-5" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-3 sm:flex-initial sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500" id="week-label">
              Week
            </span>
            {/* Native select on mobile for OS picker UX */}
            <div className="relative min-w-16 sm:hidden">
              <select
                value={week}
                aria-labelledby="week-label"
                onChange={(e) => {
                  router.push(weekPath(year, e.target.value));
                }}
                className={nativeSelectClass}
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {/* Custom select on sm+ (all larger breakpoints) */}
            <div className="hidden sm:block">
              <Select
                value={week}
                modal={false}
                onValueChange={(value) => {
                  if (value == null) return;
                  router.push(weekPath(year, value));
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="min-w-16 font-medium tabular-nums"
                  aria-labelledby="week-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {weeks.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500" id="year-label">
              Season
            </span>
            {/* Native select on mobile for OS picker UX */}
            <div className="relative min-w-20 sm:hidden">
              <select
                value={year}
                aria-labelledby="year-label"
                onChange={(e) => {
                  // Always land on week 1 when changing seasons
                  router.push(weekPath(e.target.value, 1));
                }}
                className={nativeSelectClass}
              >
                {seasonYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {/* Custom select on sm+ */}
            <div className="hidden sm:block">
              <Select
                value={year}
                modal={false}
                onValueChange={(value) => {
                  if (value == null) return;
                  // Always land on week 1 when changing seasons
                  router.push(weekPath(value, 1));
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="min-w-20 font-medium tabular-nums"
                  aria-labelledby="year-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {seasonYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {next != null ? (
          <Link
            href={weekPath(year, next)}
            className={cn(arrowBtnClass, "sm:hidden")}
            aria-label={`Next week, Week ${next}`}
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        ) : (
          <span className={cn(arrowBtnDisabledClass, "sm:hidden")} aria-hidden>
            <ChevronRight className="size-5" />
          </span>
        )}
      </div>
    </nav>
  );
}
