import { notFound, redirect } from "next/navigation";
import {
  getDefaultSeasonYear,
  parseAllowedSeasonYear,
} from "@/lib/time";

/**
 * Handles season form posts/gets: /week?year=2025&week=2 → /week/2?year=2025
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const week = searchParams.get("week") ?? "1";

  let year: number;
  if (yearParam === null || yearParam === "") {
    year = getDefaultSeasonYear();
  } else {
    const parsed = parseAllowedSeasonYear(yearParam);
    if (parsed == null) notFound();
    year = parsed;
  }

  redirect(`/week/${week}?year=${year}`);
}
