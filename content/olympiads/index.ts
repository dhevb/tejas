import type { OlympiadPortalContent } from "@/content/types";
import { englishOlympiad } from "./english";
import { mathematicsOlympiad } from "./mathematics";
import { technologyOlympiad } from "./technology";
import {
  scienceOlympiad,
  hindiOlympiad,
  sanskritOlympiad,
  generalKnowledgeOlympiad,
  aiOlympiad,
  codingOlympiad,
  innovationOlympiad,
} from "./coming-soon";

export const olympiadRegistry: OlympiadPortalContent[] = [
  mathematicsOlympiad,
  englishOlympiad,
  technologyOlympiad,
  scienceOlympiad,
  hindiOlympiad,
  sanskritOlympiad,
  generalKnowledgeOlympiad,
  aiOlympiad,
  codingOlympiad,
  innovationOlympiad,
];

export function getOlympiadContent(slug: string): OlympiadPortalContent | undefined {
  return olympiadRegistry.find((o) => o.slug === slug);
}

export function getAllOlympiadSlugs(): string[] {
  return olympiadRegistry.map((o) => o.slug);
}

export function getActiveOlympiads(): OlympiadPortalContent[] {
  return olympiadRegistry.filter((o) => o.status === "active");
}

export function getComingSoonOlympiads(): OlympiadPortalContent[] {
  return olympiadRegistry.filter((o) => o.status === "coming-soon");
}
