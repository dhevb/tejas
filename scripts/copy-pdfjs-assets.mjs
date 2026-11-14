import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "node_modules", "pdfjs-dist");
const dest = path.join(root, "public", "pdfjs");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(path.join(source, "build", "pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.mjs"));
cpSync(path.join(source, "wasm"), path.join(dest, "wasm"), { recursive: true });
cpSync(path.join(source, "standard_fonts"), path.join(dest, "standard_fonts"), { recursive: true });
