"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1 w-full rounded-xl border border-tejas-border bg-white px-3 py-2 text-sm";

export function PayForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch("/api/learn/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionReference: form.get("transactionReference") }),
        signal: controller.signal,
      });
      const text = await response.text();
      let body: { ok?: boolean; error?: string } | null = null;
      try {
        body = text ? JSON.parse(text) as { ok?: boolean; error?: string } : null;
      } catch {
        body = null;
      }
      if (!response.ok || !body?.ok) {
        setError(body?.error || "The reference could not be saved.");
        return;
      }
      setMessage("Reference saved. The e-book stays locked until staff verify this payment.");
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setError(timedOut ? "The request timed out. Try again. The e-book stays locked until staff verify a saved reference." : "The reference could not be confirmed. Check the connection and try again.");
    } finally {
      clearTimeout(timer);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-semibold">Transaction reference
        <input className={fieldClass} name="transactionReference" required minLength={6} />
      </label>
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-tejas-emerald" role="status">{message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving" : "Submit reference"}</Button>
    </form>
  );
}
