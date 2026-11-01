import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/design-system/tokens";

export const runtime = "nodejs";
export const alt = `${brand.name} — ${brand.fullName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const logo = readFileSync(join(process.cwd(), "public/brand/tejas-logo.jpg"));
  const src = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 48,
          padding: "72px",
          background: "#1A2B5D",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={src}
          alt=""
          width={280}
          height={280}
          style={{ borderRadius: 140, objectFit: "cover" }}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontSize: 84, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{brand.name}</span>
          <span style={{ fontSize: 28, color: "#DE9A26", marginTop: 16 }}>{brand.tagline}</span>
          <span style={{ fontSize: 26, marginTop: 20, lineHeight: 1.35, maxWidth: 680 }}>{brand.fullName}</span>
          <span style={{ fontSize: 20, marginTop: 36, opacity: 0.8 }}>{brand.parentOrg}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
