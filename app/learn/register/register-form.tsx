"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authResult } from "@/lib/portal/auth-result";
import { PORTAL_EBOOK_FEE_INR, portalStreams } from "@/lib/portal/model";
import { formatInr } from "@/lib/registration/fee";
import type { StreamId } from "@/lib/registration/schema";

const fieldClass = "mt-1 w-full rounded-xl border border-tejas-border bg-white px-3 py-2 text-sm text-tejas-ink";

export function RegisterForm() {
  const router = useRouter();
  const streams = useMemo(() => portalStreams(), []);
  const [selectedStreams, setSelectedStreams] = useState<StreamId[]>(["technology"]);
  const [classLevel, setClassLevel] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const classOptions = useMemo(() => {
    if (selectedStreams.length === 0) return [] as number[];
    const sets = selectedStreams.map((id) => new Set(streams.find((stream) => stream.id === id)?.classes ?? []));
    const first = [...(sets[0] ?? [])];
    return first.filter((level) => sets.every((set) => set.has(level))).sort((a, b) => a - b);
  }, [selectedStreams, streams]);

  const total = selectedStreams.length * PORTAL_EBOOK_FEE_INR;

  function toggleStream(streamId: StreamId) {
    setSelectedStreams((current) => {
      const next = current.includes(streamId) ? current.filter((id) => id !== streamId) : [...current, streamId];
      return next;
    });
    setClassLevel("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (selectedStreams.length === 0) {
      setError("Select at least one stream.");
      return;
    }
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/learn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          parentName: form.get("parentName"),
          mobile: form.get("mobile"),
          email: form.get("email"),
          schoolName: form.get("schoolName"),
          password: form.get("password"),
          streamId: selectedStreams[0],
          streamIds: selectedStreams,
          classLevel: Number(classLevel),
        }),
      });
      const result = await authResult(response, "The account could not be created.");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/learn/dashboard");
      router.refresh();
    } catch {
      setError("The account could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
      <label className="block text-sm font-semibold text-tejas-ink">Student name
        <input className={fieldClass} name="fullName" required autoComplete="name" />
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">Parent or guardian name
        <input className={fieldClass} name="parentName" required />
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">Mobile
        <input className={fieldClass} name="mobile" required inputMode="tel" autoComplete="tel" />
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">Email
        <input className={fieldClass} name="email" type="email" required autoComplete="email" />
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">School
        <input className={fieldClass} name="schoolName" required />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-tejas-ink">Olympiad streams (select one or more)</legend>
        <p className="text-xs text-tejas-muted">One email may purchase English, Mathematics and Future Tech. Fee is {formatInr(PORTAL_EBOOK_FEE_INR)} per stream.</p>
        {streams.map((stream) => {
          const checked = selectedStreams.includes(stream.id);
          return (
            <label key={stream.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-tejas-border px-3 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={checked}
                onChange={() => toggleStream(stream.id)}
              />
              <span>
                <span className="font-semibold text-tejas-ink">{stream.name}</span>
                <span className="mt-1 block text-tejas-muted">
                  Classes {stream.classes.join(", ")} · {formatInr(PORTAL_EBOOK_FEE_INR)} · e-book + mock tests
                </span>
              </span>
            </label>
          );
        })}
        <p className="text-sm font-semibold text-tejas-blue">Selected {selectedStreams.length} · Total {formatInr(total)}</p>
      </fieldset>

      <label className="block text-sm font-semibold text-tejas-ink">Class
        <select className={fieldClass} value={classLevel} required onChange={(event) => setClassLevel(event.target.value)}>
          <option value="">Select a class</option>
          {classOptions.map((level) => (
            <option key={level} value={level}>Class {level}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">Password
        <input className={fieldClass} name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending || !classLevel || selectedStreams.length === 0}>
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}
