import { notFound, redirect } from "next/navigation";
import { resolveLandingWeek } from "@/lib/cfbd/build-guide";
import { weekPath } from "@/lib/routes";
import { parseAllowedSeasonYear } from "@/lib/time";

/**
 * /2026 → current week when 2026 is the live season; otherwise week 1.
 * Out-of-range years → 404 without fetching.
 */
export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearParam } = await params;
  const year = parseAllowedSeasonYear(yearParam);
  if (year == null) notFound();
  redirect(weekPath(year, await resolveLandingWeek(year)));
}
