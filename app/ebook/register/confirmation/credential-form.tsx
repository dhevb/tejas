"use client";

import { useState } from "react";

const controlClass =
  "mt-1.5 w-full rounded-xl border border-tejas-border bg-white px-3 py-2.5 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

export function CredentialForm({ reference }: { reference: string }) {
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setPassword("");
    setMessage("");
    const response = await fetch("/api/ebook/credentials", { method: "POST", body: data });
    const body = (await response.json()) as { ok?: boolean; message?: string; password?: string; email?: string };
    setBusy(false);
    if (body.ok && body.password && body.email) {
      setEmail(body.email);
      setPassword(body.password);
      return;
    }
    setMessage(body.message ?? "The password could not be shown.");
  }

  return (
    <form className="space-y-3 rounded-xl border border-tejas-border p-4" onSubmit={submit}>
      <h2 className="text-lg font-bold text-tejas-blue">Collect the login password</h2>
      <p className="text-tejas-muted">After payment is verified, the password can be shown once on this page. It is not placed in the page address.</p>
      <input type="hidden" name="reference" value={reference} />
      <label className="block text-sm">
        <span className="font-medium">Email used at registration</span>
        <input name="email" type="email" required autoComplete="email" className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Mobile used at registration</span>
        <input name="mobile" type="tel" required autoComplete="tel" className={controlClass} />
      </label>
      <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center rounded-xl bg-tejas-blue px-4 font-semibold text-white disabled:opacity-60">
        {busy ? "Checking…" : "Show password once"}
      </button>
      {message ? <p className="text-red-700">{message}</p> : null}
      {password ? (
        <div className="rounded-xl bg-tejas-ivory p-3">
          <p>Login email: {email}</p>
          <p className="mt-1 font-semibold">Password: {password}</p>
          <p className="mt-2 text-tejas-muted">Write this down. It will not be shown again. Then use the e-book login page.</p>
        </div>
      ) : null}
    </form>
  );
}
