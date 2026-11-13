"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1 w-full rounded-xl border border-tejas-border bg-white px-3 py-2 text-sm";

export function AccountForm({ fullName, parentName, mobile, schoolName }: { fullName: string; parentName: string; mobile: string; schoolName: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      fullName: String(form.get("fullName") ?? ""),
      parentName: String(form.get("parentName") ?? ""),
      mobile: String(form.get("mobile") ?? ""),
      schoolName: String(form.get("schoolName") ?? ""),
    };
    const password = String(form.get("password") ?? "");
    if (password) payload.password = password;
    const response = await fetch("/api/learn/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !body.ok) {
      setError(body.error || "The account could not be updated.");
      return;
    }
    setMessage("Account details saved. Stream and class are unchanged.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-semibold">Student name
        <input className={fieldClass} name="fullName" defaultValue={fullName} required />
      </label>
      <label className="block text-sm font-semibold">Parent or guardian
        <input className={fieldClass} name="parentName" defaultValue={parentName} required />
      </label>
      <label className="block text-sm font-semibold">Mobile
        <input className={fieldClass} name="mobile" defaultValue={mobile} required />
      </label>
      <label className="block text-sm font-semibold">School
        <input className={fieldClass} name="schoolName" defaultValue={schoolName} required />
      </label>
      <label className="block text-sm font-semibold">New password
        <input className={fieldClass} name="password" type="password" autoComplete="new-password" />
      </label>
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-tejas-emerald" role="status">{message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving" : "Save details"}</Button>
    </form>
  );
}
