function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function formatUnknownError(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === "string") return err;
  // html-to-image often rejects with a raw Event on image/CORS failure
  if (err && typeof err === "object") {
    const e = err as { type?: string; message?: string; target?: unknown };
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.type === "string") {
      return `Image capture failed (${e.type}). Team logos may be blocked — try again.`;
    }
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Could not generate the calendar image.";
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Failed to read image data for export."));
    reader.readAsDataURL(blob);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (err) => {
        window.clearTimeout(t);
        reject(err);
      },
    );
  });
}

function waitForImage(img: HTMLImageElement, ms: number): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();

  return withTimeout(
    new Promise<void>((resolve, reject) => {
      const done = () => {
        cleanup();
        if (img.naturalWidth > 0) resolve();
        else reject(new Error("Image failed to decode"));
      };
      const fail = () => {
        cleanup();
        reject(new Error("Image load error"));
      };
      const cleanup = () => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", fail);
      };
      img.addEventListener("load", done);
      img.addEventListener("error", fail);
      // complete but zero size (broken) — treat as failure
      if (img.complete) {
        queueMicrotask(() => {
          if (img.naturalWidth > 0) {
            cleanup();
            resolve();
          }
        });
      }
    }),
    ms,
    "Image load",
  );
}

/** Run async work over items with a max concurrency (mobile connection limits). */
async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const n = Math.max(1, Math.min(concurrency, items.length));
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      await fn(items[i]!);
    }
  }

  await Promise.all(Array.from({ length: n }, () => worker()));
}

function isRemoteHttpUrl(src: string): boolean {
  try {
    const url = new URL(src, window.location.href);
    if (url.origin === window.location.origin) return false;
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Prefer loading the original CDN URL with CORS so html-to-image can paint it.
 * ESPN team logos send Access-Control-Allow-Origin: * — this avoids a slow
 * round-trip through /api/image-proxy for every logo (critical on mobile prod).
 */
async function ensureCorsLoaded(img: HTMLImageElement, src: string): Promise<void> {
  if (
    img.crossOrigin === "anonymous" &&
    img.complete &&
    img.naturalWidth > 0
  ) {
    return;
  }

  img.crossOrigin = "anonymous";
  // Force reload with CORS mode (required if the image loaded without crossOrigin).
  img.src = "";
  img.src = src;
  await waitForImage(img, 8_000);
}

/**
 * Fallback: fetch via same-origin proxy and replace src with a data URL.
 */
async function inlineViaProxy(img: HTMLImageElement, src: string): Promise<void> {
  const proxy = `/api/image-proxy?url=${encodeURIComponent(src)}`;
  const res = await withTimeout(fetch(proxy), 10_000, "Logo proxy fetch");
  if (!res.ok) {
    throw new Error(`proxy ${res.status}`);
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("proxy returned empty body");
  }
  const dataUrl = await blobToDataUrl(blob);
  img.removeAttribute("crossorigin");
  img.src = dataUrl;
  await waitForImage(img, 5_000);
}

/**
 * Prepare remote <img> elements so html-to-image can paint them without
 * CORS-tainting the canvas.
 *
 * Strategy:
 * 1. Same-origin assets — leave alone (network SVGs under /public).
 * 2. Remote logos — load with crossOrigin=anonymous (ESPN allows *).
 * 3. If CORS load fails — proxy to a data URL via /api/image-proxy.
 *
 * Uses bounded concurrency + timeouts so a slow CDN/proxy cannot stall
 * export for tens of seconds on mobile.
 *
 * Returns a restore function for any imgs rewritten to data URLs.
 */
export async function inlineImagesForExport(
  root: HTMLElement,
): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const originals: {
    img: HTMLImageElement;
    src: string;
    crossOrigin: string | null;
  }[] = [];

  const remote = imgs.filter((img) => {
    const src = img.currentSrc || img.src;
    return Boolean(src) && !src.startsWith("data:") && !src.startsWith("blob:") && isRemoteHttpUrl(src);
  });

  // Mobile browsers limit parallel connections; keep a small pool.
  const concurrency = isMobileUa() ? 6 : 10;

  await mapPool(remote, concurrency, async (img) => {
    const src = img.currentSrc || img.src;
    if (!src) return;

    originals.push({
      img,
      src: img.getAttribute("src") ?? src,
      crossOrigin: img.getAttribute("crossorigin"),
    });

    try {
      await ensureCorsLoaded(img, src);
    } catch (corsErr) {
      try {
        await inlineViaProxy(img, src);
      } catch (proxyErr) {
        console.warn("[export] logo prepare failed", src, {
          cors: corsErr,
          proxy: proxyErr,
        });
        // Leave original; capture may omit this logo rather than fail entirely.
      }
    }
  });

  // Final settle for any remaining incomplete images (same-origin, etc.)
  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete) return;
      try {
        await waitForImage(img, 3_000);
      } catch {
        // ignore
      }
    }),
  );

  return () => {
    for (const { img, src, crossOrigin } of originals) {
      if (crossOrigin) img.setAttribute("crossorigin", crossOrigin);
      else img.removeAttribute("crossorigin");
      img.src = src;
    }
  };
}

/**
 * Save a PNG data URL.
 * Mobile: prefer share sheet. Desktop: direct download (share is flaky on desktop Chrome).
 */
export async function savePngDataUrl(
  dataUrl: string,
  filename: string,
): Promise<"shared" | "downloaded"> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  // Share only on mobile — desktop share/file support is inconsistent
  if (
    isMobileUa() &&
    typeof nav.share === "function" &&
    typeof nav.canShare === "function"
  ) {
    try {
      if (nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: filename,
          text: "CFB Saturday viewing guide",
        });
        return "shared";
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }
      // Fall through to download
      console.warn("[download] share failed, falling back to download", err);
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4_000);
  }

  return "downloaded";
}
