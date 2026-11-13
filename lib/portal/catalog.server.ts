import { readFileSync } from "node:fs";
import path from "node:path";
import type { PortalBook, PortalCatalog, PortalTest } from "@/lib/portal/model";

const CATALOG_PATH = path.join(process.cwd(), "content", "portal", "catalog.json");
const SOURCE_DIR = path.join(process.cwd(), "content", "portal", "sources");

let cached: PortalCatalog | null = null;

export function loadCatalog(): PortalCatalog {
  if (!cached) {
    cached = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as PortalCatalog;
  }
  return cached;
}

export function sourceDirectory(): string {
  return SOURCE_DIR;
}

export function bookFilePath(book: PortalBook): string {
  const root = path.resolve(SOURCE_DIR);
  const file = path.resolve(root, book.sourceFilename);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    throw new Error("Book file path is outside the source directory.");
  }
  return file;
}

export function findBook(catalog: PortalCatalog, bookId: string): PortalBook | undefined {
  return catalog.books.find((book) => book.id === bookId);
}

export function findTest(catalog: PortalCatalog, testId: string): PortalTest | undefined {
  return catalog.tests.find((test) => test.id === testId);
}
