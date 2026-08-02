import { ImageResponse } from "next/og";
import { geistFontFamily, loadGeistSans } from "@/lib/og-fonts";

/** Home-screen icon: larger CFB badge (emerald-700). */
export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const geist = await loadGeistSans("CFB", 900);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#047857",
          borderRadius: 36,
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          fontFamily: geistFontFamily,
        }}
      >
        CFB
      </div>
    ),
    {
      ...size,
      fonts: [geist],
    },
  );
}
