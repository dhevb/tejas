import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ["xlsx", "tesseract.js", "tesseract.js-core"],
  // Include tessdata + WASM cores; Next tracing otherwise omits dynamically opened .wasm files.
  outputFileTracingIncludes: {
    "/api/register/*/payment": ["./vendor/tessdata/**/*", "./node_modules/tesseract.js-core/**/*"],
    "/api/learn/pay": ["./vendor/tessdata/**/*", "./node_modules/tesseract.js-core/**/*"],
    "/api/register/ocr-probe": ["./vendor/tessdata/**/*", "./node_modules/tesseract.js-core/**/*"],
  },
  async redirects() {
    return [
      { source: "/olympiads/future-tech", destination: "/olympiads/technology", permanent: false },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
