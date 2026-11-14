import type { Olympiad } from "@/types";
import { olympiadRegistry } from "@/content/olympiads";

function mapToOlympiad(o: (typeof olympiadRegistry)[number]): Olympiad {
  return {
    slug: o.slug,
    name: o.name.en,
    nameHi: o.name.hi,
    description: o.description.en,
    icon: o.icon,
    color: o.color,
    grades: o.grades.en,
    duration: o.duration.en,
    questions: o.questions,
    registrationOpen: o.registrationOpen,
    examDate: o.examDate,
    status: o.status,
  };
}

export const olympiads: Olympiad[] = olympiadRegistry.map(mapToOlympiad);

export function getActiveOlympiads(): Olympiad[] {
  return olympiadRegistry.filter((o) => o.status === "active").map(mapToOlympiad);
}

export function getOlympiadBySlug(slug: string) {
  return olympiads.find((o) => o.slug === slug);
}

export const activeOlympiadSlugs = ["mathematics", "english", "technology"] as const;
