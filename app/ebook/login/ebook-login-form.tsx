"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const controlClass =
  "mt-1.5 w-full rounded-xl border border-tejas-border bg-white px-3 py-2.5 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

export function EbookLoginForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setErrors([]);
    const response = await fetch("/api/ebook/login", { method: "POST", body: data });
    const body = (await response.json()) as { ok?: boolean; formErrors?: string[] };
    setBusy(false);
    if (body.ok) {
      router.push("/ebook/read");
      return;
    }
    setErrors(body.formErrors ?? ["Sign-in failed."]);
  }

  return (
    <form className="space-y-4 rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6" onSubmit={submit}>
      <label className="block text-sm">
        <span className="font-medium text-tejas-ink">Email</span>
        <input name="email" type="email" required autoComplete="username" className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-tejas-ink">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={controlClass} />
      </label>
      {errors.map((error) => <p key={error} className="text-sm text-red-700">{error}</p>)}
      <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-tejas-saffron px-6 font-semibold text-white disabled:opacity-60 sm:w-auto">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
