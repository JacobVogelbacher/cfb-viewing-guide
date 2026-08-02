"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ImageIcon, Menu, X } from "lucide-react";
import type { ViewingGuideData } from "@/lib/cfbd/types";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { ViewingGuideTable } from "@/components/ViewingGuideTable";
import { WeekNav } from "@/components/WeekNav";
import { cn } from "@/lib/utils";

const PREF_FIT_TO_SCREEN = "cfb-guide:fitToScreen";
const PREF_HIDE_ESPN_PLUS = "cfb-guide:hideEspnPlus";

/** Original desktop toggle styling (bordered pill with checkbox). */
const guideToggleLabelClass =
  "inline-flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50";
const guideToggleInputClass =
  "h-4 w-4 cursor-pointer rounded border-zinc-300 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:ring-offset-1";

function readSessionBool(key: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // sessionStorage unavailable (private mode, SSR, etc.)
  }
  return null;
}

function writeSessionBool(key: string, value: boolean) {
  try {
    sessionStorage.setItem(key, value ? "true" : "false");
  } catch {
    // ignore quota / access errors
  }
}

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
  /** Mobile week chrome (nav); hidden by default. Always visible sm+. */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navPanelId = useId();

  const [fitToScreen, setFitToScreen] = useState(false);
  const [hideEspnPlus, setHideEspnPlus] = useState(false);
  const [prefsHydrated, setPrefsHydrated] = useState(false);

  useEffect(() => {
    const fit = readSessionBool(PREF_FIT_TO_SCREEN);
    const hide = readSessionBool(PREF_HIDE_ESPN_PLUS);
    if (fit !== null) setFitToScreen(fit);
    if (hide !== null) setHideEspnPlus(hide);
    setPrefsHydrated(true);
  }, []);

  useEffect(() => {
    if (!prefsHydrated) return;
    writeSessionBool(PREF_FIT_TO_SCREEN, fitToScreen);
    writeSessionBool(PREF_HIDE_ESPN_PLUS, hideEspnPlus);
  }, [fitToScreen, hideEspnPlus, prefsHydrated]);

  const hasEspnPlus = useMemo(
    () => data.networks.some((n) => n.network === "ESPN+"),
    [data.networks],
  );

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
      <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden">
        <div
          id={navPanelId}
          className={cn(
            "shrink-0 px-4 sm:px-6 lg:px-8",
            mobileNavOpen ? "block pb-2 sm:pb-2" : "hidden sm:block sm:pb-2",
          )}
        >
          <WeekNav
            year={year}
            week={week}
            weeks={weeks}
            actions={
              <>
                <label className={guideToggleLabelClass}>
                  <input
                    type="checkbox"
                    className={guideToggleInputClass}
                    checked={fitToScreen}
                    onChange={(e) => setFitToScreen(e.target.checked)}
                  />
                  <span>Fit to Screen</span>
                </label>
                {hasEspnPlus ? (
                  <label className={guideToggleLabelClass}>
                    <input
                      type="checkbox"
                      className={guideToggleInputClass}
                      checked={hideEspnPlus}
                      onChange={(e) => setHideEspnPlus(e.target.checked)}
                    />
                    <span>Hide ESPN+</span>
                  </label>
                ) : null}
              </>
            }
          />
        </div>

        <ViewingGuideTable
          data={data}
          screenshotOpen={screenshotOpen}
          onScreenshotOpenChange={setScreenshotOpen}
          fitToScreen={fitToScreen}
          hideEspnPlus={hideEspnPlus}
          onHideEspnPlusChange={setHideEspnPlus}
        />
      </div>
    </PageWrapper>
  );
}
