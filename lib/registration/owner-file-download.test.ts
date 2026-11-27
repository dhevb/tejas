import assert from "node:assert/strict";
import test from "node:test";
import {
  isBrowserNavigationRequest,
  parseOwnerFileDownloadPath,
} from "@/lib/registration/owner-file-download";

test("parseOwnerFileDownloadPath accepts only Owner file routes", () => {
  assert.equal(
    parseOwnerFileDownloadPath("/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=upload"),
    "/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=upload",
  );
  assert.equal(
    parseOwnerFileDownloadPath(
      "https://tejas.dhe.org.in/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=receipt",
    ),
    "/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=receipt",
  );
  assert.equal(
    parseOwnerFileDownloadPath("/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file"),
    "/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file",
  );
  assert.equal(parseOwnerFileDownloadPath("/api/register/admin/export?report=complete"), null);
  assert.equal(parseOwnerFileDownloadPath("https://evil.example/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=upload"), "/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=upload");
  assert.equal(parseOwnerFileDownloadPath("/schools/register/review"), null);
  assert.equal(parseOwnerFileDownloadPath("/api/register/admin/registrations/../session"), null);
  assert.equal(parseOwnerFileDownloadPath("/api/register/admin/registrations/NOT-VALID/file?kind=upload"), null);
});

test("isBrowserNavigationRequest detects navigate and HTML accepts", () => {
  assert.equal(
    isBrowserNavigationRequest(new Request("https://tejas.dhe.org.in/x", { headers: { "sec-fetch-mode": "navigate" } })),
    true,
  );
  assert.equal(
    isBrowserNavigationRequest(new Request("https://tejas.dhe.org.in/x", { headers: { accept: "text/html,application/xhtml+xml" } })),
    true,
  );
  assert.equal(
    isBrowserNavigationRequest(new Request("https://tejas.dhe.org.in/x", { headers: { accept: "application/json", "sec-fetch-mode": "cors" } })),
    false,
  );
});
