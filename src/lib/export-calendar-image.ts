import { toPng } from "html-to-image";
import { inlineImagesForExport } from "./download-image";

/** Canonical export table width (device-independent). */
export const EXPORT_TABLE_WIDTH_PX = 1080;

/** Device-pixel ratio for sharper PNGs (~2160px physical width at 1080 CSS). */
export const EXPORT_PIXEL_RATIO = 2;

export function exportFilename(week: number, year: number): string {
  return `cfb-week-${week}-${year}.png`;
}

/**
 * Capture a mounted export surface as a PNG data URL.
 * Prepares remote team logos for canvas (CORS load, proxy fallback) so
 * network SVGs and ESPN marks both paint on production mobile.
 */
export async function captureCalendarPng(
  root: HTMLElement,
  options?: { pixelRatio?: number },
): Promise<string> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Two frames so layout/paint settle after mount (and after any style apply).
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const restore = await inlineImagesForExport(root);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    return await toPng(root, {
      pixelRatio: options?.pixelRatio ?? EXPORT_PIXEL_RATIO,
      // Don't bust CDN cache — we already ensured CORS-safe loads.
      cacheBust: false,
      backgroundColor: "#ffffff",
      // Prefer computed layout size (1080px-wide export surface).
      width: root.offsetWidth || undefined,
      height: root.offsetHeight || undefined,
      // Skip broken images rather than failing the whole capture.
      skipFonts: false,
      filter: (node) => {
        if (!(node instanceof HTMLImageElement)) return true;
        // Exclude images that never decoded (avoids blank/tainted spots cascading)
        if (node.complete && node.naturalWidth === 0) return false;
        return true;
      },
    });
  } finally {
    restore();
  }
}
