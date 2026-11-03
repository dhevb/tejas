"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Session = {
  ok: true;
  classLabel: string;
  streams: { id: string; label: string }[];
  fileSupplied: false;
};

type ReadBody = {
  ok: false;
  message: string;
  download?: false;
};

export function EbookReader() {
  const [session, setSession] = useState<Session | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [books, setBooks] = useState<Record<string, ReadBody>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/ebook/session")
      .then(async (response) => {
        if (!response.ok) {
          if (active) setSignedOut(true);
          return;
        }
        const body = (await response.json()) as Session;
        if (!active) return;
        setSession(body);
        const entries = await Promise.all(body.streams.map(async (stream) => {
          const read = await fetch(`/api/ebook/read?stream=${encodeURIComponent(stream.id)}`);
          const payload = (await read.json()) as ReadBody;
          return [stream.id, payload] as const;
        }));
        if (active) setBooks(Object.fromEntries(entries));
      })
      .catch(() => {
        if (active) setSignedOut(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await fetch("/api/ebook/logout", { method: "POST" });
    setSession(null);
    setSignedOut(true);
  }

  if (signedOut) {
    return (
      <div className="rounded-2xl border border-tejas-border bg-white p-6">
        <p>Sign in to read an e-book.</p>
        <Link href="/ebook/login" className="mt-3 inline-flex font-semibold text-tejas-blue underline">E-book login</Link>
      </div>
    );
  }
  if (!session) return <p className="text-tejas-muted">Checking the login…</p>;

  return (
    <>
      <style>{`@media print { .ebook-reader { display: none !important; } .ebook-print-note { display: block !important; } } .ebook-print-note { display: none; }`}</style>
      <p className="ebook-print-note">Printing is not available.</p>
      <div className="ebook-reader space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-tejas-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p>{session.classLabel}. This login can open only the streams listed here.</p>
        <button type="button" onClick={signOut} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-tejas-border px-4 font-semibold text-tejas-blue">Sign out</button>
      </div>
      {session.streams.map((stream) => (
        <article key={stream.id} className="rounded-2xl border border-tejas-border bg-white p-5">
          <h2 className="text-xl font-bold text-tejas-blue">{stream.label}</h2>
          <p className="mt-3 text-sm leading-relaxed text-tejas-ink">{books[stream.id]?.message ?? "Checking this book…"}</p>
        </article>
      ))}
      <p className="text-sm text-tejas-muted">This page does not offer download or print. A screenshot or another copy made outside the browser cannot be fully prevented. No file address is shown because no e-book file has been supplied.</p>
      </div>
    </>
  );
}
