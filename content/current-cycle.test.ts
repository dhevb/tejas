import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { currentCycle, REGISTRATION_CLOSES_LABEL, REGISTRATION_CLOSES_ON, REGISTRATION_CLOSES_SHORT, REGISTRATION_OPENS_ON, RESULT_ANNOUNCEMENT_ON, RESULT_PAGE_SENTENCE } from "./current-cycle";

const ROOTS = ["app", "components", "content", "data", "features"];

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) files.push(full);
  }
  return files;
}

test("current registration and result dates use the approved values", () => {
  assert.equal(REGISTRATION_OPENS_ON, "2026-11-03");
  assert.equal(REGISTRATION_CLOSES_ON, "2026-11-30");
  assert.equal(REGISTRATION_CLOSES_SHORT, "30 Nov");
  assert.equal(REGISTRATION_CLOSES_LABEL, "30 November 2026");
  assert.equal(RESULT_ANNOUNCEMENT_ON, "2027-01-12");
  assert.match(currentCycle.registrationStatus.en, /closes on 30 November 2026/);
  assert.match(currentCycle.registrationStatus.hi, /30 नवंबर 2026/);
  assert.equal(currentCycle.felicitation.en, "Results to be declared on 12 January 2027");
  assert.equal(RESULT_PAGE_SENTENCE, "Results to be declared on 12 January 2027");
  assert.match(currentCycle.felicitation.hi, /12 जनवरी 2027/);
  assert.match(currentCycle.fee.en, /₹150/);
  assert.match(currentCycle.fee.en, /₹49/);
});

test("public source does not keep the retired deadline or the February 2027 result sentence", () => {
  const retired = ["20 November 2026", "20 Nov", "20th November", "2026-11-20", "3–20 November", "February 2027", "फरवरी 2027", "20 नवंबर 2026", "Results are declared"];
  const hits: string[] = [];
  for (const root of ROOTS) {
    for (const file of sourceFiles(root)) {
      const source = readFileSync(file, "utf8");
      for (const phrase of retired) {
        if (source.includes(phrase)) hits.push(`${file}: ${phrase}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});

test("the three Olympiad pages use the result sentence and do not publish a syllabus", () => {
  const portal = readFileSync("components/olympiads/OlympiadPortal.tsx", "utf8");
  const form = readFileSync("app/schools/register/school-registration-form.tsx", "utf8");
  assert.equal(RESULT_PAGE_SENTENCE, "Results to be declared on 12 January 2027");
  assert.match(portal, /RESULT_PAGE_SENTENCE/);
  assert.equal(portal.includes('id="syllabus"'), false);
  assert.equal(portal.includes(">Syllabus<"), false);
  for (const file of ["content/olympiads/english.ts", "content/olympiads/mathematics.ts", "content/olympiads/technology.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /syllabus:\s*\[\]/);
    assert.equal(source.includes("Is the syllabus"), false);
  }
  assert.match(readFileSync("content/olympiads/english.ts", "utf8"), /Classes 3–10/);
  assert.match(readFileSync("content/olympiads/mathematics.ts", "utf8"), /Classes 3–10/);
  assert.match(readFileSync("content/olympiads/technology.ts", "utf8"), /Classes 6–10/);
  assert.match(readFileSync("data/faq.ts", "utf8"), /Results to be declared on 12 January 2027/);
  assert.match(form, /If a student participates in two or more TEJAS streams, enter the student&apos;s details separately for each stream in separate rows\. Each stream entry will be considered a separate registration, and the registration fee will be charged separately for each stream\./);
});

test("current programme names stay TEJAS while the 2025 English Olympiad name is kept", () => {
  const current = readFileSync("content/current-cycle.ts", "utf8");
  assert.match(current, /1st DHE English Olympiad/);
  assert.match(current, /TEJAS Olympiad 2026–27/);
  const streams = readFileSync("lib/registration/schema.ts", "utf8");
  assert.match(streams, /TEJAS English/);
  assert.match(streams, /TEJAS Mathematics/);
  assert.match(streams, /TEJAS Future Tech/);
  assert.match(streams, /PREVIOUS_OLYMPIAD_NAME = "1st DHE English Olympiad"/);
});
