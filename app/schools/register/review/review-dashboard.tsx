"use client";

import { useState } from "react";

type Overview = {
  schools: number;
  students: number;
  studentStreams: number;
  amountDue: number;
  classCounts: Record<string, number>;
  streamCounts: Record<string, number>;
  printedBooks: number;
  ebookAccess: number;
  payments: Record<string, number>;
};

type Row = {
  reference: string;
  schoolName: string;
  studentCount: number;
  studentStreamRegistrations: number;
  amountDue: number;
  paymentLabel: string;
  paymentStatus: string;
  maskedPan: string;
  panDuplicate: boolean;
  printedBooks: number;
  ebookAccess: number;
};

type Detail = {
  reference: string;
  school: {
    schoolName: string;
    schoolAddress: string;
    state: string;
    district: string;
    city: string;
    pin: string;
    pan: string;
    panDuplicate: boolean;
    principalName: string;
    principalMobile: string;
    principalEmail: string;
    coordinatorName: string;
    coordinatorMobile: string;
    coordinatorEmail: string;
    printedBooks: string;
    bookQuantity: number;
    ebookAccess: string;
  };
  students: { fullName: string; classLabel: string; section: string; rollNumber: string; streams: string[] }[];
  fee: { amountDue: number; totalStudentFees: number; printedBookAmount: number; ebookAmount: number };
  payment: {
    status: string;
    transactionReference: string | null;
    mode?: string | null;
    paidOn?: string | null;
    payerName?: string | null;
    reviewNote: string | null;
    history?: { at: string; status: string; note: string | null }[];
  };
  receiptExt: string | null;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ReviewDashboard() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/register/admin/registrations");
    if (response.status === 401) {
      setReady(false);
      return;
    }
    const body = (await response.json()) as { registrations: Row[]; overview: Overview };
    setRows(body.registrations);
    setOverview(body.overview);
    setReady(true);
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/register/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "Staff review could not be opened.");
      return;
    }
    setToken("");
    await load();
  }

  async function openRow(reference: string) {
    const response = await fetch(`/api/register/admin/registrations/${reference}`);
    if (!response.ok) return;
    const body = (await response.json()) as { registration: Detail };
    setDetail(body.registration);
    setNote("");
  }

  async function setStatus(status: string) {
    if (!detail) return;
    setMessage("");
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
    await openRow(detail.reference);
    await load();
  }

  if (!ready) {
    return (
      <form onSubmit={signIn} className="mx-auto max-w-md space-y-3">
        <p className="text-sm text-tejas-muted">Staff review has no default password. It opens only when TEJAS_ADMIN_TOKEN is configured on the server.</p>
        <label className="block text-sm">
          <span className="font-medium">Staff token</span>
          <input type="password" value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" autoComplete="current-password" />
        </label>
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <button type="submit" className="rounded-xl bg-tejas-blue px-4 py-2 text-sm font-semibold text-white">Open review</button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-tejas-muted">PAN numbers are masked in this list. A saved registration is kept in the TEJAS database. Uploading a file does not verify the payment.</p>
      {overview ? (
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {[
            ["Schools", overview.schools],
            ["Students", overview.students],
            ["Student-streams", overview.studentStreams],
            ["Amount expected", inr.format(overview.amountDue)],
            ["Verification pending", overview.payments.reported ?? 0],
            ["Verified", overview.payments.confirmed ?? 0],
            ["Not submitted", (overview.payments.pending_instructions ?? 0) + (overview.payments.awaiting_payment ?? 0)],
            ["Rejected", overview.payments.rejected ?? 0],
            ["Printed books", overview.printedBooks],
            ["E-book orders", overview.ebookAccess],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-stone-200 bg-white p-3">
              <dt className="text-tejas-muted">{label}</dt>
              <dd className="mt-1 text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="flex flex-wrap gap-3 text-sm">
        {["schools", "students", "payments", "books", "ebooks"].map((report) => (
          <a key={report} className="font-semibold text-tejas-blue underline" href={`/api/register/admin/export?report=${report}`}>{report} CSV</a>
        ))}
        <a className="font-semibold text-tejas-blue underline" href="/api/register/admin/export?report=schools&revealPan=yes">schools CSV with full PAN</a>
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <p>Classes: {overview ? Object.entries(overview.classCounts).map(([label, count]) => `${label} ${count}`).join(", ") || "None" : "None"}</p>
        <p>Streams: {overview ? Object.entries(overview.streamCounts).map(([label, count]) => `${label} ${count}`).join(", ") || "None" : "None"}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="py-2 pr-3">School</th>
              <th className="py-2 pr-3">PAN</th>
              <th className="py-2 pr-3">Students</th>
              <th className="py-2 pr-3">Due</th>
              <th className="py-2 pr-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.reference} className="border-b border-stone-100">
                <td className="py-2 pr-3">
                  <button type="button" className="text-left font-semibold text-tejas-blue underline" onClick={() => openRow(row.reference)}>{row.schoolName}</button>
                  <div className="text-tejas-muted">{row.reference}</div>
                </td>
                <td className="py-2 pr-3">{row.maskedPan}{row.panDuplicate ? " · review" : ""}</td>
                <td className="py-2 pr-3">{row.studentCount} / {row.studentStreamRegistrations}</td>
                <td className="py-2 pr-3">{inr.format(row.amountDue)}</td>
                <td className="py-2 pr-3">{row.paymentLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
          <h2 className="text-lg font-bold">{detail.school.schoolName}</h2>
          <p>{detail.school.schoolAddress}, {detail.school.city}, {detail.school.district}, {detail.school.state} {detail.school.pin}</p>
          <p>PAN for this staff view: {detail.school.pan}{detail.school.panDuplicate ? " (duplicate, needs review)" : ""}</p>
          <p>Principal: {detail.school.principalName}, {detail.school.principalMobile}, {detail.school.principalEmail}</p>
          <p>Coordinator: {detail.school.coordinatorName}, {detail.school.coordinatorMobile}, {detail.school.coordinatorEmail}</p>
          <p>Registration {inr.format(detail.fee.totalStudentFees)}. Books {inr.format(detail.fee.printedBookAmount ?? 0)}. E-books {inr.format(detail.fee.ebookAmount ?? 0)}. Due {inr.format(detail.fee.amountDue)}.</p>
          <p>E-book choice: {detail.school.ebookAccess}. Access is not activated from this screen.</p>
          <p>Payment: {detail.payment.status}. {detail.payment.mode ?? ""} {detail.payment.paidOn ?? ""} {detail.payment.payerName ?? ""} {detail.payment.transactionReference ?? ""}</p>
          {detail.receiptExt ? <a className="font-semibold text-tejas-blue underline" href={`/api/register/admin/registrations/${detail.reference}/file?kind=receipt`}>Open payment proof</a> : <p>No payment proof is stored.</p>}
          <ul>
            {detail.students.map((student) => (
              <li key={`${student.fullName}-${student.rollNumber}`}>{student.fullName}, class {student.classLabel} {student.section}, roll {student.rollNumber}, {student.streams.join(", ")}</li>
            ))}
          </ul>
          <ul>
            {(detail.payment.history ?? []).map((event) => (
              <li key={`${event.at}-${event.status}`}>{event.at} · {event.status}{event.note ? ` · ${event.note}` : ""}</li>
            ))}
          </ul>
          <label className="block">
            <span className="font-medium">Staff note</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" rows={3} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-tejas-blue px-3 py-2 font-semibold text-white" onClick={() => setStatus("confirmed")}>Mark verified</button>
            <button type="button" className="rounded-lg border border-stone-300 px-3 py-2 font-semibold" onClick={() => setStatus("rejected")}>Reject</button>
            <button type="button" className="rounded-lg border border-stone-300 px-3 py-2 font-semibold" onClick={() => setStatus("refund_pending")}>Refund or adjustment pending</button>
          </div>
          {message ? <p className="text-red-700">{message}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
