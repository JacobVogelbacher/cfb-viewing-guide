import { NextRequest, NextResponse } from "next/server";

/** Hostnames we will proxy for calendar export (CORS-safe same-origin images). */
const ALLOWED_HOSTS = new Set([
  "a.espncdn.com",
  "secure.espncdn.com",
  "collegefootballdata.com",
]);

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  return (
    hostname.endsWith(".espncdn.com") ||
    hostname.endsWith(".collegefootballdata.com")
  );
}

/** Browser-like UA — some CDNs throttle or reject opaque bot strings. */
const UPSTREAM_UA =
  "Mozilla/5.0 (compatible; CFBViewingGuide/1.0; +https://github.com) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  // Normalize http→https for mixed-content / CDN consistency
  if (target.protocol === "http:") {
    target.protocol = "https:";
  }

  if (!isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": UPSTREAM_UA,
        // Some CDNs soft-check Referer; empty is fine for public logos
        Referer: "https://www.espn.com/",
      },
      signal: controller.signal,
      // Cache successful logo fetches at the platform edge when possible
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return NextResponse.json(
        { error: "Upstream was not an image" },
        { status: 502 },
      );
    }

    const buffer = await upstream.arrayBuffer();
    if (!buffer.byteLength) {
      return NextResponse.json({ error: "Empty image" }, { status: 502 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType.startsWith("image/")
          ? contentType
          : "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        // Allow canvas use if this response is ever loaded cross-origin
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const aborted =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("abort"));
    console.error("[image-proxy]", aborted ? "timeout" : err);
    return NextResponse.json(
      { error: aborted ? "Upstream timeout" : "Proxy fetch failed" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
