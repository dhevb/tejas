"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Row = {
  stream: string;
  classes: string;
  book: string;
  mockTest: string;
  sourceFilename: string;
  questionCount: number | null;
  answerKey: string;
  explanations: string;
  uploadStatus: string;
  reviewStatus: string;
  publicationStatus: string;
};

type Student = {
  id: string;
  fullName: string;
  email: string;
  streamName: string;
  classLevel: number;
  payment: { bookId: string; status: string; amountInr: number }[];
};

type Flag = { severity: string; code: string; detail: string };
type Audit = { id: string; at: string; actor: string; action: string; studentId: string | null; reason: string };

type Overview = { rows: Row[]; flags: Flag[]; students: Student[]; audit: Audit[] };

const fieldClass = "mt-1 w-full rounded-xl border border-tejas-border bg-white px-3 py-2 text-sm";

export function StaffConsole() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/learn/staff/overview", { cache: "no-store" });
    if (response.status === 401) {
      setOverview(null);
      return;
    }
    const body = (await response.json()) as Overview & { ok?: boolean; error?: string };
    if (!response.ok || !body.ok) {
      setError(body.error || "The inventory could not be loaded.");
      return;
    }
    setOverview(body);
  }

  useEffect(() => {
    void load();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/register/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, token }),
    });
    const body = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !body.ok) {
      setError(body.error || "Staff sign-in failed.");
      return;
    }
    await load();
  }

  async function post(url: string, payload: unknown) {
    setError("");
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !body.ok) {
      setError(body.error || "The change was not saved.");
      return;
    }
    await load();
  }

  if (!overview) {
    return (
      <form onSubmit={signIn} className="mx-auto max-w-md space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
        <p className="text-sm text-tejas-muted">Use a staff email and password when an individual account exists. Until then, the recovery token configured on the server still opens this page.</p>
        <label className="block text-sm font-semibold">Email
          <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
        </label>
        <label className="block text-sm font-semibold">Password
          <input className={fieldClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        <label className="block text-sm font-semibold">Recovery token
          <input className={fieldClass} type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" />
        </label>
        {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
        <Button type="submit">Open the inventory</Button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      <form className="max-w-xl space-y-3 rounded-2xl border border-tejas-border bg-white p-4" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void post("/api/learn/staff/accounts", { email: form.get("email"), password: form.get("password") });
        event.currentTarget.reset();
      }}>
        <h2 className="text-lg font-bold text-tejas-blue">Create a staff account</h2>
        <p className="text-sm text-tejas-muted">Choose the email and password for a reviewer. No account is created until you submit one here.</p>
        <label className="block text-sm font-semibold">Email
          <input className={fieldClass} name="email" type="email" required autoComplete="off" />
        </label>
        <label className="block text-sm font-semibold">Password
          <input className={fieldClass} name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <Button type="submit">Create account</Button>
      </form>
      <section>
        <h2 className="text-2xl font-bold text-tejas-blue">Content inventory</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-tejas-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-tejas-ivory text-tejas-ink">
              <tr>
                {["Stream", "Class", "Book", "Mock test", "Source file", "Questions", "Answer key", "Explanations", "Upload", "Review", "Publication"].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.rows.map((row) => (
                <tr key={`${row.book}-${row.mockTest}`} className="border-t border-tejas-border align-top">
                  <td className="px-3 py-2">{row.stream}</td>
                  <td className="px-3 py-2">{row.classes}</td>
                  <td className="px-3 py-2">{row.book}</td>
                  <td className="px-3 py-2">{row.mockTest}</td>
                  <td className="px-3 py-2">{row.sourceFilename}</td>
                  <td className="px-3 py-2">{row.questionCount ?? "—"}</td>
                  <td className="px-3 py-2">{row.answerKey}</td>
                  <td className="px-3 py-2">{row.explanations}</td>
                  <td className="px-3 py-2">{row.uploadStatus}</td>
                  <td className="px-3 py-2">{row.reviewStatus}</td>
                  <td className="px-3 py-2">{row.publicationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-tejas-blue">Review flags</h2>
        <ul className="mt-3 space-y-3">
          {overview.flags.map((flag) => (
            <li key={flag.code} className="rounded-2xl border border-tejas-border bg-white p-4 text-sm">
              <p className="font-semibold">{flag.severity}: {flag.code}</p>
              <p className="mt-1 text-tejas-muted">{flag.detail}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-3xl border border-tejas-border bg-white p-6">
        <h2 className="text-2xl font-bold text-tejas-blue">Publication</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void post("/api/learn/staff/publication", {
            kind: form.get("kind"),
            id: form.get("id"),
            status: form.get("status"),
            reason: form.get("reason"),
          });
        }}>
          <label className="text-sm font-semibold">Kind
            <select className={fieldClass} name="kind"><option value="book">Book</option><option value="test">Mock test</option></select>
          </label>
          <label className="text-sm font-semibold">Id
            <input className={fieldClass} name="id" required placeholder="ft-book-1 or ft-b1-mt01" />
          </label>
          <label className="text-sm font-semibold">Status
            <select className={fieldClass} name="status"><option value="awaiting_approval">Awaiting approval</option><option value="published">Published</option></select>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">Reason
            <input className={fieldClass} name="reason" required minLength={10} />
          </label>
          <Button type="submit">Save publication status</Button>
        </form>
        <p className="mt-3 text-sm text-tejas-muted">Saving a publication status writes it to the production database and records the staff identity and reason in the audit trail. The catalog seed stays awaiting approval; the publication table is the status students see. Save only when that status should change. Do not save again for an item that is already published. A published item opens only for a student with the matching stream, class and a verified payment. An item left awaiting approval stays closed.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-tejas-blue">Students</h2>
        <ul className="mt-3 space-y-4">
          {overview.students.map((student) => (
            <li key={student.id} className="rounded-2xl border border-tejas-border bg-white p-4 text-sm">
              <p className="font-semibold">{student.fullName}</p>
              <p className="text-tejas-muted">{student.email} · {student.streamName} · Class {student.classLevel}</p>
              <p className="text-tejas-muted">{student.payment.map((item) => `${item.bookId} ${item.status} ₹${item.amountInr}`).join("; ") || "No entitlement"}</p>
              <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const streamId = String(form.get("streamId") || "");
                const classLevel = String(form.get("classLevel") || "");
                void post("/api/learn/staff/correction", {
                  studentId: student.id,
                  streamId: streamId || undefined,
                  classLevel: classLevel ? Number(classLevel) : undefined,
                  reason: form.get("reason"),
                });
              }}>
                <select className={fieldClass} name="streamId">
                  <option value="">Keep stream</option>
                  <option value="english">TEJAS English</option>
                  <option value="mathematics">TEJAS Mathematics</option>
                  <option value="technology">TEJAS Future Tech</option>
                </select>
                <input className={fieldClass} name="classLevel" inputMode="numeric" placeholder="Corrected class" />
                <input className={`${fieldClass} sm:col-span-2`} name="reason" required minLength={10} placeholder="Reason for the correction" />
                <Button type="submit" variant="outline">Record correction</Button>
              </form>
              {student.payment.filter((item) => item.status === "reported").map((item) => (
                <form key={item.bookId} className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void post("/api/learn/staff/payment", { studentId: student.id, bookId: item.bookId, decision: form.get("decision"), note: form.get("note") });
                }}>
                  <input className={fieldClass} name="note" required minLength={5} placeholder={`Note for ${item.bookId}`} />
                  <select className={fieldClass} name="decision"><option value="verified">Verify</option><option value="rejected">Reject</option></select>
                  <Button type="submit" variant="secondary">Save payment</Button>
                </form>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-tejas-blue">Audit</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {overview.audit.map((item) => (
            <li key={item.id} className="rounded-xl border border-tejas-border bg-white px-3 py-2">
              <span className="font-semibold">{item.action}</span> · {item.actor} · {item.studentId ?? "content"} · {item.reason}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
