"use client";

import { useEffect, useState } from "react";

export function BookReader({ bookId, title }: { bookId: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    fetch(`/api/learn/books/${bookId}/file`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "The e-book could not be opened.");
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "The e-book could not be opened.");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bookId]);

  if (error) return <p className="text-sm text-tejas-error" role="alert">{error}</p>;
  if (!url) return <p className="text-sm text-tejas-muted">Opening {title}…</p>;
  return <iframe title={title} src={url} className="h-[80vh] w-full rounded-2xl border border-tejas-border bg-white" />;
}
