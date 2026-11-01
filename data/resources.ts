import type { Resource } from "@/types";
import {
  resourceRegistry,
  resourceCategories,
  getResourcesByCategory,
} from "@/content/resources";

export const resources: Resource[] = resourceRegistry.map((r) => ({
  id: r.id,
  title: r.title.en,
  type: r.type,
  subject: r.subject ?? "General",
  description: r.description.en,
  href: r.href,
}));

export { resourceRegistry, resourceCategories, getResourcesByCategory };

import type { PrepareCategory } from "@/types";

export const prepareCategories: PrepareCategory[] = [
  {
    id: "mock-tests",
    title: "Mock Tests",
    description: "Full-length simulated exams — English, Maths, Technology",
    count: 6,
    href: "/prepare/mock-tests",
    gradient: "from-tejas-saffron to-tejas-saffron-dark",
  },
  {
    id: "practice",
    title: "Practice Sets",
    description: "Topic-wise drills and OMR practice sheets",
    count: 24,
    href: "/prepare",
    gradient: "from-tejas-blue to-tejas-blue-dark",
  },
  {
    id: "videos",
    title: "Video Learning",
    description: "Expert masterclasses from Olympiad Cell, DHE",
    count: 8,
    href: "/resources",
    gradient: "from-tejas-emerald to-tejas-blue",
  },
  {
    id: "question-banks",
    title: "Question Banks",
    description: "Level-wise MCQ collections (A–E)",
    count: 500,
    href: "/resources",
    gradient: "from-tejas-blue-dark to-tejas-saffron-dark",
  },
  {
    id: "papers",
    title: "Previous Papers",
    description: "1st DHE English Olympiad 2025 collection",
    count: 5,
    href: "/editions/dhe-english-2025",
    gradient: "from-tejas-gold-dark to-tejas-saffron",
  },
  {
    id: "guides",
    title: "Teacher & Parent Guides",
    description: "Olympiad coordination and home support guides",
    count: 6,
    href: "/resources",
    gradient: "from-tejas-saffron-dark to-tejas-blue-dark",
  },
];
