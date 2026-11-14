import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";
import { currentCycle } from "@/content/current-cycle";

export const metadata = createMetadata({
  title: "Feedback",
  description: "This page does not collect feedback. Write to the TEJAS Olympiad email.",
  path: "/beta",
  noIndex: true,
});

const FEEDBACK_QUESTIONS = [
  "Is TEJAS clear as a platform (not just an exam)?",
  "Could you find your olympiad subject in under 30 seconds?",
  "Are the TEJAS Olympiad 2026–27 dates and fee clear?",
  "What felt confusing or showed 'Coming Soon' too early?",
  "Would you register your school or recommend TEJAS to students?",
];

export default function BetaPage() {
  return (
    <>
      <PageHero
        eyebrow="Feedback"
        title="Write to TEJAS"
        subtitle="This page does not send a form. There is no third-party form service on this website."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-tejas">
              <h2 className="text-xl font-bold text-tejas-ink">Feedback is not collected here</h2>
              <p className="mt-3 text-sm leading-relaxed text-tejas-muted">
                {currentCycle.editionName.en}. Write to{" "}
                <a className="font-semibold text-tejas-blue underline" href={`mailto:${currentCycle.olympiadEmail}`}>{currentCycle.olympiadEmail}</a>.
                {" "}A message typed into this page is not delivered.
              </p>
              <p className="mt-6 text-sm font-medium text-tejas-ink">Useful points to cover in that email:</p>
              <ul className="mt-2 list-inside list-decimal space-y-1 text-sm text-tejas-muted">
                {FEEDBACK_QUESTIONS.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
              <ul className="mt-6 list-inside list-disc space-y-1 text-sm text-tejas-muted">
                <li><Link href="/" className="font-semibold text-tejas-blue underline">Homepage</Link></li>
                <li><Link href="/olympiads/english" className="font-semibold text-tejas-blue underline">TEJAS English</Link>, <Link href="/olympiads/mathematics" className="font-semibold text-tejas-blue underline">Mathematics</Link>, and <Link href="/olympiads/technology" className="font-semibold text-tejas-blue underline">Future Tech</Link></li>
                <li><Link href="/prepare" className="font-semibold text-tejas-blue underline">Prepare</Link> and <Link href="/resources" className="font-semibold text-tejas-blue underline">Resources</Link></li>
                <li><Link href="/hall-of-fame" className="font-semibold text-tejas-blue underline">Hall of Fame</Link> — 2025 English Olympiad</li>
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
