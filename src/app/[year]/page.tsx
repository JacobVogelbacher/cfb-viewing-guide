import { notFound, redirect } from "next/navigation";
import { weekPath } from "@/lib/routes";
import { parseAllowedSeasonYear } from "@/lib/time";

/**
 * /2026 → /2026/week/1 (first week of that season).
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
  redirect(weekPath(year, 1));
}
