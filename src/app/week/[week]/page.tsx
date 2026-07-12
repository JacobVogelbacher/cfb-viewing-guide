import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewingGuideTable } from "@/components/ViewingGuideTable";
import { WeekNav } from "@/components/WeekNav";
import {
  buildViewingGuide,
  getAvailableWeeks,
} from "@/lib/cfbd/build-guide";
import { formatUsageLine, getCfbdUsage } from "@/lib/cfbd/usage";
import { getDefaultSeasonYear } from "@/lib/time";

type PageProps = {
  params: Promise<{ week: string }>;
  searchParams: Promise<{ year?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { week: weekParam } = await params;
  const { year: yearParam } = await searchParams;
  const week = Number(weekParam);
  const year = yearParam ? Number(yearParam) : getDefaultSeasonYear();
  return {
    title: `Week ${week} Viewing Guide · ${year} CFB`,
    description: `College football TV schedule for Week ${week} of the ${year} season — network-by-network, time-slot grid.`,
  };
}

export default async function WeekPage({ params, searchParams }: PageProps) {
  const { week: weekParam } = await params;
  const { year: yearParam } = await searchParams;

  const week = Number(weekParam);
  if (!Number.isInteger(week) || week < 0 || week > 20) {
    notFound();
  }

  const year = yearParam ? Number(yearParam) : getDefaultSeasonYear();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    notFound();
  }

  if (!process.env.CFBD_API_KEY) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-xl font-bold text-amber-950">
            CFBD API key required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-amber-900/80">
            This app needs a College Football Data API key. Get a free key at{" "}
            <a
              href="https://collegefootballdata.com/key"
              className="font-semibold underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              collegefootballdata.com/key
            </a>
            , then create{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            with:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-emerald-300">
            CFBD_API_KEY=your_key_here
          </pre>
          <p className="mt-4 text-sm text-amber-900/70">
            Restart the dev server after adding the key.
          </p>
        </div>
      </main>
    );
  }

  let data;
  let weeks: number[];
  try {
    [data, weeks] = await Promise.all([
      buildViewingGuide({ year, week }),
      getAvailableWeeks(year),
    ]);
    // Snapshot after work so logs reflect any network calls made for this render.
    console.info(
      `[CFBD] guide week=${week} year=${year} · ${formatUsageLine(getCfbdUsage())}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-bold text-red-950">
            Failed to load schedule
          </h1>
          <p className="mt-3 text-sm text-red-900/80">{message}</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-red-800 underline"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (weeks.length === 0) {
    weeks = [week];
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          College Football Viewing Guide
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
              Week {week}
              <span className="ml-2 text-lg font-semibold text-zinc-400 sm:text-xl">
                {year} Season
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {data.saturdayLabel
                ? `${data.saturdayLabel} · `
                : data.weekLabel
                  ? `${data.weekLabel} · `
                  : ""}
              Saturday slate · ET
            </p>
          </div>
          <p className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
            {data.gameCount} Saturday game{data.gameCount === 1 ? "" : "s"}
          </p>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Saturday FBS kickoffs only — the calendar starts at noon unless an
          earlier game needs a column (e.g. 11am). Matchup bars span 3 hours,
          with quarter-hour kickoff alignment. Scroll horizontally on smaller
          screens.
        </p>
      </header>

      <div className="mb-6">
        <WeekNav year={year} week={week} weeks={weeks} />
      </div>

      <ViewingGuideTable data={data} />

      <footer className="mt-10 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
        Data from{" "}
        <a
          href="https://collegefootballdata.com"
          className="underline underline-offset-2 hover:text-zinc-600"
          target="_blank"
          rel="noreferrer"
        >
          CollegeFootballData.com
        </a>
        . Saturday kickoffs in America/New_York; bars assume a 3-hour game.
      </footer>
    </main>
  );
}
