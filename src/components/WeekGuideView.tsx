"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { ViewingGuideTable } from "@/components/ViewingGuideTable";
import { WeekNav } from "@/components/WeekNav";

export function WeekGuideView({
  data,
  week,
  year,
  weeks,
}: {
  data: ViewingGuideData;
  week: number;
  year: number;
  weeks: number[];
}) {
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  return (
    <PageWrapper
      headerActions={
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 sm:hidden"
          aria-label="Screenshot view"
          onClick={() => setScreenshotOpen(true)}
        >
          <ImageIcon className="size-5" aria-hidden />
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[1600px] pt-5 pb-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
                  Week {week}
                  <span className="ml-2 text-lg font-semibold text-zinc-400 sm:text-xl">
                    {year} Season
                  </span>
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {data.saturdayLabel
                    ? `${data.saturdayLabel}`
                    : data.weekLabel
                      ? `${data.weekLabel}`
                      : ""}
                </p>
              </div>
            </div>
          </header>

          <div className="mb-6">
            <WeekNav year={year} week={week} weeks={weeks} />
          </div>
        </div>

        <ViewingGuideTable
          data={data}
          screenshotOpen={screenshotOpen}
          onScreenshotOpenChange={setScreenshotOpen}
        />

        <footer className="mt-8 px-4 text-center text-xs text-zinc-400 sm:mt-10 sm:border-t sm:border-zinc-200 sm:px-6 sm:pt-6 lg:px-8">
          Data from{" "}
          <a
            href="https://collegefootballdata.com"
            className="cursor-pointer underline underline-offset-2 transition-colors hover:text-zinc-600"
            target="_blank"
            rel="noreferrer"
          >
            CollegeFootballData.com
          </a>
          .
        </footer>
      </div>
    </PageWrapper>
  );
}
