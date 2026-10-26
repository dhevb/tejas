"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";
import { Button } from "@/components/ui/button";
import { currentCycle } from "@/content/current-cycle";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { CheckCircle2, Loader2 } from "lucide-react";

const FEEDBACK_QUESTIONS = [
  "Is TEJAS clear as a platform (not just an exam)?",
  "Could you find your olympiad subject in under 30 seconds?",
  "Are the TEJAS Olympiad 2026–27 dates and fee clear?",
  "What felt confusing or showed 'Coming Soon' too early?",
  "Would you register your school or recommend TEJAS to students?",
];

export function BetaPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("https://formsubmit.co/ajax/olympiad@shikshamahakumbh.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...data,
          _subject: "TEJAS Beta Feedback",
          _template: "table",
        }),
      });
      if (res.ok) {
        AnalyticsEvents.betaFeedbackSubmit();
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Closed Beta"
        title="Help Shape TEJAS"
        subtitle="You're among the first teachers and students testing Bharat's National Talent Development Ecosystem. Your feedback directly improves the platform before public launch."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl border border-tejas-saffron/30 bg-tejas-saffron/5 p-6 text-sm text-tejas-muted">
              <p className="font-semibold text-tejas-ink">What to explore</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>
                  <Link href="/" className="text-tejas-saffron hover:underline">Homepage journey</Link> — does the story flow?
                </li>
                <li>
                  <Link href="/olympiads/english" className="text-tejas-saffron hover:underline">Olympiad portals</Link> — English, Maths, Technology
                </li>
                <li>
                  <Link href="/prepare" className="text-tejas-saffron hover:underline">Prepare hub</Link> and{" "}
                  <Link href="/resources" className="text-tejas-saffron hover:underline">Resources</Link>
                </li>
                <li>
                  <Link href="/hall-of-fame" className="text-tejas-saffron hover:underline">Hall of Fame</Link> — 2025 English Olympiad winners
                </li>
              </ul>
            </div>
          </FadeIn>

          {status === "success" ? (
            <FadeIn delay={0.1}>
              <div className="mt-10 rounded-2xl border border-tejas-emerald/30 bg-tejas-emerald/5 p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-tejas-emerald" aria-hidden />
                <h2 className="mt-4 text-xl font-bold text-tejas-ink">Thank you!</h2>
                <p className="mt-2 text-tejas-muted">Your feedback has been sent to Olympiad Cell, DHE.</p>
                <Link href="/" className="mt-6 inline-block">
                  <Button variant="outline">Back to TEJAS</Button>
                </Link>
              </div>
            </FadeIn>
          ) : (
            <FadeIn delay={0.1}>
              <form onSubmit={handleSubmit} className="mt-10 space-y-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-tejas">
                <h2 className="text-xl font-bold text-tejas-ink">Beta Feedback Form</h2>
                <p className="text-sm text-tejas-muted">
                  {currentCycle.editionName.en} — feedback goes to {currentCycle.olympiadEmail}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-tejas-ink">Name *</label>
                    <input id="name" name="name" required className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-tejas-ink">Email *</label>
                    <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-tejas-ink">Role *</label>
                    <select id="role" name="role" required className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron">
                      <option value="">Select…</option>
                      <option value="Teacher">Teacher / Coordinator</option>
                      <option value="Student">Student</option>
                      <option value="Parent">Parent</option>
                      <option value="School Admin">School Admin</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="school" className="block text-sm font-medium text-tejas-ink">School</label>
                    <input id="school" name="school" className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-tejas-ink">Please address these questions in your feedback:</p>
                  <ul className="mt-2 list-inside list-decimal space-y-1 text-sm text-tejas-muted">
                    {FEEDBACK_QUESTIONS.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-tejas-ink">Your feedback *</label>
                  <textarea id="feedback" name="feedback" rows={6} required placeholder="Share what worked, what confused you, and what you'd improve…" className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron" />
                </div>

                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-tejas-ink">Overall experience (1–5)</label>
                  <select id="rating" name="rating" className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2">
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Average</option>
                    <option value="2">2 — Needs work</option>
                    <option value="1">1 — Poor</option>
                  </select>
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-600">Could not send feedback. Please email {currentCycle.olympiadEmail} directly.</p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    "Submit Beta Feedback"
                  )}
                </Button>
              </form>
            </FadeIn>
          )}
        </div>
      </section>
    </>
  );
}
