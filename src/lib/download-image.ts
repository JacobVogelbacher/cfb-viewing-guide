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

/**
 * Rewrite remote <img> sources to same-origin data URLs via /api/image-proxy
 * so html-to-image can paint them without CORS tainting the canvas.
 * Returns a restore function.
 */
export async function inlineImagesForExport(
  root: HTMLElement,
): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const originals: { img: HTMLImageElement; src: string; crossOrigin: string | null }[] =
    [];

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;

      originals.push({
        img,
        src: img.getAttribute("src") ?? src,
        crossOrigin: img.getAttribute("crossorigin"),
      });

      try {
        const proxy = `/api/image-proxy?url=${encodeURIComponent(src)}`;
        const res = await fetch(proxy);
        if (!res.ok) {
          throw new Error(`proxy ${res.status}`);
        }
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        img.removeAttribute("crossorigin");
        img.src = dataUrl;
      } catch (err) {
        console.warn("[export] logo inline failed", src, err);
        // Leave original; capture may omit this logo
      }
    }),
  );

  // Wait for data-URL images to decode
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
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
