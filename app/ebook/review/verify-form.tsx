"use client";

import { useState } from "react";

const controlClass =
  "mt-1.5 w-full rounded-xl border border-tejas-border bg-white px-3 py-2.5 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

export function EbookVerifyForm() {
  const [token, setToken] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/register/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = (await response.json()) as { error?: string };
    setToken("");
    setMessage(response.ok ? "Staff sign-in is active for this browser." : body.error ?? "Staff sign-in failed.");
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setPassword(null);
    setMessage("");
    const data = new FormData();
    data.set("reference", reference);
    const response = await fetch("/api/ebook/admin/verify", { method: "POST", body: data });
    const body = (await response.json()) as { ok?: boolean; message?: string; password?: string | null; email?: string; alreadyActive?: boolean };
    if (!response.ok || !body.ok) {
      setMessage(body.message ?? "The e-book payment could not be verified.");
      return;
    }
    setEmail(body.email ?? "");
    if (body.password) {
      setPassword(body.password);
      setMessage("Payment is marked verified. Show this password to the student or parent once. It is not stored for display again.");
      return;
    }
    setMessage(body.alreadyActive ? "This registration was already verified. The password is not shown again." : "Verified.");
  }

  return (
    <div className="space-y-6">
      <form className="space-y-3 rounded-2xl border border-tejas-border bg-white p-5" onSubmit={signIn}>
        <h2 className="text-lg font-bold text-tejas-blue">Staff sign-in</h2>
        <p className="text-sm text-tejas-muted">This uses the existing staff token. It does not open Olympiad payment records.</p>
        <label className="block text-sm">
          <span className="font-medium">Staff token</span>
          <input type="password" value={token} onChange={(event) => setToken(event.target.value)} className={controlClass} autoComplete="current-password" />
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-tejas-blue px-4 font-semibold text-white">Sign in</button>
      </form>
      <form className="space-y-3 rounded-2xl border border-tejas-border bg-white p-5" onSubmit={verify}>
        <h2 className="text-lg font-bold text-tejas-blue">Verify one e-book payment</h2>
        <label className="block text-sm">
          <span className="font-medium">E-book reference</span>
          <input value={reference} onChange={(event) => setReference(event.target.value)} required className={controlClass} />
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-tejas-saffron px-4 font-semibold text-white">Verify payment and create the login</button>
      </form>
      {message ? <p className="text-sm text-tejas-ink">{message}</p> : null}
      {password ? (
        <div className="rounded-2xl border border-tejas-border bg-white p-5">
          <p>Login email: {email}</p>
          <p className="mt-2 font-semibold">Password: {password}</p>
        </div>
      ) : null}
    </div>
  );
}
