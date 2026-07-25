import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { WeekGuideView } from "@/components/WeekGuideView";
import { buildViewingGuide, getAvailableWeeks } from "@/lib/cfbd/build-guide";
import { formatUsageLine, getCfbdUsage } from "@/lib/cfbd/usage";
import { getDefaultSeasonYear, parseAllowedSeasonYear } from "@/lib/time";

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
  const year = parseAllowedSeasonYear(yearParam) ?? getDefaultSeasonYear();
  return {
    title: `Week ${week} Viewing Guide · ${year} CFB`,
    description: `College football TV schedule for Week ${week} of the ${year} season — network-by-network, time-slot grid.`,
  };
}

export default async function WeekPage({ params, searchParams }: PageProps) {
  const { week: weekParam } = await params;
  const { year: yearParam } = await searchParams;

  // Explicit year outside the allowed window → 404, no CFBD calls.
  // Missing year → default current/upcoming season.
  const year =
    yearParam === undefined || yearParam === ""
      ? getDefaultSeasonYear()
      : parseAllowedSeasonYear(yearParam);
  if (year == null) {
    notFound();
  }

  if (!process.env.CFBD_API_KEY) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-16">
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
        </div>
      </PageWrapper>
    );
  }

  let weeks: number[];
  try {
    weeks = await getAvailableWeeks(year);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-16">
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
        </div>
      </PageWrapper>
    );
  }

  if (weeks.length === 0) {
    weeks = [1];
  }

  const week = Number(weekParam);
  // Non-existent weeks (e.g. /week/20, conference-champ slots we hide) → week 1.
  if (!Number.isInteger(week) || !weeks.includes(week)) {
    redirect(`/week/${weeks[0]}?year=${year}`);
  }

  let data;
  try {
    data = await buildViewingGuide({ year, week });
    // Snapshot after work so logs reflect any network calls made for this render.
    console.info(
      `[CFBD] guide week=${week} year=${year} · ${formatUsageLine(getCfbdUsage())}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-16">
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
        </div>
      </PageWrapper>
    );
  }

  return (
    <WeekGuideView data={data} week={week} year={year} weeks={weeks} />
  );
}
