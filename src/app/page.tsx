import { redirect } from "next/navigation";
import { resolveDefaultWeek } from "@/lib/cfbd/build-guide";
import { getDefaultSeasonYear } from "@/lib/time";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const year = sp.year ? Number(sp.year) : getDefaultSeasonYear();
  const week = sp.week
    ? Number(sp.week)
    : process.env.CFBD_API_KEY
      ? await resolveDefaultWeek(year)
      : 1;

  redirect(
    `/week/${Number.isFinite(week) ? week : 1}?year=${Number.isFinite(year) ? year : getDefaultSeasonYear()}`,
  );
}
