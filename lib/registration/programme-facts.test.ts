import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { programme } from "@/content/current-cycle";

test("approved programme facts stay the single published record", () => {
  assert.equal(programme.name, "TEJAS Olympiad 2026–27");
  assert.equal(programme.fullForm, "Talent Exploration for Junior Aspiring Scholars");
  assert.equal(programme.tagline, "Find your spark...");
  assert.equal(programme.email, "tejas@dhe.org.in");
  assert.deepEqual(programme.phones.map((phone) => phone.display), ["+91 99886 90588", "+91 79034 31900"]);
  assert.equal(programme.registrationOpens, "3 November 2026");
  assert.equal(programme.registrationCloses, "20 November 2026");
  assert.equal(programme.streams.find((stream) => stream.id === "technology")?.classes, "Classes VI–X");
  assert.equal(programme.registrationGross, 150);
  assert.equal(programme.registrationSchoolShare, 30);
  assert.equal(programme.registrationPayable, 120);
  assert.equal(programme.bookGross, 170);
  assert.equal(programme.bookSchoolShare, 34);
  assert.equal(programme.bookPayable, 136);
  assert.equal(programme.ebookSaleOpen, false);
  assert.equal(programme.prizes.first, 3100);
  assert.equal(programme.prizes.consolationCount, 10);
});

function filesUnder(dir: string): string[] {
  const abs = path.join(process.cwd(), dir);
  return readdirSync(abs).flatMap((name) => {
    const child = path.join(abs, name);
    if (statSync(child).isDirectory()) return filesUnder(path.join(dir, name));
    return /\.(ts|tsx)$/.test(name) ? [child] : [];
  });
}

test("public source does not keep replaced programme claims", () => {
  const roots = ["app", "components", "config", "content", "data", "features"];
  const forbidden = [
    /tejasolympiad@/i,
    /1 November 2026/,
    /February 2027/,
    /National Talent Development Ecosystem/,
    /olympiad@shikshamahakumbh/i,
  ];
  const hits: string[] = [];
  for (const root of roots) {
    for (const file of filesUnder(root)) {
      const text = readFileSync(file, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (forbidden.some((pattern) => pattern.test(line))) hits.push(`${file}:${index + 1}:${line.trim()}`);
        if (/Future Tech/.test(line) && /III–X/.test(line) && !/VI/.test(line)) hits.push(`${file}:${index + 1}:${line.trim()}`);
      });
    }
  }
  assert.deepEqual(hits, []);
});
