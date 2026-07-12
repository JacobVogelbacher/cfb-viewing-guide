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

  if (!isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: "image/*,*/*;q=0.8",
        // Some CDNs are picky about User-Agent
        "User-Agent": "CFB-Viewing-Guide/1.0 (image export proxy)",
      },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[image-proxy]", err);
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 502 });
  }
}
