"use client";

import { useId, useState } from "react";
import { ImageIcon, Menu, X } from "lucide-react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { ViewingGuideTable } from "@/components/ViewingGuideTable";
import { WeekNav } from "@/components/WeekNav";
import { cn } from "@/lib/utils";

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
  /** Mobile week chrome (title + nav); hidden by default. Always visible sm+. */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navPanelId = useId();

  return (
    <PageWrapper
      headerActions={
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="sm:hidden"
            aria-label="Screenshot view"
            onClick={() => setScreenshotOpen(true)}
          >
            <ImageIcon className="size-6" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "sm:hidden",
              mobileNavOpen &&
                "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
            )}
            aria-label={
              mobileNavOpen ? "Hide week navigation" : "Show week navigation"
            }
            aria-expanded={mobileNavOpen}
            aria-controls={navPanelId}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? (
              <X className="size-6" aria-hidden />
            ) : (
              <Menu className="size-6" aria-hidden />
            )}
          </Button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col max-sm:overflow-hidden sm:pt-5 sm:pb-8">
        <div
          id={navPanelId}
          className={cn(
            "shrink-0 px-4 sm:px-6 lg:px-8",
            mobileNavOpen ? "block pb-3 sm:py-0" : "hidden sm:block",
          )}
        >
          {/* Title / date — tablet & desktop only */}
          <header className="mb-8 hidden sm:block">
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

          <div className="sm:mb-6">
            <WeekNav year={year} week={week} weeks={weeks} />
          </div>
        </div>

        <ViewingGuideTable
          data={data}
          screenshotOpen={screenshotOpen}
          onScreenshotOpenChange={setScreenshotOpen}
        />

        <footer className="mt-8 hidden px-4 text-center text-xs text-zinc-400 sm:mt-10 sm:block sm:border-t sm:border-zinc-200 sm:px-6 sm:pt-6 lg:px-8">
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
