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

export const prepareCategories: PrepareCategory[] = [];
