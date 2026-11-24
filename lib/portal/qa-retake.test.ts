import assert from "node:assert/strict";
import test from "node:test";
import { isContentQaStudent, retakesAllowedFor } from "@/lib/portal/content-qa";

test("stable student ID wins over email for content-QA and retake privilege", () => {
  const previousEmail = process.env.TEJAS_CONTENT_QA_EMAIL;
  const previousId = process.env.TEJAS_CONTENT_QA_STUDENT_ID;
  const previousRetake = process.env.TEJAS_PORTAL_RETAKES;
  process.env.TEJAS_CONTENT_QA_EMAIL = "tejas-content-qa@dhe.org.in";
  process.env.TEJAS_CONTENT_QA_STUDENT_ID = "11111111-1111-4111-8111-111111111111";
  delete process.env.TEJAS_PORTAL_RETAKES;
  try {
    assert.equal(isContentQaStudent({ id: "11111111-1111-4111-8111-111111111111", email: "other@example.test" }), true);
    assert.equal(isContentQaStudent({ id: "22222222-2222-4222-8222-222222222222", email: "tejas-content-qa@dhe.org.in" }), false);
    assert.equal(retakesAllowedFor({ id: "11111111-1111-4111-8111-111111111111", email: "x@y.z" }), true);
    assert.equal(retakesAllowedFor({ id: "22222222-2222-4222-8222-222222222222", email: "tejas-content-qa@dhe.org.in" }), false);
  } finally {
    if (previousEmail === undefined) delete process.env.TEJAS_CONTENT_QA_EMAIL;
    else process.env.TEJAS_CONTENT_QA_EMAIL = previousEmail;
    if (previousId === undefined) delete process.env.TEJAS_CONTENT_QA_STUDENT_ID;
    else process.env.TEJAS_CONTENT_QA_STUDENT_ID = previousId;
    if (previousRetake === undefined) delete process.env.TEJAS_PORTAL_RETAKES;
    else process.env.TEJAS_PORTAL_RETAKES = previousRetake;
  }
});

test("client-forged email cannot impersonate QA when ID allowlist is set", () => {
  const previousId = process.env.TEJAS_CONTENT_QA_STUDENT_ID;
  const previousEmail = process.env.TEJAS_CONTENT_QA_EMAIL;
  const previousRetake = process.env.TEJAS_PORTAL_RETAKES;
  process.env.TEJAS_CONTENT_QA_STUDENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  delete process.env.TEJAS_CONTENT_QA_EMAIL;
  delete process.env.TEJAS_PORTAL_RETAKES;
  try {
    const forged = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "tejas-content-qa@dhe.org.in" };
    assert.equal(isContentQaStudent(forged), false);
    assert.equal(retakesAllowedFor(forged), false);
  } finally {
    if (previousId === undefined) delete process.env.TEJAS_CONTENT_QA_STUDENT_ID;
    else process.env.TEJAS_CONTENT_QA_STUDENT_ID = previousId;
    if (previousEmail === undefined) delete process.env.TEJAS_CONTENT_QA_EMAIL;
    else process.env.TEJAS_CONTENT_QA_EMAIL = previousEmail;
    if (previousRetake === undefined) delete process.env.TEJAS_PORTAL_RETAKES;
    else process.env.TEJAS_PORTAL_RETAKES = previousRetake;
  }
});

test("global TEJAS_PORTAL_RETAKES=allow still enables retakes for any student", () => {
  const previous = process.env.TEJAS_PORTAL_RETAKES;
  process.env.TEJAS_PORTAL_RETAKES = "allow";
  try {
    assert.equal(retakesAllowedFor({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "anyone@example.test" }), true);
  } finally {
    if (previous === undefined) delete process.env.TEJAS_PORTAL_RETAKES;
    else process.env.TEJAS_PORTAL_RETAKES = previous;
  }
});
