import assert from "node:assert/strict";
import test from "node:test";
import { calculateFee } from "@/lib/registration/fee";
import { insertRegistration, readRegistration, updatePayment } from "@/lib/registration/database";
import type { RegistrationRecord } from "@/lib/registration/store";

const REFERENCE = "TEJAS-2026-ABCDEFGHJKLMNPQRSTU2";

function record(): RegistrationRecord {
  return {
    reference: REFERENCE,
    createdAt: "2026-11-01T00:00:00.000Z",
    school: {
      schoolName: "River School",
      schoolAddress: "12 Example Road, Sector 1",
      state: "Punjab",
      district: "Sahibzada Ajit Singh Nagar",
      city: "Mohali",
      pin: "140301",
      pan: "PQRSX1234L",
      panDuplicate: false,
      schoolEmail: "office@river.example",
      schoolMobile: "9812345678",
      affiliationBoard: "CBSE",
      affiliationNumber: "123456",
      schoolCategory: "Private",
      principalName: "Anita Verma",
      principalMobile: "9811111111",
      principalEmail: "anita@river.example",
      principalDesignation: "Headmaster",
      coordinatorName: "Ravi Mehta",
      coordinatorMobile: "9822222222",
      coordinatorEmail: "ravi@river.example",
      coordinatorDesignation: "Coordinator",
      previousParticipation: false,
      previousReference: null,
      printedBooks: "yes",
      bookQuantity: 2,
      ebookAccess: "yes",
      representativeName: "Not Collected",
      representativeDesignation: "Not Collected",
    },
    students: [
      {
        row: 2,
        fullName: "Aarav Sharma",
        parentName: "Meera Sharma",
        parentMobile: "9898989898",
        parentEmail: "meera@example.test",
        dateOfBirth: "15-08-2015",
        classNumber: 5,
        classLabel: "V",
        section: "A",
        rollNumber: "1",
        schoolName: "River School",
        streams: ["english", "mathematics"],
      },
    ],
    fee: calculateFee(2, { printedBooks: 2, ebookAccess: 1 }),
    payment: { status: "pending_instructions", transactionReference: null, reviewNote: null, history: [] },
    uploadExt: "xlsx",
    receiptExt: null,
  };
}

function jsonResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("a database registration writes the normalised rows and can be read back", async () => {
  const calls: string[] = [];
  let ebookActivated = "";
  let paymentAmount = "";
  let bookOrder = "";
  let schoolBody = "";
  let principalBody = "";
  let registrationBody = "";
  const previous = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "s".repeat(24);
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${new URL(url).pathname}`);
    if (url.includes("/tejas_schools?") && init?.method === "GET") return jsonResponse([], 200);
    if (url.endsWith("/tejas_schools") && init?.method === "POST") {
      schoolBody = String(init.body ?? "");
      return jsonResponse([{ id: "school-1" }]);
    }
    if (url.endsWith("/tejas_principals") && init?.method === "POST") principalBody = String(init.body ?? "");
    if (url.endsWith("/tejas_registrations") && init?.method === "POST") {
      registrationBody = String(init.body ?? "");
      return jsonResponse([{ id: "reg-1" }]);
    }
    if (url.includes("/tejas_registrations?") && init?.method === "GET") return jsonResponse([{ record_snapshot: record(), reference: REFERENCE }], 200);
    if (url.endsWith("/tejas_students")) return jsonResponse([{ id: "student-1" }]);
    if (url.endsWith("/tejas_payments")) {
      paymentAmount = String(init?.body ?? "");
      return jsonResponse([{ id: "pay-1", registration_id: "reg-1" }]);
    }
    if (url.endsWith("/tejas_book_orders")) bookOrder = String(init?.body ?? "");
    if (url.endsWith("/tejas_ebook_access")) ebookActivated = String(init?.body ?? "");
    if (url.includes("/storage/v1/object/")) return jsonResponse({ Key: "ok" });
    return jsonResponse([], 201);
  }) as typeof fetch;
  const restore = () => {
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  };
  try {
    await insertRegistration(record(), { upload: Buffer.from("sheet"), receipt: null }, { key: "submission-key-0001", hash: "abc" });
    const saved = await readRegistration(REFERENCE);
    assert.equal(saved?.school.schoolName, "River School");
    assert.equal(saved?.students[0]?.streams.length, 2);
    assert.ok(calls.some((call) => call === "POST /rest/v1/tejas_schools"));
    assert.ok(calls.some((call) => call === "POST /rest/v1/tejas_students"));
    assert.ok(calls.some((call) => call === "POST /rest/v1/tejas_registration_streams"));
    assert.ok(calls.some((call) => call === "POST /rest/v1/tejas_payments"));
    assert.ok(calls.some((call) => call === "POST /rest/v1/tejas_ebook_access"));
    assert.ok(calls.some((call) => call.includes("/storage/v1/object/tejas-registration-files/")));
    assert.equal(calls.some((call) => call.includes("tejas-payment-proofs")), false);
    assert.equal(ebookActivated.includes('"activated":false'), true);
    assert.equal(ebookActivated.includes('"student_count":0'), true);
    assert.equal(calls.filter((call) => call === "POST /rest/v1/tejas_payments").length, 1);
    const payment = JSON.parse(paymentAmount) as { registration_id: string; status: string; amount_due: number; history: { note: string }[] };
    assert.equal(payment.registration_id, "reg-1");
    assert.equal(payment.status, "pending_instructions");
    assert.equal(payment.amount_due, 640);
    assert.equal(payment.history[0]?.note, "Payment Pending");
    assert.equal(bookOrder.includes('"quantity":2'), true);
    assert.equal(bookOrder.includes('"amount":340'), true);
    assert.equal(schoolBody.includes('"representative_name":null'), true);
    assert.equal(schoolBody.includes('"representative_designation":null'), true);
    assert.equal(schoolBody.includes("Not Collected"), false);
    assert.equal(principalBody.includes('"designation":"Principal"'), true);
    assert.equal(principalBody.includes("Headmaster"), false);
    assert.equal(registrationBody.includes('"representativeName":null'), true);
    assert.equal(registrationBody.includes("Not Collected"), false);
  } finally {
    globalThis.fetch = original;
    restore();
  }
});

test("a failed database write removes the rows it already created", async () => {
  const calls: string[] = [];
  const previous = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "s".repeat(24);
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${new URL(url).pathname}`);
    if (url.endsWith("/tejas_schools") && init?.method === "POST") return jsonResponse([{ id: "school-1" }]);
    if (url.endsWith("/tejas_registrations") && init?.method === "POST") return jsonResponse([{ id: "reg-1" }]);
    if (url.endsWith("/tejas_students") && init?.method === "POST") return jsonResponse([{ id: "student-1" }]);
    if (url.endsWith("/tejas_payments") && init?.method === "POST") return jsonResponse({ message: "no" }, 400);
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    return jsonResponse([], 201);
  }) as typeof fetch;
  const restore = () => {
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  };
  try {
    await assert.rejects(() => insertRegistration(record(), { upload: Buffer.from("sheet"), receipt: null }), /Database request failed \(400\)/);
    assert.ok(calls.some((call) => call.startsWith("DELETE /rest/v1/tejas_students")));
    assert.ok(calls.some((call) => call.startsWith("DELETE /rest/v1/tejas_registrations")));
    assert.ok(calls.some((call) => call.startsWith("DELETE /rest/v1/tejas_schools")));
  } finally {
    globalThis.fetch = original;
    restore();
  }
});

test("verifying a payment that is already verified does not write another history entry", async () => {
  let paymentStatus = "reported";
  const patches: string[] = [];
  let audits = 0;
  const previous = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "s".repeat(24);
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (method === "GET" && url.includes("/tejas_registrations")) return jsonResponse([{ id: "reg-1" }], 200);
    if (method === "GET" && url.includes("select=status")) return jsonResponse([{ status: paymentStatus }], 200);
    if (method === "PATCH" && url.includes("/tejas_payments")) {
      patches.push(`${url}\n${String(init?.body ?? "")}`);
      if (!url.includes("status=eq.reported")) return jsonResponse([], 200);
      paymentStatus = "confirmed";
      return jsonResponse([{ id: "pay-1", status: "confirmed" }], 200);
    }
    if (method === "PATCH") return jsonResponse([{ id: "reg-1" }], 200);
    if (method === "POST" && url.includes("/tejas_audit_logs")) {
      audits += 1;
      const body = String(init?.body ?? "");
      if (!body.includes('"actor":"staff"')) throw new Error("audit actor");
      return jsonResponse([], 201);
    }
    return jsonResponse([], 200);
  }) as typeof fetch;
  const restore = () => {
    globalThis.fetch = original;
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  };
  const confirmed = record();
  confirmed.payment = {
    status: "confirmed",
    transactionReference: "UPI654321",
    reviewNote: null,
    history: [
      { at: "2026-11-01T04:36:36.314Z", status: "pending_instructions", note: "Payment Pending" },
      { at: "2026-11-01T06:23:11.318Z", status: "confirmed", note: null, actor: "staff" },
    ],
  };
  try {
    assert.equal(await updatePayment(REFERENCE, confirmed, "staff"), "updated");
    assert.equal(patches.length, 1);
    assert.equal(patches[0]?.includes("amount_due"), false);
    assert.equal(patches[0]?.includes(REFERENCE), false);
    assert.equal(audits, 1);
    assert.equal(await updatePayment(REFERENCE, confirmed, "staff"), "unchanged");
    assert.equal(patches.length, 1);
    assert.equal(audits, 1);
  } finally {
    restore();
  }
});
