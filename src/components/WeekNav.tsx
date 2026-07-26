"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
            href={`/week/${prev}?year=${year}`}
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
            href={`/week/${next}?year=${year}`}
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

      {/* Week pills — large desktop */}
      <div className="hidden flex-wrap items-center gap-1.5 lg:flex">
        {weeks.map((w) => {
          const active = w === week;
          return (
            <Link
              key={w}
              href={`/week/${w}?year=${year}`}
              className={
                active
                  ? "rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                  : "rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200"
              }
              aria-current={active ? "page" : undefined}
            >
              {w}
            </Link>
          );
        })}
      </div>

      {/*
        Mobile: [←] Week · Season [→]
        sm–lg: Week · Season only (labeled prev/next above)
        lg+: season only (week pills handle week jumps)
      */}
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3",
          "max-sm:w-full max-sm:justify-between",
          "lg:contents",
        )}
      >
        {prev != null ? (
          <Link
            href={`/week/${prev}?year=${year}`}
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

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-3 sm:flex-initial sm:justify-start lg:contents">
          <div className="flex items-center gap-2 lg:hidden">
            <label
              htmlFor="week-select"
              className="text-xs font-medium text-zinc-500"
            >
              Week
            </label>
            <Select
              value={week}
              modal={false}
              onValueChange={(value) => {
                if (value == null) return;
                router.push(`/week/${value}?year=${year}`);
              }}
            >
              <SelectTrigger
                id="week-select"
                size="sm"
                className="min-w-16 tabular-nums"
                aria-label="Select week"
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

          <div className="flex items-center gap-2">
            <label
              htmlFor="year-select"
              className="text-xs font-medium text-zinc-500"
            >
              Season
            </label>
            <Select
              value={year}
              modal={false}
              onValueChange={(value) => {
                if (value == null) return;
                // Always land on week 1 when changing seasons
                router.push(`/week/1?year=${value}`);
              }}
            >
              <SelectTrigger
                id="year-select"
                size="sm"
                className="min-w-20 tabular-nums"
                aria-label="Select season"
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

        {next != null ? (
          <Link
            href={`/week/${next}?year=${year}`}
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
