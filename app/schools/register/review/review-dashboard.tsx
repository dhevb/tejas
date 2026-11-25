"use client";

import { useMemo, useState, type ReactNode } from "react";
import { presentFee } from "@/lib/registration/fee";
import { panHolderLabel } from "@/lib/registration/school";
import {
  CLASS_NOT_IDENTIFIED,
  paymentStatusLabel,
  summarizeFilterableRows,
  type ClassBreakdownRow,
  type ClassMetric,
} from "@/lib/registration/staff-metrics";

type Overview = {
  schools: number;
  uniqueSchools?: number;
  schoolRegistrations?: number;
  individualRegistrations?: number;
  students: number;
  uniqueStudents?: number;
  studentStreams: number;
  englishEntries?: number;
  mathematicsEntries?: number;
  technologyEntries?: number;
  amountDue: number;
  grossCollected: number;
  schoolShare: number;
  amountReceived: number;
  pendingPayable: number;
  awaitingPaymentCount?: number;
  awaitingPaymentAmount?: number;
  reportedCount?: number;
  reportedAmount?: number;
  confirmedCount?: number;
  rejectedCount?: number;
  rejectedPayable?: number;
  refundPendingCount?: number;
  refundPendingAmount?: number;
  rejectedOrRefund?: number;
  classBreakdown?: ClassBreakdownRow[];
  payments: Record<string, number>;
};

type Row = {
  reference: string;
  schoolName: string;
  channel?: string;
  studentCount: number;
  uniqueStudentCount?: number;
  studentStreamRegistrations: number;
  englishCount?: number;
  mathematicsCount?: number;
  technologyCount?: number;
  amountDue: number;
  grossTotal: number;
  schoolShare: number;
  paymentLabel: string;
  paymentStatus: string;
  maskedPan: string;
  panHolderLabel: string;
  panDuplicate: boolean;
  createdAt: string;
  principalName?: string;
  coordinatorName?: string;
  transactionReference?: string | null;
  driveSyncLabel?: string;
  schoolAddress?: string;
  derivedState?: string | null;
  derivedDistrict?: string | null;
  stateKey?: string;
  districtKey?: string;
  locationLabel?: string;
  classMetrics?: ClassMetric[];
  lastUpdatedAt?: string;
};

type Detail = {
  reference: string;
  createdAt?: string;
  channel?: string;
  receiptExt: string | null;
  paymentLabel?: string;
  school: {
    schoolName: string;
    schoolAddress: string;
    schoolEmail?: string;
    schoolMobile?: string;
    schoolCategory?: string;
    previousParticipation?: boolean;
    previousReference?: string | null;
    pan: string;
    maskedPan?: string;
    panHolder?: string | null;
    panDuplicate: boolean;
    principalName: string;
    principalMobile: string;
    principalEmail: string;
    coordinatorName: string;
    coordinatorMobile: string;
    coordinatorEmail: string;
    coordinatorDesignation?: string;
    derivedState?: string | null;
    derivedDistrict?: string | null;
    locationLabel?: string;
    locationNotes?: string[];
  };
  students: {
    fullName: string;
    parentName?: string;
    parentMobile?: string;
    parentEmail?: string;
    dateOfBirth?: string;
    classLabel: string;
    section: string;
    rollNumber: string;
    streams: string[];
  }[];
  fee: {
    amountDue: number;
    totalStudentFees: number;
    payableToTejas: number;
    schoolShare: number;
    schoolShareApproved?: boolean;
    registrationSchoolShare?: number;
    registrationPayable?: number;
    studentStreamRegistrations?: number;
    printedBookAmount: number;
    bookSchoolShare?: number;
    bookPayable?: number;
    ebookAmount: number;
    grossTotal?: number;
  };
  payment: {
    status: string;
    transactionReference: string | null;
    mode?: string | null;
    paidOn?: string | null;
    payerName?: string | null;
    reviewNote: string | null;
    enteredUtr?: string | null;
    extractedUtr?: string | null;
    approvalMethod?: string | null;
    verificationLabel?: string | null;
    beneficiaryMatch?: string | null;
    amountMatch?: boolean | null;
    history?: { at: string; status: string; note: string | null; actor?: string }[];
  };
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function badgeClass(status: string): string {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "reported") return "bg-amber-50 text-amber-900 border-amber-200";
  if (status === "rejected") return "bg-red-50 text-red-800 border-red-200";
  if (status === "refund_pending") return "bg-orange-50 text-orange-900 border-orange-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function streamTally(students: Detail["students"]) {
  const counts = { english: 0, mathematics: 0, technology: 0 };
  for (const student of students) {
    for (const stream of student.streams) {
      const lower = stream.toLowerCase();
      if (lower.includes("english")) counts.english += 1;
      else if (lower.includes("math")) counts.mathematics += 1;
      else if (lower.includes("future") || lower.includes("tech")) counts.technology += 1;
    }
  }
  return counts;
}

function classTally(students: Detail["students"]) {
  const counts: Record<string, number> = {};
  for (const student of students) {
    counts[student.classLabel] = (counts[student.classLabel] ?? 0) + 1;
  }
  return counts;
}

const PAGE_SIZE = 20;
const UNIDENTIFIED = "State/District Not Identified";
const UNIDENTIFIED_DISTRICT = "District Not Identified";

export function ReviewDashboard() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showParentContacts, setShowParentContacts] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [streamFilter, setStreamFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"createdAt" | "schoolName" | "amountDue">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/register/admin/registrations");
      if (response.status === 401) {
        setReady(false);
        return;
      }
      if (!response.ok) {
        setMessage("Registrations could not be loaded.");
        return;
      }
      const body = (await response.json()) as { registrations: Row[]; overview: Overview };
      setRows(body.registrations);
      setOverview(body.overview);
      setReady(true);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setSuccess("");
    const response = await fetch("/api/register/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "Owner review could not be opened.");
      return;
    }
    setToken("");
    await load();
  }

  async function signOut() {
    setMessage("");
    await fetch("/api/register/admin/session", { method: "DELETE" });
    setReady(false);
    setDetail(null);
    setRows([]);
    setOverview(null);
    setSuccess("Signed out.");
  }

  async function openRow(reference: string) {
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`/api/register/admin/registrations/${reference}`);
      if (!response.ok) {
        setMessage("That registration could not be opened.");
        return;
      }
      const body = (await response.json()) as { registration: Detail };
      setDetail(body.registration);
      setNote("");
      setShowParentContacts(false);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(status: string) {
    if (!detail || saving) return;
    if (status === detail.payment.status) {
      setMessage("That payment status is already recorded.");
      return;
    }
    if ((status === "rejected" || status === "refund_pending") && note.trim().length < 5) {
      setMessage("Enter the reason for this decision.");
      return;
    }
    setMessage("");
    setSuccess("");
    setSaving(true);
    try {
      const response = await fetch(`/api/register/admin/registrations/${detail.reference}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(body.error ?? "The status was not saved.");
        return;
      }
      setSuccess("Payment status saved.");
      await openRow(detail.reference);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) set.add(row.stateKey ?? UNIDENTIFIED);
    return [...set].sort((a, b) => {
      if (a === UNIDENTIFIED) return 1;
      if (b === UNIDENTIFIED) return -1;
      return a.localeCompare(b);
    });
  }, [rows]);

  const districtOptions = useMemo(() => {
    if (stateFilter === "all") return [] as string[];
    const set = new Set<string>();
    for (const row of rows) {
      if ((row.stateKey ?? UNIDENTIFIED) === stateFilter) set.add(row.districtKey ?? UNIDENTIFIED);
    }
    return [...set].sort((a, b) => {
      if (a === UNIDENTIFIED || a === UNIDENTIFIED_DISTRICT) return 1;
      if (b === UNIDENTIFIED || b === UNIDENTIFIED_DISTRICT) return -1;
      return a.localeCompare(b);
    });
  }, [rows, stateFilter]);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      for (const metric of row.classMetrics ?? []) {
        map.set(metric.classKey, metric.classLabel);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return rows
      .filter((row) => {
        const matchesQuery =
          !needle ||
          row.schoolName.toLowerCase().includes(needle) ||
          row.reference.toLowerCase().includes(needle) ||
          (row.principalName ?? "").toLowerCase().includes(needle) ||
          (row.coordinatorName ?? "").toLowerCase().includes(needle) ||
          (row.transactionReference ?? "").toLowerCase().includes(needle) ||
          (row.schoolAddress ?? "").toLowerCase().includes(needle) ||
          (row.locationLabel ?? "").toLowerCase().includes(needle);
        const matchesStatus =
          statusFilter === "all" ||
          row.paymentStatus === statusFilter ||
          (statusFilter === "pending_group" &&
            (row.paymentStatus === "pending_instructions" || row.paymentStatus === "awaiting_payment")) ||
          (statusFilter === "unfinished" &&
            row.paymentStatus !== "confirmed" &&
            row.paymentStatus !== "rejected" &&
            row.paymentStatus !== "refund_pending");
        const matchesStream =
          streamFilter === "all" ||
          (streamFilter === "english" && (row.englishCount ?? 0) > 0) ||
          (streamFilter === "mathematics" && (row.mathematicsCount ?? 0) > 0) ||
          (streamFilter === "technology" && (row.technologyCount ?? 0) > 0);
        const matchesChannel = channelFilter === "all" || (row.channel ?? "school-registration") === channelFilter;
        const matchesState = stateFilter === "all" || (row.stateKey ?? UNIDENTIFIED) === stateFilter;
        const matchesDistrict = districtFilter === "all" || (row.districtKey ?? UNIDENTIFIED) === districtFilter;
        const matchesClass =
          classFilter === "all" || (row.classMetrics ?? []).some((metric) => metric.classKey === classFilter);
        const created = new Date(row.createdAt).getTime();
        const matchesFrom = from == null || (!Number.isNaN(created) && created >= from);
        const matchesTo = to == null || (!Number.isNaN(created) && created <= to);
        return (
          matchesQuery &&
          matchesStatus &&
          matchesStream &&
          matchesChannel &&
          matchesState &&
          matchesDistrict &&
          matchesClass &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "schoolName") return a.schoolName.localeCompare(b.schoolName) * dir;
        if (sortKey === "amountDue") return (a.amountDue - b.amountDue) * dir;
        return (a.createdAt < b.createdAt ? -1 : 1) * dir;
      });
  }, [rows, query, statusFilter, streamFilter, channelFilter, stateFilter, districtFilter, classFilter, dateFrom, dateTo, sortKey, sortDir]);

  const displayOverview = useMemo(
    () =>
      summarizeFilterableRows(
        filtered.map((row) => ({
          schoolName: row.schoolName,
          channel: row.channel,
          paymentStatus: row.paymentStatus,
          amountDue: row.amountDue,
          grossTotal: row.grossTotal,
          schoolShare: row.schoolShare,
          uniqueStudentCount: row.uniqueStudentCount ?? row.studentCount,
          studentCount: row.studentCount,
          studentStreamRegistrations: row.studentStreamRegistrations,
          englishCount: row.englishCount,
          mathematicsCount: row.mathematicsCount,
          technologyCount: row.technologyCount,
          classMetrics: row.classMetrics ?? [],
        })),
      ),
    [filtered],
  );

  const visibleClassBreakdown = useMemo(() => {
    if (classFilter === "all") return displayOverview.classBreakdown;
    return displayOverview.classBreakdown.filter((row) => row.classKey === classFilter);
  }, [displayOverview.classBreakdown, classFilter]);

  const stateGroups = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filtered) {
      const key = row.stateKey ?? UNIDENTIFIED;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === UNIDENTIFIED) return 1;
      if (b[0] === UNIDENTIFIED) return -1;
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }, [filtered]);

  const districtGroups = useMemo(() => {
    if (stateFilter === "all") return [] as Array<[string, number]>;
    const map = new Map<string, number>();
    for (const row of filtered) {
      const key = row.districtKey ?? UNIDENTIFIED;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === UNIDENTIFIED || a[0] === UNIDENTIFIED_DISTRICT) return 1;
      if (b[0] === UNIDENTIFIED || b[0] === UNIDENTIFIED_DISTRICT) return -1;
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }, [filtered, stateFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!ready) {
    return (
      <form onSubmit={signIn} className="mx-auto max-w-md space-y-3">
        <p className="text-sm text-tejas-muted">
          Registration review is owner-only. School staff do not receive accounts or dashboard access. Use the owner access token configured on the server.
        </p>
        <label className="block text-sm">
          <span className="font-medium">Owner access token</span>
          <input type="password" value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 w-full rounded-lg border border-tejas-border bg-white px-3 py-2 text-tejas-ink focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30" autoComplete="off" />
        </label>
        {message ? <p className="text-sm text-red-700" role="alert">{message}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <button type="submit" className="rounded-xl bg-tejas-blue px-4 py-2 text-sm font-semibold text-white">Open owner review</button>
      </form>
    );
  }

  const detailStreams = detail ? streamTally(detail.students) : null;
  const detailClasses = detail ? classTally(detail.students) : null;
  const shownFee = detail ? presentFee(detail.fee) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tejas-muted">
          Amounts use server-saved fee fields. Screenshot OCR match is not bank verification. Eligible received revenue is confirmed payments only.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => load()} className="rounded-lg border border-tejas-border bg-white px-3 py-2 text-sm font-semibold text-tejas-blue disabled:opacity-60" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" onClick={() => signOut()} className="rounded-lg border border-tejas-border bg-white px-3 py-2 text-sm font-semibold">
            Owner logout
          </button>
        </div>
      </div>

      {message ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{message}</p> : null}
      {success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total registrations"
          tone="blue"
          onClick={() => { setStatusFilter("all"); setPage(1); }}
          lines={[
            `Records ${displayOverview.schools}`,
            `Unique schools ${displayOverview.uniqueSchools}`,
            `Unique students ${displayOverview.uniqueStudents}`,
            `Student-streams ${displayOverview.studentStreams}`,
          ]}
        />
        <SummaryCard
          title="Verified payments"
          tone="emerald"
          onClick={() => { setStatusFilter("confirmed"); setPage(1); }}
          lines={[
            `Count ${displayOverview.confirmedCount}`,
            `Received ${inr.format(displayOverview.amountReceived)}`,
            "Confirmed TEJAS share only",
            "Excludes pending / rejected",
          ]}
        />
        <SummaryCard
          title="Rejected / adjustment"
          tone="red"
          onClick={() => { setStatusFilter("rejected"); setPage(1); }}
          lines={[
            `Rejected ${displayOverview.rejectedCount} · ${inr.format(displayOverview.rejectedPayable)}`,
            `Refund/adj. ${displayOverview.refundPendingCount} · ${inr.format(displayOverview.refundPendingAmount)}`,
            "Not counted as received",
            "Historical amounts retained",
          ]}
        />
        <SummaryCard
          title="Pending payments"
          tone="amber"
          onClick={() => { setStatusFilter("unfinished"); setPage(1); }}
          lines={[
            `Awaiting ${displayOverview.awaitingPaymentCount} · ${inr.format(displayOverview.awaitingPaymentAmount)}`,
            `Proof submitted ${displayOverview.reportedCount} · ${inr.format(displayOverview.reportedAmount)}`,
            `Pending total ${inr.format(displayOverview.pendingPayable)}`,
            "Not added to received",
          ]}
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {[
          ["Gross calculated (all listed)", inr.format(displayOverview.grossCollected)],
          ["School share (all listed)", inr.format(displayOverview.schoolShare)],
          ["TEJAS payable (all listed)", inr.format(displayOverview.amountDue)],
          ["Eligible received (= verified)", inr.format(displayOverview.amountReceived)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-tejas-border bg-white p-4 shadow-sm">
            <dt className="text-tejas-muted">{label}</dt>
            <dd className="mt-1 text-lg font-semibold text-tejas-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-tejas-border bg-white p-4 shadow-sm" aria-label="Class-wise registration">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-tejas-ink">Class-wise registration</h2>
            <p className="text-sm text-tejas-muted">Unique students and student-streams are separate. Amounts allocate each registration’s saved TEJAS payable by stream weight in the class.</p>
          </div>
          <label className="text-sm">
            <span className="font-medium">Class filter</span>
            <select
              value={classFilter}
              onChange={(event) => { setClassFilter(event.target.value); setPage(1); }}
              className="mt-1 block rounded-lg border border-tejas-border bg-white px-3 py-2"
            >
              <option value="all">All classes</option>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={`class-${n}`}>Class {n}</option>
              ))}
              {classOptions
                .filter(([key]) => !/^class-([3-9]|10)$/.test(key))
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
          </label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Registrations</th>
                <th className="px-3 py-2">Unique students</th>
                <th className="px-3 py-2">Student-streams</th>
                <th className="px-3 py-2">Confirmed</th>
                <th className="px-3 py-2">Pending</th>
                <th className="px-3 py-2">Rejected</th>
              </tr>
            </thead>
            <tbody>
              {visibleClassBreakdown.length === 0 ? (
                <tr><td className="px-3 py-4 text-tejas-muted" colSpan={7}>No class rows under the current filters.</td></tr>
              ) : (
                visibleClassBreakdown.map((row) => (
                  <tr key={row.classKey} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-medium">{row.classLabel || CLASS_NOT_IDENTIFIED}</td>
                    <td className="px-3 py-2">{row.registrationRecords}</td>
                    <td className="px-3 py-2">{row.uniqueStudents}</td>
                    <td className="px-3 py-2">{row.studentStreams}</td>
                    <td className="px-3 py-2">{row.confirmedCount}<br /><span className="text-tejas-muted">{inr.format(row.confirmedAmount)}</span></td>
                    <td className="px-3 py-2">{row.pendingCount}<br /><span className="text-tejas-muted">{inr.format(row.pendingAmount)}</span></td>
                    <td className="px-3 py-2">{row.rejectedCount}<br /><span className="text-tejas-muted">{inr.format(row.rejectedAmount)}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {stateGroups.length > 0 ? (
        <section className="rounded-2xl border border-tejas-border bg-white p-4 text-sm" aria-label="State grouping">
          <h2 className="font-semibold text-tejas-ink">State-wise (filtered)</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {stateGroups.map(([state, count]) => (
              <li key={state}>
                <button
                  type="button"
                  className={`rounded-lg border px-2 py-1 ${stateFilter === state ? "border-tejas-blue bg-tejas-blue/5 font-semibold text-tejas-blue" : "border-tejas-border"}`}
                  onClick={() => { setStateFilter(state); setDistrictFilter("all"); setPage(1); }}
                >
                  {state} ({count})
                </button>
              </li>
            ))}
            {stateFilter !== "all" ? (
              <li>
                <button type="button" className="rounded-lg border border-tejas-border px-2 py-1 text-tejas-muted" onClick={() => { setStateFilter("all"); setDistrictFilter("all"); setPage(1); }}>
                  Clear state
                </button>
              </li>
            ) : null}
          </ul>
          {districtGroups.length > 0 ? (
            <>
              <h3 className="mt-4 font-semibold text-tejas-ink">Districts in {stateFilter}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {districtGroups.map(([district, count]) => (
                  <li key={district}>
                    <button
                      type="button"
                      className={`rounded-lg border px-2 py-1 ${districtFilter === district ? "border-tejas-blue bg-tejas-blue/5 font-semibold text-tejas-blue" : "border-tejas-border"}`}
                      onClick={() => { setDistrictFilter(district); setPage(1); }}
                    >
                      {district} ({count})
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-3 rounded-2xl border border-tejas-border bg-white p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="font-medium">Search school / reference</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-tejas-border bg-white px-3 py-2" placeholder="School, reference, UTR…" />
        </label>
        <label>
          <span className="font-medium">State</span>
          <select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setDistrictFilter("all"); setPage(1); }} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2">
            <option value="all">All states</option>
            {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </label>
        <label>
          <span className="font-medium">District</span>
          <select value={districtFilter} onChange={(event) => { setDistrictFilter(event.target.value); setPage(1); }} disabled={stateFilter === "all"} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2 disabled:opacity-60">
            <option value="all">{stateFilter === "all" ? "Select a state first" : "All districts in state"}</option>
            {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </label>
        <label>
          <span className="font-medium">Payment status</span>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2">
            <option value="all">All</option>
            <option value="confirmed">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="pending_group">Payment Pending</option>
            <option value="reported">Proof Submitted</option>
            <option value="unfinished">All unfinished</option>
            <option value="refund_pending">Refund or adjustment pending</option>
          </select>
        </label>
        <label>
          <span className="font-medium">Stream</span>
          <select value={streamFilter} onChange={(event) => { setStreamFilter(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2">
            <option value="all">All streams</option>
            <option value="english">English</option>
            <option value="mathematics">Mathematics</option>
            <option value="technology">Future Tech</option>
          </select>
        </label>
        <label>
          <span className="font-medium">Channel</span>
          <select value={channelFilter} onChange={(event) => { setChannelFilter(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2">
            <option value="all">All</option>
            <option value="school-registration">School</option>
            <option value="individual-registration">Individual</option>
          </select>
        </label>
        <label>
          <span className="font-medium">From date</span>
          <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2" />
        </label>
        <label>
          <span className="font-medium">To date</span>
          <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2" />
        </label>
        <label>
          <span className="font-medium">Sort</span>
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(event) => {
              const [key, dir] = event.target.value.split(":") as ["createdAt" | "schoolName" | "amountDue", "asc" | "desc"];
              setSortKey(key);
              setSortDir(dir);
            }}
            className="mt-1 block w-full rounded-lg border border-tejas-border bg-white px-3 py-2"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="schoolName:asc">School A–Z</option>
            <option value="schoolName:desc">School Z–A</option>
            <option value="amountDue:desc">Payable high–low</option>
            <option value="amountDue:asc">Payable low–high</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-tejas-border bg-white px-4 py-10 text-center text-sm text-tejas-muted">No registrations match these filters.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-tejas-border bg-white md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200">
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3">School / reference</th>
                  <th className="px-3 py-3">State / District</th>
                  <th className="px-3 py-3">Students / streams</th>
                  <th className="px-3 py-3">Classes</th>
                  <th className="px-3 py-3">Fees (TEJAS)</th>
                  <th className="px-3 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.reference} className="border-b border-stone-100 align-top">
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(row.lastUpdatedAt ?? row.createdAt)}</td>
                    <td className="px-3 py-3">
                      <button type="button" className="text-left font-semibold text-tejas-blue underline" onClick={() => openRow(row.reference)}>{row.schoolName}</button>
                      <div className="text-tejas-muted">{row.reference}</div>
                      <div className="text-xs text-tejas-muted">{row.channel === "individual-registration" ? "Individual" : "School"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{row.derivedState ?? UNIDENTIFIED}</div>
                      <div className="text-tejas-muted">{row.derivedDistrict ?? (row.derivedState ? UNIDENTIFIED_DISTRICT : "—")}</div>
                    </td>
                    <td className="px-3 py-3">
                      {row.uniqueStudentCount ?? row.studentCount} unique<br />
                      <span className="text-tejas-muted">{row.studentStreamRegistrations} streams · E {row.englishCount ?? 0} · M {row.mathematicsCount ?? 0} · FT {row.technologyCount ?? 0}</span>
                    </td>
                    <td className="px-3 py-3 text-tejas-muted">
                      {(row.classMetrics ?? []).map((metric) => `${metric.classLabel}: ${metric.uniqueStudents}`).join(" · ") || "—"}
                    </td>
                    <td className="px-3 py-3">
                      Gross {inr.format(row.grossTotal)}<br />
                      Share {inr.format(row.schoolShare)}<br />
                      TEJAS {inr.format(row.amountDue)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(row.paymentStatus)}`}>
                        {row.paymentLabel || paymentStatusLabel(row.paymentStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {pageRows.map((row) => (
              <li key={row.reference} className="rounded-2xl border border-tejas-border bg-white p-4 text-sm shadow-sm">
                <button type="button" className="text-left font-semibold text-tejas-blue underline" onClick={() => openRow(row.reference)}>{row.schoolName}</button>
                <p className="mt-1 text-tejas-muted">{row.reference} · {formatDate(row.lastUpdatedAt ?? row.createdAt)}</p>
                <p className="mt-1 text-tejas-muted">{row.locationLabel ?? UNIDENTIFIED}</p>
                <p className="mt-2">Students {row.uniqueStudentCount ?? row.studentCount} · Streams {row.studentStreamRegistrations}</p>
                <p>TEJAS {inr.format(row.amountDue)}</p>
                <p className="mt-2"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(row.paymentStatus)}`}>{row.paymentLabel}</span></p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-tejas-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border border-tejas-border px-3 py-1.5 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
              <button type="button" className="rounded-lg border border-tejas-border px-3 py-1.5 disabled:opacity-50" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button>
            </div>
          </div>
        </>
      )}

      {detail ? (
        <section className="space-y-6 rounded-2xl border border-tejas-border bg-white p-4 text-sm shadow-sm md:p-6" aria-label="Registration detail">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-tejas-blue">{detail.school.schoolName}</h2>
              <p className="text-tejas-muted">{detail.reference} · {formatDate(detail.createdAt)} · {detail.channel === "individual-registration" ? "Individual" : "School"}</p>
            </div>
            <button type="button" className="rounded-lg border border-tejas-border px-3 py-2 font-semibold" onClick={() => setDetail(null)}>Close detail</button>
          </div>

          <DetailBlock title="Registration summary">
            <p>Payment: <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(detail.payment.status)}`}>{detail.paymentLabel ?? paymentStatusLabel(detail.payment.status)}</span></p>
            <p>Student rows {detail.students.length}. Stream entries E {detailStreams?.english ?? 0} · M {detailStreams?.mathematics ?? 0} · FT {detailStreams?.technology ?? 0}.</p>
            <p>Saved fee: gross {inr.format(shownFee?.totalStudentFees ?? 0)}, school share {inr.format(shownFee?.registrationSchoolShare ?? 0)}, TEJAS payable {inr.format(shownFee?.registrationPayable ?? 0)}.</p>
            <p className="text-tejas-muted">Learn-portal access is separate from this payment status. Rejection here does not delete students or disable /learn accounts.</p>
          </DetailBlock>

          <DetailBlock title="School details">
            <p>{detail.school.schoolAddress}</p>
            <p className="mt-2">Derived location: {detail.school.locationLabel ?? UNIDENTIFIED}</p>
            {detail.school.locationNotes && detail.school.locationNotes.length > 0 ? (
              <p className="mt-1 text-tejas-muted">{detail.school.locationNotes.join(" ")}</p>
            ) : null}
          </DetailBlock>

          <DetailBlock title="PAN / principal / coordinator">
            <p>{panHolderLabel(detail.school.panHolder)}: <span className="font-mono">{detail.school.maskedPan || "—"}</span>{detail.school.panDuplicate ? " (duplicate)" : ""}</p>
            <p>Principal: {detail.school.principalName}</p>
            <p>Coordinator: {detail.school.coordinatorName}{detail.school.coordinatorDesignation ? ` · ${detail.school.coordinatorDesignation}` : ""}</p>
          </DetailBlock>

          <DetailBlock title="Students">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="text-tejas-muted">Parent contacts are hidden by default.</p>
              <button type="button" className="rounded-lg border border-tejas-border px-2 py-1 text-xs font-semibold" onClick={() => setShowParentContacts((value) => !value)}>
                {showParentContacts ? "Hide parent contacts" : "Show parent contacts"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Class</th>
                    <th className="py-2 pr-2">Section</th>
                    <th className="py-2 pr-2">Roll</th>
                    <th className="py-2 pr-2">Streams</th>
                    {showParentContacts ? <th className="py-2 pr-2">Parent</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {detail.students.map((student) => (
                    <tr key={`${student.fullName}-${student.rollNumber}-${student.streams.join("-")}`} className="border-b border-stone-100 align-top">
                      <td className="py-2 pr-2">{student.fullName}</td>
                      <td className="py-2 pr-2">{student.classLabel}</td>
                      <td className="py-2 pr-2">{student.section}</td>
                      <td className="py-2 pr-2">{student.rollNumber}</td>
                      <td className="py-2 pr-2">{student.streams.join(", ")}</td>
                      {showParentContacts ? (
                        <td className="py-2 pr-2">{student.parentName ?? "—"}<br /><span className="text-tejas-muted">{student.parentMobile ?? ""} {student.parentEmail ?? ""}</span></td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-tejas-muted">Class counts: {detailClasses ? Object.entries(detailClasses).map(([label, count]) => `${label}: ${count}`).join(" · ") || "None" : "None"}</p>
          </DetailBlock>

          <DetailBlock title="Payment details">
            <p>Mode {detail.payment.mode ?? "—"} · Paid on {detail.payment.paidOn ?? "—"} · Payer {detail.payment.payerName ?? "—"}</p>
            <p>Entered UTR / reference: {detail.payment.enteredUtr ?? detail.payment.transactionReference ?? "—"}</p>
            <p>Extracted UTR: {detail.payment.extractedUtr ?? "—"}</p>
            <p>Approval method: {detail.payment.approvalMethod ?? "—"} · Verification: {detail.payment.verificationLabel ?? "—"}</p>
            <p className="text-amber-900">Screenshot OCR match is not bank-statement confirmation.</p>
            <p>Review note: {detail.payment.reviewNote ?? "—"}</p>
            {detail.receiptExt ? (
              <a className="font-semibold text-tejas-blue underline" href={`/api/register/admin/registrations/${detail.reference}/file?kind=receipt`}>Open payment proof</a>
            ) : (
              <p>No payment proof is stored.</p>
            )}
            <ul className="mt-3 space-y-1">
              {(detail.payment.history ?? []).map((event) => (
                <li key={`${event.at}-${event.status}-${event.note ?? ""}`}>{event.at} · {paymentStatusLabel(event.status)}{event.actor ? ` · ${event.actor}` : ""}{event.note ? ` · ${event.note}` : ""}</li>
              ))}
            </ul>
            <label className="mt-4 block">
              <span className="font-medium">Owner note</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-tejas-border bg-white px-3 py-2 text-tejas-ink focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30" rows={3} />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-tejas-blue px-3 py-2 font-semibold text-white disabled:opacity-60" disabled={saving || detail.payment.status === "confirmed"} onClick={() => setStatus("confirmed")}>Mark verified</button>
              <button type="button" className="rounded-lg border border-stone-300 px-3 py-2 font-semibold disabled:opacity-60" disabled={saving || detail.payment.status === "rejected"} onClick={() => setStatus("rejected")}>Reject</button>
              <button type="button" className="rounded-lg border border-stone-300 px-3 py-2 font-semibold disabled:opacity-60" disabled={saving || detail.payment.status === "refund_pending"} onClick={() => setStatus("refund_pending")}>Refund or adjustment pending</button>
            </div>
          </DetailBlock>

          <DetailBlock title="Files">
            <div className="flex flex-wrap gap-3">
              <a className="font-semibold text-tejas-blue underline" href={`/api/register/admin/registrations/${detail.reference}/file?kind=upload`}>Original uploaded spreadsheet</a>
              <a className="font-semibold text-tejas-blue underline" href={`/api/register/admin/registrations/${detail.reference}/file`}>Students workbook</a>
              <a className="font-semibold text-tejas-blue underline" href={`/api/register/admin/registrations/${detail.reference}/file?kind=consolidated`}>Consolidated workbook (masked PAN)</a>
            </div>
          </DetailBlock>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  lines,
  tone,
  onClick,
}: {
  title: string;
  lines: string[];
  tone: "blue" | "emerald" | "red" | "amber";
  onClick: () => void;
}) {
  const toneClass =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" :
    tone === "red" ? "border-red-200 bg-red-50/60" :
    tone === "amber" ? "border-amber-200 bg-amber-50/60" :
    "border-tejas-blue/30 bg-tejas-blue/5";
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:shadow ${toneClass}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-tejas-muted">{title}</h2>
      <ul className="mt-2 space-y-1 text-sm text-tejas-ink">
        {lines.map((line) => <li key={line} className="font-medium">{line}</li>)}
      </ul>
    </button>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
      <h3 className="text-base font-bold text-tejas-ink">{title}</h3>
      <div className="mt-2 space-y-1 text-tejas-ink">{children}</div>
    </section>
  );
}
