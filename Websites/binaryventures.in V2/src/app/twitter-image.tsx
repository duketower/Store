import { ImageResponse } from "next/og";

export const alt = "Binary Ventures";
export const dynamic = "force-static";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(43,200,183,0.24), transparent 32%), radial-gradient(circle at bottom right, rgba(155,153,254,0.18), transparent 36%), linear-gradient(135deg, #050816 0%, #0c1325 52%, #131f38 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "28px",
            padding: "48px",
            justifyContent: "space-between",
            flexDirection: "column",
            background: "rgba(5,8,22,0.38)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#8ef0e3",
            }}
          >
            Binary Ventures
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "860px" }}>
            <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.04 }}>
              Websites, systems, bots, and automation for real business operations.
            </div>
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.4, color: "rgba(248,250,252,0.82)" }}>
              Founder-led delivery across websites, web apps, AI chatbots, and workflow automation.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
