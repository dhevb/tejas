import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "node_modules", "pdfjs-dist");
const dest = path.join(root, "public", "pdfjs");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(path.join(source, "build", "pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.mjs"));
// Browser reader loads the library from /public to avoid Next/webpack eval source-map
// wrapping that throws "Object.defineProperty called on non-object" in `next dev`.
cpSync(path.join(source, "build", "pdf.min.mjs"), path.join(dest, "pdf.min.mjs"));
cpSync(path.join(source, "wasm"), path.join(dest, "wasm"), { recursive: true });
cpSync(path.join(source, "standard_fonts"), path.join(dest, "standard_fonts"), { recursive: true });
