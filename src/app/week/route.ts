import { redirect } from "next/navigation";
import { getDefaultSeasonYear } from "@/lib/time";

/**
 * Handles season form posts/gets: /week?year=2025&week=2 → /week/2?year=2025
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? String(getDefaultSeasonYear());
  const week = searchParams.get("week") ?? "1";
  redirect(`/week/${week}?year=${year}`);
}
