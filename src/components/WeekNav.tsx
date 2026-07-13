import Link from "next/link";

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

      <div className="flex flex-wrap items-center gap-1.5">
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

      <form action="/week" method="get" className="flex items-center gap-2">
        <label htmlFor="year" className="text-xs font-medium text-zinc-500">
          Season
        </label>
        <input type="hidden" name="week" value={week} />
        <input
          id="year"
          name="year"
          type="number"
          min={2000}
          max={2100}
          defaultValue={year}
          className="w-20 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm tabular-nums shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer transition hover:bg-zinc-700"
        >
          Go
        </button>
      </form>
    </nav>
  );
}
