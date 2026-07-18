import { notFound, redirect } from "next/navigation";
import { resolveDefaultWeek } from "@/lib/cfbd/build-guide";
import {
  getDefaultSeasonYear,
  parseAllowedSeasonYear,
} from "@/lib/time";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; year?: string }>;
}) {
  const sp = await searchParams;

  // Explicit out-of-range year → 404 without fetching. Missing → default.
  let year: number;
  if (sp.year === undefined || sp.year === "") {
    year = getDefaultSeasonYear();
  } else {
    const parsed = parseAllowedSeasonYear(sp.year);
    if (parsed == null) notFound();
    year = parsed;
  }

  const week = sp.week
    ? Number(sp.week)
    : process.env.CFBD_API_KEY
      ? await resolveDefaultWeek(year)
      : 1;

  redirect(
    `/week/${Number.isFinite(week) ? week : 1}?year=${year}`,
  );
}
