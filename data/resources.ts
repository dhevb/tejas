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
    id: "portal",
    title: "Student portal",
    description: "Published Future Tech e-books and mock tests open here for the registered class after payment is verified.",
    href: "/learn",
    gradient: "from-tejas-saffron to-tejas-saffron-dark",
  },
  {
    id: "mock-tests",
    title: "Mock tests",
    description: "Explains where a test can open. This page does not start a test.",
    href: "/prepare/mock-tests",
    gradient: "from-tejas-blue to-tejas-blue-dark",
  },
  {
    id: "ebook",
    title: "E-book status",
    description: "Shows which Future Tech books are published. English and Mathematics files have not been supplied.",
    href: "/prepare/ebook",
    gradient: "from-tejas-emerald to-tejas-blue",
  },
  {
    id: "papers",
    title: "2025 English archive",
    description: "1st DHE English Olympiad, 13–16 October 2025. The paper files are not attached on this website.",
    href: "/hall-of-fame",
    gradient: "from-tejas-gold-dark to-tejas-saffron",
  },
];
