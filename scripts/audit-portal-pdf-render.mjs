/**
 * Structural + page-level PDF audit for TEJAS portal sources.
 * Does not print secrets. Writes JSON evidence under .local-qa/.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const catalog = JSON.parse(readFileSync(path.join(root, "content/portal/catalog.json"), "utf8"));
const sourceDir = path.join(root, "content/portal/sources");
const outDir = path.join(root, ".local-qa");
mkdirSync(outDir, { recursive: true });

const pdfjsPath = path.join(root, "node_modules/pdfjs-dist/legacy/build/pdf.mjs");
const pdfjs = await import(pathToFileURL(pdfjsPath).href);

const results = [];
for (const book of catalog.books) {
  const file = path.join(sourceDir, book.sourceFilename);
  const row = {
    id: book.id,
    streamId: book.streamId,
    title: book.title,
    sourceFilename: book.sourceFilename,
    catalogPageCount: book.pageCount,
    classes: book.assignedClasses,
    exists: false,
    size: 0,
    pdfSignatureOk: false,
    sha256MatchesCatalog: false,
    parsedPageCount: null,
    pageCountMatchesCatalog: false,
    emptyTextPages: [],
    sampleTextFirstPage: null,
    hasDevanagariSample: false,
    parseError: null,
    renderProbe: null,
  };
  try {
    const bytes = readFileSync(file);
    row.exists = true;
    row.size = bytes.length;
    row.pdfSignatureOk = bytes.subarray(0, 5).toString("utf8").startsWith("%PDF");
    const sha = createHash("sha256").update(bytes).digest("hex");
    row.sha256MatchesCatalog = sha === book.sourceSha256;
    const task = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: true,
    });
    const pdf = await task.promise;
    row.parsedPageCount = pdf.numPages;
    row.pageCountMatchesCatalog = pdf.numPages === book.pageCount;
    const empty = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const text = await page.getTextContent();
      const joined = text.items.map((item) => ("str" in item ? String(item.str) : "")).join(" ").trim();
      if (pageNumber === 1) {
        row.sampleTextFirstPage = joined.slice(0, 160);
        row.hasDevanagariSample = /[\u0900-\u097F]/.test(joined);
      }
      // Structural emptiness check only — some diagram-heavy pages can have little extractable text.
      if (joined.length === 0) {
        const ops = await page.getOperatorList();
        if (!ops.fnArray || ops.fnArray.length < 3) empty.push(pageNumber);
      }
      page.cleanup();
    }
    row.emptyTextPages = empty;
    // Probe first and last page viewport geometry (rotation / zero-size defects).
    const first = await pdf.getPage(1);
    const last = await pdf.getPage(pdf.numPages);
    const firstViewport = first.getViewport({ scale: 1 });
    const lastViewport = last.getViewport({ scale: 1 });
    row.renderProbe = {
      first: { width: firstViewport.width, height: firstViewport.height, rotation: first.rotate },
      last: { width: lastViewport.width, height: lastViewport.height, rotation: last.rotate },
      geometryOk: firstViewport.width > 50 && firstViewport.height > 50 && lastViewport.width > 50 && lastViewport.height > 50,
    };
    first.cleanup();
    last.cleanup();
    await pdf.destroy();
  } catch (error) {
    row.parseError = error instanceof Error ? error.message : String(error);
  }
  results.push(row);
}

const summary = {
  bookCount: results.length,
  testCount: catalog.tests.length,
  allExist: results.every((row) => row.exists && row.pdfSignatureOk),
  allParse: results.every((row) => row.parsedPageCount != null && !row.parseError),
  allPageCountsMatch: results.every((row) => row.pageCountMatchesCatalog),
  booksWithEmptyOperatorPages: results.filter((row) => row.emptyTextPages.length > 0).map((row) => ({ id: row.id, pages: row.emptyTextPages })),
  books: results,
  deliveryNotes: {
    mechanism: "Authenticated same-origin GET /api/learn/books/[bookId]/file reads content/portal/sources (not public Storage signed URLs).",
    rangeRequests: "Full-file Response; reader disables pdf.js range/stream by design for auth-gated bytes.",
    contentType: "application/pdf",
    contentDisposition: "inline",
    cacheControl: "private, no-store",
  },
};

const out = path.join(outDir, "portal-pdf-render-audit.json");
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({
  out,
  bookCount: summary.bookCount,
  allExist: summary.allExist,
  allParse: summary.allParse,
  allPageCountsMatch: summary.allPageCountsMatch,
  booksWithEmptyOperatorPages: summary.booksWithEmptyOperatorPages.length,
}, null, 2));
process.exit(summary.allExist && summary.allParse && summary.bookCount === 18 ? 0 : 1);
