import { ImageResponse } from "next/og";
import { geistFontFamily, loadGeistSans } from "@/lib/og-fonts";

export const alt = "CFB TV Guide — college football viewing schedule";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const text = "CFB TV Guide College football by network and kickoff";
  const geist = await loadGeistSans(text, 900);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#f4f4f5",
          padding: 80,
          fontFamily: geistFontFamily,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              background: "#047857",
              borderRadius: 24,
              color: "#ffffff",
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            CFB
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#18181b",
                lineHeight: 1.05,
              }}
            >
              TV Guide
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#71717a",
                lineHeight: 1.3,
              }}
            >
              College football by network and kickoff
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [geist],
    },
  );
}
