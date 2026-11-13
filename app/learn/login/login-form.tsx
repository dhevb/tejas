"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1 w-full rounded-xl border border-tejas-border bg-white px-3 py-2 text-sm";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/learn/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const body = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !body.ok) {
      setError(body.error || "Sign-in failed.");
      return;
    }
    router.push("/learn/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
      <label className="block text-sm font-semibold">Email
        <input className={fieldClass} name="email" type="email" required autoComplete="username" />
      </label>
      <label className="block text-sm font-semibold">Password
        <input className={fieldClass} name="password" type="password" required autoComplete="current-password" />
      </label>
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Signing in" : "Sign in"}</Button>
    </form>
  );
}
