"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/registration/fee";
import type { DashboardPurchaseOption } from "@/lib/portal/store";
import type { StreamId } from "@/lib/registration/schema";

export function BuyMoreStreams({ options }: { options: DashboardPurchaseOption[] }) {
  const router = useRouter();
  const available = useMemo(() => options.filter((item) => item.status === "available"), [options]);
  const [selected, setSelected] = useState<StreamId[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const total = selected.length * 49;

  function toggle(streamId: StreamId) {
    setSelected((current) => (current.includes(streamId) ? current.filter((id) => id !== streamId) : [...current, streamId]));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selected.length === 0 || pending) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/learn/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamIds: selected }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; amountInr?: number } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || "Those streams could not be added.");
        return;
      }
      setMessage(`Streams added. Pay ${formatInr(body.amountInr ?? total)} on the payment page. Already purchased streams were not charged again.`);
      setSelected([]);
      router.refresh();
    } catch {
      setError("Those streams could not be added.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-3xl border border-tejas-border bg-white p-5 shadow-tejas sm:p-6">
      <ul className="space-y-3">
        {options.map((option) => (
          <li key={option.streamId} className="rounded-2xl border border-tejas-border px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-tejas-ink">{option.streamName}</p>
                {option.bookTitle ? (
                  <p className="mt-1 text-sm text-tejas-muted">
                    {option.bookTitle} · {option.includedMockTests} mock tests · {formatInr(option.amountInr)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-tejas-muted">{option.reason ?? "Not available for this class."}</p>
                )}
              </div>
              {option.status === "purchased" ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-tejas-emerald">Purchased</span>
              ) : option.status === "pending" ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-tejas-saffron">Payment pending</span>
              ) : option.status === "unavailable" ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-tejas-muted">Unavailable</span>
              ) : (
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-tejas-blue">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={selected.includes(option.streamId)}
                    onChange={() => toggle(option.streamId)}
                  />
                  Select
                </label>
              )}
            </div>
          </li>
        ))}
      </ul>
      {available.length === 0 ? (
        <p className="mt-4 text-sm text-tejas-muted">No additional streams are available to purchase for this class.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <p className="text-sm text-tejas-ink">Selected: {selected.length || 0} · Total payable: {formatInr(total)}</p>
          {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
          {message ? <p className="text-sm text-tejas-emerald" role="status">{message}</p> : null}
          <Button type="submit" disabled={pending || selected.length === 0}>
            {pending ? "Saving" : "Add selected streams"}
          </Button>
        </form>
      )}
    </article>
  );
}
