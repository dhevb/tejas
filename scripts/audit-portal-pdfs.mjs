import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalog = JSON.parse(readFileSync(path.join(root, "content/portal/catalog.json"), "utf8"));
const sourceDir = path.join(root, "content/portal/sources");

const results = [];
for (const book of catalog.books) {
  const file = path.join(sourceDir, book.sourceFilename);
  let exists = false;
  let size = 0;
  let signature = "";
  let sha256 = "";
  let error = "";
  try {
    const st = statSync(file);
    exists = st.isFile();
    size = st.size;
    const bytes = readFileSync(file);
    signature = bytes.subarray(0, 5).toString("utf8");
    sha256 = createHash("sha256").update(bytes).digest("hex");
  } catch (reason) {
    error = reason instanceof Error ? reason.message : String(reason);
  }
  const tests = catalog.tests.filter((test) => test.bookId === book.id);
  results.push({
    id: book.id,
    streamId: book.streamId,
    title: book.title,
    pageCount: book.pageCount,
    classes: book.assignedClasses,
    sourceFilename: book.sourceFilename,
    exists,
    size,
    pdfSignatureOk: signature.startsWith("%PDF"),
    sha256MatchesCatalog: sha256 === book.sourceSha256,
    catalogSha256: book.sourceSha256,
    fileSha256: sha256 || null,
    mockTests: tests.length,
    error: error || null,
  });
}

const presentValid = results.every((row) => row.exists && row.pdfSignatureOk && row.mockTests === 5);
const shaOk = results.every((row) => row.sha256MatchesCatalog);
console.log(JSON.stringify({
  bookCount: catalog.books.length,
  testCount: catalog.tests.length,
  allPdfPresentValid: presentValid,
  allSha256MatchCatalog: shaOk,
  books: results,
}, null, 2));
process.exit(presentValid && catalog.books.length === 18 && catalog.tests.length === 90 ? 0 : 1);
