import { ImageResponse } from "next/og";

export const alt = "East Timorese Hakka-English word list";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#141414",
          color: "#ececec",
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          East Timorese Hakka-English word list
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#a3a3a3",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Search romanisation, Chinese characters, and English definitions
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: "#2dd4bf",
            letterSpacing: "0.04em",
          }}
        >
          Timor-Leste · Hakka · English
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
