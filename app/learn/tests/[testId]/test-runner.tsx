"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Question = { number: number; section: string; prompt: string; options: { key: string; text: string }[] };

export function TestRunner({ testId }: { testId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [expiresAt, setExpiresAt] = useState("");

  async function start() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/learn/tests/${testId}`, { method: "POST" });
    const body = (await response.json()) as { ok?: boolean; error?: string; attemptId?: string; questions?: Question[]; expiresAt?: string };
    setPending(false);
    if (!response.ok || !body.ok || !body.questions || !body.attemptId) {
      setError(body.error || "This test cannot be started.");
      return;
    }
    setAttemptId(body.attemptId);
    setQuestions(body.questions);
    setExpiresAt(body.expiresAt || "");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!questions) return;
    const form = new FormData(event.currentTarget);
    const answers: Record<string, string> = {};
    for (const question of questions) {
      const value = form.get(`q${question.number}`);
      if (typeof value === "string") answers[String(question.number)] = value;
    }
    setPending(true);
    const response = await fetch(`/api/learn/tests/${testId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers }),
    });
    const body = (await response.json()) as { ok?: boolean; error?: string; attemptId?: string };
    setPending(false);
    if (!response.ok || !body.ok || !body.attemptId) {
      setError(body.error || "The answers could not be submitted.");
      return;
    }
    router.push(`/learn/attempts/${body.attemptId}`);
    router.refresh();
  }

  if (!questions) {
    return (
      <div className="mt-6">
        {error ? <p className="mb-3 text-sm text-tejas-error" role="alert">{error}</p> : null}
        <Button type="button" onClick={start} disabled={pending}>{pending ? "Starting" : "Start the test"}</Button>
      </div>
    );
  }

  let section = "";
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <p className="text-sm text-tejas-muted">Time runs until {new Date(expiresAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST. The answer key stays hidden until you submit.</p>
      {questions.map((question) => {
        const showSection = question.section !== section;
        section = question.section;
        return (
          <fieldset key={question.number} className="rounded-2xl border border-tejas-border bg-white p-4">
            {showSection ? <legend className="px-1 text-sm font-semibold text-tejas-saffron">{question.section}</legend> : <legend className="sr-only">Question {question.number}</legend>}
            <p className="font-semibold text-tejas-ink">{question.number}. {question.prompt}</p>
            <div className="mt-3 space-y-2">
              {question.options.map((option) => (
                <label key={option.key} className="flex gap-2 text-sm">
                  <input type="radio" name={`q${question.number}`} value={option.key} required />
                  <span>({option.key}) {option.text}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      {error ? <p className="text-sm text-tejas-error" role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Submitting" : "Submit answers"}</Button>
    </form>
  );
}
