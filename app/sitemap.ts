import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/seo";
import { getAllOlympiadSlugs } from "@/content/olympiads";

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const staticRoutes = [
    "",
    "/about",
    "/olympiads",
    "/prepare",
    "/prepare/mock-tests",
    "/prepare/ebook",
    "/learn",
    "/learn/register",
    "/learn/login",
    "/resources",
    "/schools",
    "/schools/register",
    "/rankings",
    "/hall-of-fame",
    "/scholarships",
    "/faq",
    "/contact",
    "/beta",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...getAllOlympiadSlugs().map((slug) => ({
      url: `${base}/olympiads/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
