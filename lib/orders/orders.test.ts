import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { POST as bookPost } from "@/app/api/books/order/route";
import { POST as verifyPost } from "@/app/api/ebook/admin/verify/route";
import { POST as credentialPost } from "@/app/api/ebook/credentials/route";
import { POST as loginPost } from "@/app/api/ebook/login/route";
import { GET as readGet } from "@/app/api/ebook/read/route";
import { POST as ebookPost } from "@/app/api/ebook/register/route";
import { readEbookAccount } from "@/lib/orders/ebook";
import { ordersRoot } from "@/lib/orders/files";
import { BOOK_PRICE, BOOK_SCHOOL_SHARE, BOOK_TEJAS, EBOOK_FEE } from "@/lib/registration/fee";

const dataDir = mkdtempSync(path.join(tmpdir(), "tejas-orders-"));
process.env.TEJAS_DATA_DIR = dataDir;
process.env.TEJAS_EBOOK_SECRET = "ebook-test-secret-16";

function bookForm(quantities: Record<string, string>, extra: Record<string, string> = {}) {
  const body = new FormData();
  body.set("schoolName", "River School");
  body.set("schoolAddress", "12 Station Road, Mohali");
  body.set("schoolEmail", "office@river.example");
  body.set("schoolMobile", "9812345678");
  body.set("coordinatorName", "Rahul Mehta");
  body.set("coordinatorDesignation", "Coordinator");
  body.set("coordinatorMobile", "9876543210");
  body.set("coordinatorEmail", "rahul@river.example");
  body.set("grossAmount", "1");
  body.set("schoolShare", "1");
  body.set("amountPayable", "1");
  body.set("totalQuantity", "1");
  for (const [key, value] of Object.entries(quantities)) body.set(key, value);
  for (const [key, value] of Object.entries(extra)) body.set(key, value);
  return body;
}

function bookRequest(body: FormData, key: string) {
  return new Request("http://localhost/api/books/order", {
    method: "POST",
    body,
    headers: { "x-idempotency-key": key, "x-forwarded-for": "203.0.113.10" },
  });
}

test("printed book totals are calculated on the server for each class and stream", async () => {
  const key = "book-order-key-0001";
  const send = () => bookPost(bookRequest(bookForm({
    qty_6_english: "2",
    qty_6_technology: "3",
    qty_4_english: "0",
  }), key));
  const first = await send();
  const saved = await first.json() as {
    ok: boolean;
    order: { reference: string; quantity: number; grossAmount: number; schoolShare: number; amountPayable: number; paymentCollected: boolean; dispatched: boolean };
  };
  assert.equal(first.status, 201);
  assert.equal(saved.order.quantity, 5);
  assert.equal(saved.order.grossAmount, 5 * BOOK_PRICE);
  assert.equal(saved.order.schoolShare, 5 * BOOK_SCHOOL_SHARE);
  assert.equal(saved.order.amountPayable, 5 * BOOK_TEJAS);
  assert.equal(saved.order.grossAmount, 850);
  assert.equal(saved.order.amountPayable, 680);
  assert.equal(saved.order.paymentCollected, false);
  assert.equal(saved.order.dispatched, false);
  const second = await send();
  const repeated = await second.json() as { order: { reference: string } };
  assert.equal(second.status, 200);
  assert.equal(repeated.order.reference, saved.order.reference);
  const conflict = await bookPost(bookRequest(bookForm({ qty_6_english: "9" }), key));
  assert.equal(conflict.status, 409);
  const files = readdirSync(path.join(ordersRoot(), "books", "orders"));
  assert.equal(files.length, 1);
});

test("future tech books are refused below class VI and a blank order is refused", async () => {
  const refused = await bookPost(bookRequest(bookForm({ qty_4_technology: "1" }), "book-order-key-0002"));
  const body = await refused.json() as { ok: boolean; fieldErrors: Record<string, string> };
  assert.equal(refused.status, 400);
  assert.match(body.fieldErrors.qty_4_technology, /not available/);
  const empty = await bookPost(bookRequest(bookForm({}), "book-order-key-0003"));
  const emptyBody = await empty.json() as { fieldErrors: Record<string, string> };
  assert.equal(empty.status, 400);
  assert.match(emptyBody.fieldErrors.lines, /at least one/);
});

function ebookForm(extra: Record<string, string> = {}) {
  const body = new FormData();
  body.set("studentName", "Aarav Sharma");
  body.set("parentName", "Anita Sharma");
  body.set("schoolName", "River School");
  body.set("classNumber", "5");
  body.set("stream_english", "yes");
  body.set("stream_mathematics", "yes");
  body.set("email", "aarav@river.example");
  body.set("mobile", "9811111111");
  body.set("feeAmount", "1");
  for (const [key, value] of Object.entries(extra)) body.set(key, value);
  return body;
}

function ebookRequest(body: FormData, key: string) {
  return new Request("http://localhost/api/ebook/register", {
    method: "POST",
    body,
    headers: { "x-idempotency-key": key, "x-forwarded-for": "203.0.113.20" },
  });
}

test("e-book registration charges ₹49 once and does not create a password", async () => {
  const first = await ebookPost(ebookRequest(ebookForm(), "ebook-reg-key-00001"));
  const saved = await first.json() as { ok: boolean; account: { reference: string; feeAmount: number; status: string; loginCreated: boolean; streams: string[] } };
  assert.equal(first.status, 201, JSON.stringify(saved));
  assert.equal(saved.account.feeAmount, EBOOK_FEE);
  assert.equal(saved.account.feeAmount, 49);
  assert.deepEqual(saved.account.streams, ["english", "mathematics"]);
  assert.equal(saved.account.status, "pending_payment");
  assert.equal(saved.account.loginCreated, false);
  assert.equal(JSON.stringify(saved).includes("password"), false);
  const repeat = await ebookPost(ebookRequest(ebookForm(), "ebook-reg-key-00002"));
  const again = await repeat.json() as { account: { reference: string } };
  assert.equal(again.account.reference, saved.account.reference);
  const changed = await ebookPost(ebookRequest(ebookForm({ studentName: "Other Child" }), "ebook-reg-key-00003"));
  assert.equal(changed.status, 409);
  const stored = await readEbookAccount(saved.account.reference);
  assert.equal(stored?.passwordHash, null);
  const future = await ebookPost(ebookRequest(ebookForm({ classNumber: "5", stream_technology: "yes", email: "tech@river.example" }), "ebook-reg-key-00004"));
  const futureBody = await future.json() as { fieldErrors: Record<string, string> };
  assert.equal(future.status, 400);
  assert.match(futureBody.fieldErrors.stream_technology, /not available/);
});

test("e-book payment verification, login, and reading stay on the authorised streams", async () => {
  const registered = await ebookPost(ebookRequest(ebookForm({
    studentName: "Meera Iyer",
    parentName: "Arun Iyer",
    email: "meera@river.example",
    mobile: "9822222222",
    classNumber: "8",
    stream_english: "yes",
    stream_mathematics: "",
  }), "ebook-reg-key-00005"));
  const account = await registered.json() as { account: { reference: string } };
  const denied = await verifyPost(new Request("http://localhost/api/ebook/admin/verify", {
    method: "POST",
    body: new FormData(),
  }));
  assert.equal(denied.status, 401);
  const { verifyEbookPayment } = await import("@/lib/orders/ebook");
  const issued = await verifyEbookPayment(account.account.reference);
  assert.equal(issued.ok, true);
  if (!issued.ok) return;
  const password = issued.password ?? "";
  assert.equal(password.length, 12);
  const second = await verifyEbookPayment(account.account.reference);
  assert.equal(second.ok && second.password, null);
  const accountFile = readFileSync(path.join(ordersRoot(), "ebooks", "accounts", `${account.account.reference}.json`));
  assert.equal(accountFile.includes(password), false);
  const earlyLogin = await loginPost(new Request("http://localhost/api/ebook/login", {
    method: "POST",
    body: (() => {
      const body = new FormData();
      body.set("email", "aarav@river.example");
      body.set("password", password);
      return body;
    })(),
  }));
  assert.equal(earlyLogin.status, 401);

  const collected = await credentialPost(new Request("http://localhost/api/ebook/credentials", {
    method: "POST",
    body: (() => {
      const body = new FormData();
      body.set("reference", account.account.reference);
      body.set("email", "meera@river.example");
      body.set("mobile", "9822222222");
      return body;
    })(),
  }));
  const credential = await collected.json() as { ok: boolean; password: string };
  assert.equal(collected.status, 200);
  assert.equal(credential.password, password);
  const again = await credentialPost(new Request("http://localhost/api/ebook/credentials", {
    method: "POST",
    body: (() => {
      const body = new FormData();
      body.set("reference", account.account.reference);
      body.set("email", "meera@river.example");
      body.set("mobile", "9822222222");
      return body;
    })(),
    headers: { "x-forwarded-for": "203.0.113.21" },
  }));
  assert.equal(again.status, 400);

  const login = await loginPost(new Request("http://localhost/api/ebook/login", {
    method: "POST",
    body: (() => {
      const body = new FormData();
      body.set("email", "meera@river.example");
      body.set("password", password);
      return body;
    })(),
    headers: { "x-forwarded-for": "203.0.113.22" },
  }));
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.equal(setCookie.includes(password), false);
  assert.match(setCookie, /HttpOnly/i);
  const cookie = setCookie.split(";")[0];
  const open = await readGet(new Request(`http://localhost/api/ebook/read?stream=english&account=${account.account.reference}`, {
    headers: { cookie },
  }));
  const opened = await open.json() as { message: string; download?: boolean };
  assert.equal(open.status, 404);
  assert.equal(opened.download, false);
  assert.equal(open.headers.get("content-type")?.includes("application/json"), true);
  assert.equal(open.headers.get("content-disposition"), null);
  assert.equal(JSON.stringify(opened).includes("%PDF"), false);
  assert.equal(JSON.stringify(opened).includes("/documents/"), false);
  assert.equal(JSON.stringify(opened).includes("Aarav"), false);
  const wrong = await readGet(new Request("http://localhost/api/ebook/read?stream=technology", { headers: { cookie } }));
  assert.equal(wrong.status, 403);
  const anonymous = await readGet(new Request("http://localhost/api/ebook/read?stream=english"));
  assert.equal(anonymous.status, 401);
  const anonymousBody = await anonymous.json() as { message: string };
  assert.equal(anonymousBody.message.includes("supplied"), false);
});

test("public files do not include an e-book source", () => {
  const root = path.join(process.cwd(), "public");
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const child = path.join(dir, name);
      if (statSync(child).isDirectory()) walk(child);
      else if (name.toLowerCase().endsWith(".pdf")) found.push(path.relative(root, child));
    }
  };
  walk(root);
  assert.deepEqual(found.sort(), [
    "documents/dhe-english-olympiad-2025-brief-report.pdf",
    "documents/tejas-olympiad-2026-27-brochure.pdf",
    "documents/tejas-olympiad-2026-27-invitation.pdf",
  ]);
});
