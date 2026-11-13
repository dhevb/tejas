"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authResult } from "@/lib/portal/auth-result";
import { portalStreams } from "@/lib/portal/model";

const fieldClass = "mt-1 w-full rounded-xl border border-tejas-border bg-white px-3 py-2 text-sm text-tejas-ink";

export function RegisterForm() {
  const router = useRouter();
  const streams = useMemo(() => portalStreams(), []);
  const [streamId, setStreamId] = useState(streams[2].id);
  const [classLevel, setClassLevel] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const classes = streams.find((stream) => stream.id === streamId)?.classes ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
          streamId,
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
      <label className="block text-sm font-semibold text-tejas-ink">Stream
        <select
          className={fieldClass}
          value={streamId}
          required
          onChange={(event) => {
            setStreamId(event.target.value as typeof streamId);
            setClassLevel("");
          }}
        >
          {streams.map((stream) => (
            <option key={stream.id} value={stream.id}>{stream.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">Class
        <select className={fieldClass} value={classLevel} required onChange={(event) => setClassLevel(event.target.value)}>
          <option value="">Select a class</option>
          {classes.map((level) => (
            <option key={level} value={level}>Class {level}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-tejas-ink">Password
        <input className={fieldClass} name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending || !classLevel}>{pending ? "Creating account" : "Create account"}</Button>
    </form>
  );
}
