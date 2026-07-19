"use client";

import Link from "next/link";
import { getAllowedSeasonYears } from "@/lib/time";

export function WeekNav({
  year,
  week,
  weeks,
}: {
  year: number;
  week: number;
  weeks: number[];
}) {
  const prev = weeks.filter((w) => w < week).at(-1);
  const next = weeks.find((w) => w > week);
  const seasonYears = getAllowedSeasonYears();

  return (
    <nav
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Week navigation"
    >
      <div className="flex items-center gap-2">
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

      {/* Week pills — sm and up */}
      <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
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

      <div className="flex flex-wrap items-center gap-3 sm:contents">
        {/* Week dropdown — mobile only (same pattern as season select) */}
        <form
          action="/week"
          method="get"
          className="flex items-center gap-2 sm:hidden"
        >
          <label htmlFor="week" className="text-xs font-medium text-zinc-500">
            Week
          </label>
          <input type="hidden" name="year" value={year} />
          <select
            id="week"
            name="week"
            defaultValue={week}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm tabular-nums shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {weeks.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </form>

        <form action="/week" method="get" className="flex items-center gap-2">
          <label htmlFor="year" className="text-xs font-medium text-zinc-500">
            Season
          </label>
          {/* Always land on week 1 when changing seasons */}
          <input type="hidden" name="week" value={1} />
          <select
            id="year"
            name="year"
            defaultValue={year}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm tabular-nums shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {seasonYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </form>
      </div>
    </nav>
  );
}
