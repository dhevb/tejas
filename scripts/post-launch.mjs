/**
 * Post-launch automation — health checks, OG validation, IndexNow submission.
 * Run: node scripts/post-launch.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = "https://tejas.dhe.org.in";
const INDEXNOW_KEY = "735cd8a735cd8a735cd8a735cd8a735cd";

const PAGES = [
  "/",
  "/about",
  "/olympiads",
  "/olympiads/english",
  "/olympiads/mathematics",
  "/olympiads/technology",
  "/research",
  "/innovation",
  "/hall-of-fame",
  "/resources",
  "/schools",
  "/faq",
  "/beta",
];

const PARTNER_SCHOOLS = [
  "Wisdom World School, Kurukshetra",
  "Kundan International School, Chandigarh",
  "Sharda Sarvhitkari School, Chandigarh",
  "Angels World School, Morinda",
  "St. Vivekanand Millennium School, Pinjore",
  "University Sr. Sec. School, Kurukshetra",
  "Vidya Mandir Public School, Pathankot",
];

async function healthCheck() {
  const results = [];
  for (const path of [...PAGES, "/sitemap.xml", "/robots.txt", "/opengraph-image"]) {
    const url = `${BASE}${path}`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      results.push({ url, status: res.status, ok: res.ok });
    } catch (e) {
      results.push({ url, status: 0, ok: false, error: String(e) });
    }
  }
  return results;
}

async function verifyOg(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  const html = await res.text();
  const get = (prop) => {
    const m = html.match(new RegExp(`property="${prop}" content="([^"]+)"`));
    return m?.[1]?.replace(/&amp;/g, "&").replace(/&#x27;/g, "'") ?? null;
  };
  const image = get("og:image");
  let imageOk = false;
  if (image) {
    try {
      const img = await fetch(image.startsWith("http") ? image : `${BASE}${image}`);
      imageOk = img.ok && (img.headers.get("content-type") ?? "").includes("image");
    } catch {
      imageOk = false;
    }
  }
  return {
    url,
    title: get("og:title"),
    description: get("og:description")?.slice(0, 80) + "…",
    image,
    imageOk,
    valid: !!(get("og:title") && get("og:description") && image && imageOk),
  };
}

async function submitIndexNow(urls) {
  const body = {
    host: "tejas.dhe.org.in",
    key: INDEXNOW_KEY,
    keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];
  const results = [];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      results.push({ endpoint, status: res.status, ok: res.ok || res.status === 202 });
    } catch (e) {
      results.push({ endpoint, status: 0, ok: false, error: String(e) });
    }
  }
  return results;
}

async function sendBetaInviteEmail() {
  const inviteBody = `Dear Partner School Coordinator,

TEJAS (Talent Exploration for Junior Aspiring Scholars) — TEJAS Olympiad 2026–27 — is now live at https://tejas.dhe.org.in

We invite your school to participate in a closed beta test before public announcement.

Please share https://tejas.dhe.org.in/beta with 2–3 teachers and 5–10 students (Classes III–X) and submit feedback via the form on that page.

Partner schools from the 1st DHE English Olympiad 2025:
${PARTNER_SCHOOLS.map((s) => `• ${s}`).join("\n")}

Focus areas for feedback:
1. Is TEJAS clear as a platform (not just an exam)?
2. Can users find their olympiad subject quickly?
3. Are the TEJAS Olympiad 2026–27 dates and fee clear?
4. Any confusing sections or premature "Coming Soon" labels?

Thank you for helping shape TEJAS.

Olympiad Cell
Department of Holistic Education`;

  try {
    const res = await fetch("https://formsubmit.co/ajax/olympiad@shikshamahakumbh.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: "TEJAS Post-Launch Automation",
        email: "noreply@tejas.dhe.org.in",
        _subject: "TEJAS Beta Testing — Please Forward to Partner Schools",
        _template: "table",
        message: inviteBody,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function main() {
  console.log("TEJAS Post-Launch Automation\n");

  console.log("1. Health checks…");
  const health = await healthCheck();
  const healthOk = health.every((h) => h.ok);
  health.forEach((h) => console.log(`   ${h.ok ? "✓" : "✗"} ${h.status} ${h.url}`));

  console.log("\n2. Open Graph verification…");
  const ogPages = ["/", "/olympiads/english", "/about"];
  const og = await Promise.all(ogPages.map(verifyOg));
  og.forEach((o) =>
    console.log(`   ${o.valid ? "✓" : "✗"} ${o.url}\n      title: ${o.title}\n      image: ${o.imageOk ? "OK" : "FAIL"}`)
  );

  console.log("\n3. IndexNow submission…");
  const allUrls = PAGES.map((p) => `${BASE}${p}`);
  const indexNow = await submitIndexNow(allUrls);
  indexNow.forEach((r) => console.log(`   ${r.ok ? "✓" : "✗"} ${r.endpoint} → ${r.status}`));

  console.log("\n4. Beta invite email to Olympiad Cell…");
  const invite = await sendBetaInviteEmail();
  console.log(`   ${invite.ok ? "✓" : "✗"} FormSubmit → olympiad@shikshamahakumbh.com (${invite.status ?? invite.error})`);

  const report = `# TEJAS Post-Launch Report

Generated: ${new Date().toISOString()}

## Health Checks
${health.map((h) => `- [${h.ok ? "x" : " "}] ${h.status} ${h.url}`).join("\n")}

## Open Graph
${og.map((o) => `- [${o.valid ? "x" : " "}] ${o.url}`).join("\n")}

## IndexNow
${indexNow.map((r) => `- [${r.ok ? "x" : " "}] ${r.endpoint} (${r.status})`).join("\n")}

## Beta Invite
- Status: ${invite.ok ? "Sent" : "Failed"} (${invite.status ?? invite.error ?? "unknown"})

## Google Search Console
Manual step required: Add property at https://search.google.com/search-console and submit \`${BASE}/sitemap.xml\`
(IndexNow covers Bing/Yandex; Google requires GSC verification via DNS or HTML tag.)

## Vercel Monitoring
- Dashboard: https://vercel.com/dhe-projects/tejas
- Logs: \`npx vercel logs tejas.dhe.org.in --since 24h\`
`;

  const reportPath = join(__dirname, "..", "docs", "POST_LAUNCH_REPORT.md");
  writeFileSync(reportPath, report);
  console.log(`\nReport written to docs/POST_LAUNCH_REPORT.md`);
  console.log(healthOk && og.every((o) => o.valid) ? "\n✓ All automated checks passed." : "\n⚠ Some checks need attention.");

  process.exit(healthOk ? 0 : 1);
}

main();
