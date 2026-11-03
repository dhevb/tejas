import { createMetadata } from "@/config/seo";

export const metadata = createMetadata({
  title: "Beta Feedback",
  description: "Feedback on the published TEJAS Olympiad 2026–27 website.",
  path: "/beta",
  noIndex: true,
});

export { BetaPage as default } from "./BetaPageClient";
