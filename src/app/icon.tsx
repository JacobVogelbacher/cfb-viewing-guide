import { ImageResponse } from "next/og";
import { geistFontFamily, loadGeistSans } from "@/lib/og-fonts";

/** Matches Logo badge: emerald-700 square with white "CFB". */
export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default async function Icon() {
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
          borderRadius: 6,
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "-0.05em",
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
