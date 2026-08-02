/**
 * Fonts for next/og ImageResponse (Satori).
 *
 * next/font CSS variables (e.g. --font-geist-sans) do not apply here — Satori
 * needs raw font bytes in the ImageResponse `fonts` option.
 */

const GEIST_FAMILY = "Geist";

/** Matches next/og ImageResponse font weight options. */
export type OgFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** Load Geist (subset for the given text) from Google Fonts as TTF/OTF. */
export async function loadGeistSans(
  text: string,
  weight: OgFontWeight = 900,
): Promise<{
  name: string;
  data: ArrayBuffer;
  weight: OgFontWeight;
  style: "normal";
}> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Geist:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl, {
    // Older UA → Google serves TTF/OTF. Modern UAs get woff2, which Satori rejects.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
    },
    // Icons are build-time static; allow caching the CSS response.
    next: { revalidate: 60 * 60 * 24 * 7 },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to load Geist CSS (${res.status})`);
    }
    return res.text();
  });

  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(truetype|opentype)'\)/);
  if (!match?.[1]) {
    throw new Error("Geist TTF/OTF URL not found in Google Fonts CSS");
  }

  const fontRes = await fetch(match[1], {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!fontRes.ok) {
    throw new Error(`Failed to download Geist font (${fontRes.status})`);
  }

  return {
    name: GEIST_FAMILY,
    data: await fontRes.arrayBuffer(),
    weight,
    style: "normal",
  };
}

export const geistFontFamily = GEIST_FAMILY;
