import assert from "node:assert/strict";
import test from "node:test";
import {
  claimUtr,
  createMemoryUtrClaimBackend,
  installUtrClaimTestBackend,
  noteUtr,
  releaseUtr,
  utrKey,
  utrOwner,
  utrRegistryUnavailableMessage,
} from "@/lib/registration/utr-claim";

test.afterEach(() => {
  installUtrClaimTestBackend(null);
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
});

test("successful atomic UTR claim and owner reuse", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  const owner = utrOwner("ebook", "student:book");
  const first = await claimUtr("AXISCN555001", "ebook", owner);
  assert.equal(first.ok, true);
  if (first.ok) {
    assert.equal(first.reused, false);
    assert.equal(first.key, "AXISCN555001");
    assert.equal(first.backend, "test");
  }
  const again = await claimUtr("AXISCN555001", "ebook", owner);
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.reused, true);
});

test("duplicate UTR rejection across channels", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  const first = await claimUtr("AXISCN555555", "school-registration", utrOwner("school-registration", "REF-A"));
  assert.equal(first.ok, true);
  const second = await claimUtr("AXISCN555555", "ebook", utrOwner("ebook", "REF-B"));
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.error, "duplicate");
  await releaseUtr("AXISCN555555", utrOwner("school-registration", "REF-A"));
  const third = await claimUtr("AXISCN555555", "ebook", utrOwner("ebook", "REF-B"));
  assert.equal(third.ok, true);
});

test("concurrent duplicate claim attempts: only one wins", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  const utr = "RACEUTR123456";
  const results = await Promise.all([
    claimUtr(utr, "school-registration", utrOwner("school-registration", "A")),
    claimUtr(utr, "individual-registration", utrOwner("individual-registration", "B")),
    claimUtr(utr, "ebook", utrOwner("ebook", "C")),
  ]);
  assert.equal(results.filter((item) => item.ok).length, 1);
  assert.equal(results.filter((item) => !item.ok).length, 2);
  assert.equal(utrKey(utr), "RACEUTR123456");
});

test("database unavailable returns controlled unavailable without throwing", async () => {
  installUtrClaimTestBackend(null);
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const result = await claimUtr("AXISCN555002", "ebook", utrOwner("ebook", "x"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "unavailable");
});

test("missing registry table is treated as unavailable", async () => {
  installUtrClaimTestBackend(null);
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "x".repeat(40);
  const previous = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ code: "PGRST205", message: "Could not find the table 'public.tejas_payment_utrs' in the schema cache" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
  try {
    const result = await claimUtr("AXISCN555003", "ebook", utrOwner("ebook", "y"));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "unavailable");
      assert.match(String(result.detail), /registry|migration/i);
    }
  } finally {
    globalThis.fetch = previous;
  }
});

test("retry after release allows a new owner to claim", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  const a = utrOwner("school-registration", "A");
  const b = utrOwner("ebook", "B");
  assert.equal((await claimUtr("RETRYUTR001", "school-registration", a)).ok, true);
  await releaseUtr("RETRYUTR001", a);
  const second = await claimUtr("RETRYUTR001", "ebook", b);
  assert.equal(second.ok, true);
});

test("OCR-success path must not auto-approve when UTR claim is unavailable", async () => {
  const { decideScreenshotPayment } = await import("@/lib/registration/payment-decision");
  installUtrClaimTestBackend(null);
  delete process.env.SUPABASE_URL;
  const claim = await claimUtr("AXISCN777001", "ebook", utrOwner("ebook", "s:b"));
  assert.equal(claim.ok, false);
  const ocrDecision = decideScreenshotPayment({
    enteredUtr: "AXISCN777001",
    extractedUtr: "AXISCN777001",
    extractedBeneficiary: "Vidya Bharti Institute of Training and Research Trust",
    extractedAmount: 49,
    paymentStatus: "success",
    expectedAmount: 49,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(ocrDecision.outcome, "automatic");
  const gated = !claim.ok
    ? {
        ...ocrDecision,
        outcome: "exception" as const,
        approvalMethod: "pending_exception" as const,
        verificationLabel: "screenshot_ocr_exception" as const,
        reason: utrRegistryUnavailableMessage(),
      }
    : ocrDecision;
  assert.equal(gated.outcome, "exception");
  assert.match(gated.reason, /uniqueness could not be established/i);
});

test("note and release are no-ops for foreign owners", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  const owner = utrOwner("ebook", "1");
  assert.equal((await claimUtr("NOTEUTR0001", "ebook", owner)).ok, true);
  await noteUtr("NOTEUTR0001", utrOwner("ebook", "other"), {
    extractedUtr: "NOTEUTR0001",
    reviewReason: "x",
    proofExt: "png",
    amountDue: 49,
    paymentStatus: "reported",
    approvalMethod: "pending_exception",
  });
  await releaseUtr("NOTEUTR0001", utrOwner("ebook", "other"));
  const dup = await claimUtr("NOTEUTR0001", "school-registration", utrOwner("school-registration", "2"));
  assert.equal(dup.ok, false);
});

test("supabase conflict with same owner is treated as reuse", async () => {
  installUtrClaimTestBackend(null);
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "y".repeat(40);
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls += 1;
    if (init?.method === "POST") {
      return new Response(JSON.stringify({ message: "duplicate" }), { status: 409, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify([{ owner_reference: "ebook:same" }]), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await claimUtr("AXISCN409001", "ebook", "ebook:same");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.reused, true);
      assert.equal(result.backend, "supabase");
    }
    assert.ok(calls >= 2);
  } finally {
    globalThis.fetch = previous;
  }
});
