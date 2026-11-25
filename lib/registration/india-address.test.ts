import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  UNIDENTIFIED_DISTRICT,
  UNIDENTIFIED_LOCATION,
  parseIndiaAddress,
} from "@/lib/registration/india-address";
import { filterRegistrationsForExport } from "@/lib/registration/export-filters";
import type { RegistrationRecord } from "@/lib/registration/store";
import { createSessionValue, STAFF_RECOVERY_SUBJECT, tokenMatches } from "@/lib/registration/auth";
import { isRegistrationOwnerSubject } from "@/lib/registration/staff";

describe("Indian address State/District extraction", () => {
  test("parses full address with state and district", () => {
    const parsed = parseIndiaAddress(
      "Delhi Public School, Sector 45, Gurugram, Haryana 122003",
    );
    assert.equal(parsed.state, "Haryana");
    assert.equal(parsed.district, "Gurugram");
    assert.equal(parsed.fullyIdentified, true);
    assert.equal(parsed.stateKey, "Haryana");
    assert.equal(parsed.districtKey, "Gurugram");
  });

  test("supports spelling variations and abbreviations", () => {
    const bangalore = parseIndiaAddress("ABC School, Bangalore Urban, Karnataka");
    assert.equal(bangalore.state, "Karnataka");
    assert.equal(bangalore.district, "Bengaluru Urban");

    const tn = parseIndiaAddress("St. Mary's, T. Nagar, Chennai, TN 600017");
    assert.equal(tn.state, "Tamil Nadu");
    assert.equal(tn.district, "Chennai");

    const up = parseIndiaAddress("Model School, Lucknow, U.P. 226001");
    assert.equal(up.state, "Uttar Pradesh");
    assert.equal(up.district, "Lucknow");

    const calcutta = parseIndiaAddress("Heritage School, Calcutta, West Bengal");
    assert.equal(calcutta.state, "West Bengal");
    assert.equal(calcutta.district, "Kolkata");
  });

  test("does not invent district when only state is present", () => {
    const parsed = parseIndiaAddress("Green Valley School, Near Bus Stand, Maharashtra");
    assert.equal(parsed.state, "Maharashtra");
    assert.equal(parsed.district, null);
    assert.equal(parsed.districtKey, UNIDENTIFIED_DISTRICT);
    assert.equal(parsed.fullyIdentified, false);
  });

  test("does not invent state when address lacks identifiable geography", () => {
    const parsed = parseIndiaAddress("Near temple, Main Road, Ward No. 4");
    assert.equal(parsed.state, null);
    assert.equal(parsed.district, null);
    assert.equal(parsed.stateKey, UNIDENTIFIED_LOCATION);
    assert.equal(parsed.districtKey, UNIDENTIFIED_LOCATION);
  });

  test("marks conflicting multi-state addresses unidentified", () => {
    const parsed = parseIndiaAddress("Campus Road, between Kerala and Tamil Nadu border office");
    assert.equal(parsed.stateKey, UNIDENTIFIED_LOCATION);
    assert.equal(parsed.fullyIdentified, false);
    assert.match(parsed.notes.join(" "), /Conflict/i);
  });

  test("ambiguous PIN prefix does not veto an explicit State", () => {
    // 560001 is a Karnataka-range prefix; text says Rajasthan — text wins (no PIN veto).
    const parsed = parseIndiaAddress("City School, Jaipur, Rajasthan 560001");
    assert.equal(parsed.state, "Rajasthan");
    assert.equal(parsed.district, "Jaipur");
    assert.equal(parsed.fullyIdentified, true);
  });

  test("PIN-prefix false conflicts: Mohali / Dehradun / Dhanbad / Leh", () => {
    const mohali = parseIndiaAddress("School, Mohali, Punjab 160055");
    assert.equal(mohali.state, "Punjab");
    assert.equal(mohali.district, "Sahibzada Ajit Singh Nagar");
    assert.equal(mohali.fullyIdentified, true);

    const dehradun = parseIndiaAddress("School, Dehradun, Uttarakhand 248001");
    assert.equal(dehradun.state, "Uttarakhand");
    assert.equal(dehradun.district, "Dehradun");
    assert.equal(dehradun.fullyIdentified, true);

    const dhanbad = parseIndiaAddress("School, Dhanbad, Jharkhand 826001");
    assert.equal(dhanbad.state, "Jharkhand");
    assert.equal(dhanbad.district, "Dhanbad");
    assert.equal(dhanbad.fullyIdentified, true);

    const leh = parseIndiaAddress("School, Leh, Ladakh 194101");
    assert.equal(leh.state, "Ladakh");
    assert.equal(leh.district, "Leh");
    assert.equal(leh.fullyIdentified, true);
  });

  test("explicit U.P. and T.N. abbreviations continue working", () => {
    const up = parseIndiaAddress("Model School, Lucknow, U.P. 226001");
    assert.equal(up.state, "Uttar Pradesh");
    assert.equal(up.district, "Lucknow");

    const tn = parseIndiaAddress("St. Mary's, T. Nagar, Chennai, T.N. 600017");
    assert.equal(tn.state, "Tamil Nadu");
    assert.equal(tn.district, "Chennai");

    const tnCaps = parseIndiaAddress("St. Mary's, T. Nagar, Chennai, TN 600017");
    assert.equal(tnCaps.state, "Tamil Nadu");
    assert.equal(tnCaps.district, "Chennai");
  });

  test("ordinary short tokens do not falsely identify States", () => {
    const climb = parseIndiaAddress("School near the up hill temple ward 4");
    assert.equal(climb.stateKey, UNIDENTIFIED_LOCATION);

    const inRoad = parseIndiaAddress("Campus on the main in road circle");
    assert.equal(inRoad.stateKey, UNIDENTIFIED_LOCATION);

    const lowerTn = parseIndiaAddress("Workshop tn tools lane without city");
    assert.equal(lowerTn.stateKey, UNIDENTIFIED_LOCATION);
  });

  test("never rewrites the original address string", () => {
    const original = "  DPS, Sec-12, NOIDA, Uttar Pradesh 201301 ";
    const parsed = parseIndiaAddress(original);
    assert.equal(parsed.state, "Uttar Pradesh");
    assert.equal(parsed.district, "Gautam Buddha Nagar");
    // Parser returns derived fields only; callers must keep the original string untouched.
    assert.equal(original, "  DPS, Sec-12, NOIDA, Uttar Pradesh 201301 ");
  });

  test("unique district can identify state when state text is missing", () => {
    const parsed = parseIndiaAddress("Kendriya Vidyalaya, Thrissur 680001");
    assert.equal(parsed.state, "Kerala");
    assert.equal(parsed.district, "Thrissur");
  });

  test("ambiguous shared district names without state stay unidentified", () => {
    // Pratapgarh exists in both Uttar Pradesh and Rajasthan — no State text → fail closed.
    const parsed = parseIndiaAddress("Public School, Pratapgarh 230001");
    assert.equal(parsed.fullyIdentified, false);
    assert.equal(parsed.stateKey, UNIDENTIFIED_LOCATION);
  });

  test("PIN alone never invents a District", () => {
    const parsed = parseIndiaAddress("Some School Campus 411001");
    assert.equal(parsed.district, null);
    assert.notEqual(parsed.districtKey, "Pune");
  });
});

describe("State → District filtering and exports", () => {
  function fakeRecord(partial: {
    reference: string;
    address: string;
    status?: RegistrationRecord["payment"]["status"];
    schoolName?: string;
  }): RegistrationRecord {
    return {
      reference: partial.reference,
      createdAt: "2026-01-01T00:00:00.000Z",
      school: {
        schoolName: partial.schoolName ?? "Test School",
        schoolAddress: partial.address,
        state: "",
        district: "",
        city: "",
        pin: "",
        pan: "AAACB1234H",
        panHolder: "school",
        panDuplicate: false,
        schoolEmail: "school@example.com",
        schoolMobile: "9876543210",
        affiliationBoard: "",
        affiliationNumber: null,
        schoolCategory: "Private",
        principalName: "Principal",
        principalMobile: "9876543211",
        principalEmail: "principal@example.com",
        principalDesignation: "Principal",
        coordinatorName: "Coordinator",
        coordinatorMobile: "9876543212",
        coordinatorEmail: "coord@example.com",
        coordinatorDesignation: "Teacher",
        previousParticipation: false,
        previousReference: null,
        printedBooks: "no",
        bookQuantity: 0,
        ebookAccess: "no",
        representativeName: null,
        representativeDesignation: null,
      },
      students: [],
      fee: {
        studentStreamRegistrations: 0,
        totalStudentFees: 0,
        registrationSchoolShare: 0,
        registrationPayable: 0,
        payableToTejas: 0,
        schoolShare: 0,
        schoolShareApproved: true,
        printedBooks: 0,
        printedBookAmount: 0,
        bookSchoolShare: 0,
        bookPayable: 0,
        ebookAccess: 0,
        ebookAmount: 0,
        grossTotal: 0,
        amountDue: 0,
      },
      payment: {
        status: partial.status ?? "confirmed",
        transactionReference: null,
        reviewNote: null,
      },
      uploadExt: "xlsx",
      receiptExt: null,
    } as RegistrationRecord;
  }

  test("combined state, district, search and payment filters", () => {
    const records = [
      fakeRecord({ reference: "A", address: "School, Pune, Maharashtra 411001", status: "confirmed", schoolName: "Alpha" }),
      fakeRecord({ reference: "B", address: "School, Nagpur, Maharashtra 440001", status: "reported", schoolName: "Beta" }),
      fakeRecord({ reference: "C", address: "School, Jaipur, Rajasthan 302001", status: "confirmed", schoolName: "Gamma" }),
      fakeRecord({ reference: "D", address: "Near temple only", status: "confirmed", schoolName: "Delta" }),
    ];

    const mh = filterRegistrationsForExport(records, { state: "Maharashtra" });
    assert.equal(mh.length, 2);

    const pune = filterRegistrationsForExport(records, { state: "Maharashtra", district: "Pune" });
    assert.equal(pune.length, 1);
    assert.equal(pune[0].reference, "A");

    const confirmedMh = filterRegistrationsForExport(records, { state: "Maharashtra", status: "confirmed" });
    assert.equal(confirmedMh.length, 1);

    const search = filterRegistrationsForExport(records, { q: "Gamma" });
    assert.equal(search.length, 1);

    const unidentified = filterRegistrationsForExport(records, { state: UNIDENTIFIED_LOCATION });
    assert.equal(unidentified.length, 1);
    assert.equal(unidentified[0].reference, "D");
  });

  test("export filter count matches dashboard-style filtered set", () => {
    const records = [
      fakeRecord({ reference: "1", address: "KV, Chennai, Tamil Nadu", status: "confirmed" }),
      fakeRecord({ reference: "2", address: "KV, Madurai, Tamil Nadu", status: "reported" }),
      fakeRecord({ reference: "3", address: "Incomplete address line", status: "confirmed" }),
    ];
    const filtered = filterRegistrationsForExport(records, { state: "Tamil Nadu", status: "confirmed" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].reference, "1");
  });
});

describe("Owner-only registration administration", () => {
  test("only the recovery owner subject is a registration owner", () => {
    assert.equal(isRegistrationOwnerSubject(STAFF_RECOVERY_SUBJECT), true);
    assert.equal(isRegistrationOwnerSubject("school-staff-uuid"), false);
    assert.equal(isRegistrationOwnerSubject(null), false);
  });

  test("owner recovery token opens a session; email/password school staff path is rejected", async () => {
    process.env.TEJAS_ADMIN_TOKEN = "owner-only-token-abcdef";
    assert.equal(tokenMatches("owner-only-token-abcdef"), true);
    const session = createSessionValue(STAFF_RECOVERY_SUBJECT, 0);
    assert.ok(session.includes(STAFF_RECOVERY_SUBJECT));

    const { POST } = await import("@/app/api/register/admin/session/route");
    const rejected = await POST(
      new Request("http://127.0.0.1/api/register/admin/session", {
        method: "POST",
        headers: { origin: "http://127.0.0.1", host: "127.0.0.1", "content-type": "application/json" },
        body: JSON.stringify({ email: "school.staff@example.com", password: "not-an-owner" }),
      }),
    );
    assert.equal(rejected.status, 401);
    const rejectedBody = (await rejected.json()) as { error?: string };
    assert.match(rejectedBody.error ?? "", /owner-only/i);

    const accepted = await POST(
      new Request("http://127.0.0.1/api/register/admin/session", {
        method: "POST",
        headers: { origin: "http://127.0.0.1", host: "127.0.0.1", "content-type": "application/json" },
        body: JSON.stringify({ token: "owner-only-token-abcdef" }),
      }),
    );
    assert.equal(accepted.status, 200);
    delete process.env.TEJAS_ADMIN_TOKEN;
  });

  test("admin payment config API requires owner authorization", async () => {
    const { GET, PUT } = await import("@/app/api/register/admin/payment/route");
    const denied = await GET();
    assert.equal(denied.status, 401);
    const deniedPut = await PUT(
      new Request("http://127.0.0.1/api/register/admin/payment", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activated: true }),
      }),
    );
    assert.equal(deniedPut.status, 401);
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("app/api/register/admin/payment/route.ts", "utf8"),
    );
    assert.match(source, /registrationOwnerAuthorised/);
    assert.doesNotMatch(source, /staffAuthorised/);
  });
});
