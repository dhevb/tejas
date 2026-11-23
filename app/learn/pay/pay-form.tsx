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
        body: form,
        signal: controller.signal,
      });
      const text = await response.text();
      type PayResponse = {
        ok?: boolean;
        error?: string;
        outcome?: string;
        reason?: string;
        verificationLabel?: string;
      };
      let body: PayResponse | null = null;
      try {
        body = text ? (JSON.parse(text) as PayResponse) : null;
      } catch {
        body = null;
      }
      if (!response.ok || !body?.ok) {
        setError(body?.error || "The payment proof could not be saved.");
        return;
      }
      if (body.outcome === "automatic") {
        setMessage(`${body.reason ?? "Payment approved from the screenshot match."} Access opens for the purchased stream only. This is screenshot-based automatic approval, not bank-statement confirmation.`);
      } else {
        setMessage(`${body.reason ?? "Payment proof saved."} The e-book stays locked until the screenshot checks pass or staff complete a review. This is not bank-statement confirmation.`);
      }
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setError(timedOut
        ? "The request timed out. Try again. The e-book stays locked until a valid screenshot match or staff verification."
        : "The payment proof could not be confirmed. Check the connection and try again.");
    } finally {
      clearTimeout(timer);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" encType="multipart/form-data">
      <label className="block text-sm font-semibold">UTR / transaction reference
        <input className={fieldClass} name="transactionReference" required minLength={6} />
      </label>
      <label className="block text-sm font-semibold">Payment screenshot (JPG or PNG)
        <input className={fieldClass} name="receipt" type="file" required accept=".jpg,.jpeg,.png,image/jpeg,image/png" />
      </label>
      <p className="text-xs leading-relaxed text-tejas-muted">
        Both the screenshot and the UTR are required. Automatic approval runs only when the screenshot UTR, beneficiary, amount, and success status all match. That is screenshot-based verification, not bank confirmation.
      </p>
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-tejas-emerald" role="status">{message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Uploading" : "Submit screenshot and UTR"}</Button>
    </form>
  );
}
