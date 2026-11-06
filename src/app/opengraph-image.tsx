import { ImageResponse } from "next/og";

export const alt = "MAD — Mighty & Delicious";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated at build time from brand colours; swap for a real photographic OG image when available.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          background: "#171615",
          color: "#F7F5F1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              background: "#E65C25",
              color: "#171615",
              fontSize: 190,
              fontWeight: 900,
              letterSpacing: 4,
              padding: "0 36px",
              lineHeight: 1.05,
              transform: "rotate(-2deg)",
            }}
          >
            MAD
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 44, fontSize: 58, fontWeight: 800, letterSpacing: 6 }}>
            <span>MIGHTY</span>
            <span style={{ color: "#F3B64B" }}>&amp; DELICIOUS</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 40, color: "#A8A29E" }}>
          Burgers · Wraps · Pizza · Loaded Fries — Lahore
        </div>
      </div>
    ),
    size,
  );
}
