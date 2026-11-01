import type { Metadata } from "next";
import { brand } from "@/design-system/tokens";

const defaultDescription =
  "TEJAS — Bharat's National Talent Development Ecosystem by the Department of Holistic Education. Olympiads, assessments, scholarships, and learning pathways for students across Bharat.";

export const siteConfig = {
  name: brand.name,
  fullName: brand.fullName,
  description: defaultDescription,
  url: brand.url,
  ogImage: "/opengraph-image",
  locale: "en_IN",
  alternateLocale: "hi_IN",
} as const;

export function createMetadata({
  title,
  description = defaultDescription,
  path = "",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${brand.name}` : `${brand.name} — ${brand.fullName}`;
  const url = `${siteConfig.url}${path}`;
  const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    ...(gscVerification && { verification: { google: gscVerification } }),
    alternates: {
      canonical: url,
      languages: {
        en: url,
        hi: `${url}?lang=hi`,
      },
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      title: pageTitle,
      description,
      siteName: brand.name,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: `${brand.name} — ${brand.fullName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [siteConfig.ogImage],
    },
    icons: {
      icon: "/brand/tejas-logo.jpg",
      apple: "/brand/tejas-logo.jpg",
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    keywords: [
      "TEJAS",
      "DHE Olympiads",
      "talent assessment Bharat",
      "national olympiad",
      "Department of Holistic Education",
      "student olympiad",
      "mock tests",
      "scholarships",
    ],
  };
}
