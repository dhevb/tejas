"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { OlympiadPortalContent } from "@/content/types";
import { StickySubNav } from "@/components/shared/StickySubNav";
import { Countdown } from "@/components/shared/Countdown";
import { CertificatePreview } from "@/components/shared/CertificatePreview";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { FAQAccordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/shared/FadeIn";
import { ComingSoonCard } from "@/components/shared/ComingSoonCard";
import type { FAQItem } from "@/types";

interface Props {
  olympiad: OlympiadPortalContent;
}

const portalNav = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why" },
  { id: "skills", label: "Skills" },
  { id: "outcomes", label: "Outcomes" },
  { id: "careers", label: "Careers" },
  { id: "eligibility", label: "Eligibility" },
  { id: "pattern", label: "Exam Pattern" },
  { id: "syllabus", label: "Syllabus" },
  { id: "samples", label: "Samples" },
  { id: "roadmap", label: "Roadmap" },
  { id: "books", label: "Books" },
  { id: "mock-tests", label: "Mock Tests" },
  { id: "awards", label: "Awards" },
  { id: "guides", label: "Guides" },
  { id: "faq", label: "FAQ" },
];

export function OlympiadPortal({ olympiad }: Props) {
  const { t } = useI18n();
  const isComingSoon = olympiad.status === "coming-soon";
  const faqItems: FAQItem[] = olympiad.faqs.map((f) => ({
    question: t(f.question),
    answer: t(f.answer),
  }));

  return (
    <>
      <section className="bg-tejas-blue py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-tejas-saffron text-white">{t(olympiad.grades)}</Badge>
                {isComingSoon ? (
                  <Badge variant="outline" className="border-white/40 text-white">Coming Soon</Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-400 text-emerald-300">Current Edition</Badge>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-bold md:text-5xl">
                {t(olympiad.name)} Olympiad
              </h1>
              <p className="mt-2 font-hindi text-lg text-white/70">{olympiad.name.hi}</p>
              <p className="mt-4 max-w-2xl text-white/80 leading-relaxed">{t(olympiad.description)}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <span>{t(olympiad.duration)}</span>
                <span>·</span>
                <span>{olympiad.questions} questions</span>
                {olympiad.partner && (
                  <>
                    <span>·</span>
                    <span>{t(olympiad.partner)}</span>
                  </>
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                {isComingSoon ? (
                  <Button disabled>Coming Soon</Button>
                ) : (
                  <Button disabled title="Registration opens soon">Register Now</Button>
                )}
                <Link href="/prepare/mock-tests">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                    Free Mock Test
                  </Button>
                </Link>
              </div>
            </div>
            {!isComingSoon && (
              <Countdown targetDate="2026-09-01" label="Registration opens soon" />
            )}
          </div>
        </div>
      </section>

      <StickySubNav items={portalNav} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isComingSoon && (
          <ComingSoonCard
            title={`${t(olympiad.name)} Olympiad`}
            description="This stream is not part of TEJAS Olympiad 2026–27. The active streams are TEJAS English, TEJAS Mathematics, and TEJAS Future Tech."
          />
        )}

        <section id="overview" className="scroll-mt-32 pb-16">
          <FadeIn>
            <h2 className="text-2xl font-bold text-tejas-ink">Overview</h2>
            <p className="mt-2 font-hindi text-tejas-muted">{t(olympiad.tagline)}</p>
            <p className="mt-4 max-w-3xl text-tejas-muted leading-relaxed">{t(olympiad.description)}</p>
          </FadeIn>
        </section>

        <section id="why" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Why {t(olympiad.name)}?</h2>
          <p className="mt-4 max-w-3xl text-tejas-muted leading-relaxed">{t(olympiad.whySubject)}</p>
        </section>

        <section id="skills" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Skills Developed</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {olympiad.skillsDeveloped.map((s) => (
              <li key={s.en} className="rounded-xl border border-stone-200 p-4 text-sm text-tejas-muted">{t(s)}</li>
            ))}
          </ul>
        </section>

        <section id="outcomes" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Learning Outcomes</h2>
          <ul className="mt-6 space-y-3">
            {olympiad.learningOutcomes.map((o) => (
              <li key={o.en} className="flex items-start gap-3 text-tejas-muted">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tejas-emerald" aria-hidden />
                {t(o)}
              </li>
            ))}
          </ul>
        </section>

        <section id="careers" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Career Pathways</h2>
          <p className="mt-2 text-sm text-tejas-muted">Subject excellence opens doors across disciplines:</p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {olympiad.careerPathways.map((c) => (
              <li key={c.en} className="rounded-full border border-tejas-blue/20 bg-tejas-blue/5 px-4 py-2 text-sm text-tejas-blue">{t(c)}</li>
            ))}
          </ul>
        </section>

        <section id="eligibility" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Eligibility</h2>
          <ul className="mt-6 space-y-3">
            {olympiad.eligibility.map((item) => (
              <li key={item.en} className="flex items-start gap-3 text-tejas-muted">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tejas-saffron" aria-hidden />
                {t(item)}
              </li>
            ))}
          </ul>
        </section>

        <section id="pattern" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Exam Pattern</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-tejas-ivory">
                  <th className="px-6 py-4 font-semibold">Section</th>
                  <th className="px-6 py-4 font-semibold">Questions</th>
                  <th className="px-6 py-4 font-semibold">Marks</th>
                </tr>
              </thead>
              <tbody>
                {olympiad.examPattern.map((row) => (
                  <tr key={row.section.en} className="border-t border-stone-100">
                    <td className="px-6 py-4">{t(row.section)}</td>
                    <td className="px-6 py-4">{row.questions}</td>
                    <td className="px-6 py-4">{row.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="syllabus" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Syllabus</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {olympiad.syllabus.map((level) => (
              <div key={level.level.en} className="rounded-2xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-tejas-ink">{t(level.level)}</h3>
                  <Badge variant="outline">{t(level.classes)}</Badge>
                </div>
                <ul className="mt-4 space-y-2">
                  {level.topics.map((topic) => (
                    <li key={topic.en} className="text-sm text-tejas-muted">• {t(topic)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {olympiad.sampleQuestions.length > 0 && (
          <section id="samples" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Sample Questions</h2>
            <div className="mt-6 space-y-4">
              {olympiad.sampleQuestions.map((sq, i) => (
                <div key={sq.question.en} className="rounded-xl border border-stone-200 bg-tejas-ivory/50 p-5">
                  <p className="font-medium text-tejas-ink"><span className="text-tejas-saffron">Q{i + 1}.</span> {t(sq.question)}</p>
                  {sq.hint && <p className="mt-2 text-xs text-tejas-muted">{t(sq.hint)}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {olympiad.preparationRoadmap.length > 0 && (
          <section id="roadmap" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Preparation Roadmap</h2>
            <div className="mt-6 space-y-4">
              {olympiad.preparationRoadmap.map((step, i) => (
                <div key={step.phase.en} className="flex gap-4 rounded-xl border border-stone-200 p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tejas-saffron text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-tejas-ink">{t(step.phase)}</p>
                    <p className="mt-1 text-sm text-tejas-muted">{t(step.description)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {olympiad.books.length > 0 && (
          <section id="books" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Recommended Books</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {olympiad.books.map((book) => (
                <li key={book.title.en} className="rounded-xl border border-stone-200 p-5">
                  <p className="font-semibold text-tejas-ink">{t(book.title)}</p>
                  <p className="text-sm text-tejas-muted">{t(book.author)} · {t(book.publisher)}</p>
                  {book.description && <p className="mt-2 text-sm text-tejas-muted">{t(book.description)}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {olympiad.mockTests.length > 0 && (
          <section id="mock-tests" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Mock Test Previews</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {olympiad.mockTests.map((mock) => (
                <div key={mock.id} className="rounded-xl border border-stone-200 p-5">
                  <Badge className="mb-2">{t(mock.level)}</Badge>
                  <p className="font-semibold text-tejas-ink">{t(mock.title)}</p>
                  <p className="mt-2 text-sm text-tejas-muted">{mock.questions} Q · {mock.duration}</p>
                  <Link href="/prepare/mock-tests" className="mt-3 inline-block text-sm font-semibold text-tejas-saffron hover:underline">
                    Preview →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {(olympiad.samplePapers.length > 0 || olympiad.previousPapers.length > 0) && (
          <section id="papers" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Sample & Previous Papers</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[...olympiad.samplePapers, ...olympiad.previousPapers].map((paper) => (
                <div key={paper.id} className="rounded-xl border border-stone-200 p-5">
                  <p className="font-semibold text-tejas-ink">{t(paper.title)}</p>
                  <p className="mt-1 text-sm text-tejas-muted">{t(paper.level)} · {paper.edition} · {paper.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {olympiad.videoLectures.length > 0 && (
          <section id="videos" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Video Lectures</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {olympiad.videoLectures.map((vid) => (
                <div key={vid.id} className="rounded-xl border border-stone-200 p-5">
                  <p className="font-semibold text-tejas-ink">{t(vid.title)}</p>
                  <p className="mt-1 text-sm text-tejas-muted">{t(vid.speaker)} · {vid.duration}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="awards" className="scroll-mt-32 border-t border-stone-200 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-tejas-ink">Awards & Recognition</h2>
              <ul className="mt-6 space-y-4">
                {olympiad.awards.map((award) => (
                  <li key={award.level.en} className="rounded-xl border border-stone-200 p-4">
                    <p className="font-semibold text-tejas-saffron">{t(award.level)}</p>
                    <p className="mt-1 text-sm text-tejas-muted">{t(award.description)}</p>
                  </li>
                ))}
              </ul>
              {olympiad.hallOfFameHighlights.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-tejas-ink">Hall of Fame Highlights</h3>
                  <ul className="mt-4 space-y-2">
                    {olympiad.hallOfFameHighlights.map((h) => (
                      <li key={h.name} className="text-sm text-tejas-muted">
                        <span className="font-semibold text-tejas-ink">{h.name}</span> — {h.school} ({t(h.level)}, {h.year})
                      </li>
                    ))}
                  </ul>
                  <Link href="/hall-of-fame" className="mt-3 inline-block text-sm font-semibold text-tejas-saffron hover:underline">
                    View Hall of Fame →
                  </Link>
                </div>
              )}
            </div>
            <CertificatePreview olympiad={`${t(olympiad.name)} Olympiad`} />
          </div>
        </section>

        {olympiad.calendar.length > 0 && (
          <section id="calendar" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Calendar</h2>
            <div className="mt-6 space-y-3">
              {olympiad.calendar.map((event) => (
                <div key={event.label.en} className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                  <div>
                    <p className="font-medium text-tejas-ink">{t(event.label)}</p>
                    <p className="text-sm text-tejas-muted">
                      {new Date(event.date).toLocaleDateString("en-IN", { dateStyle: "long" })}
                    </p>
                  </div>
                  <Badge variant={event.status === "completed" ? "outline" : event.status === "upcoming" ? "success" : "gold"}>
                    {event.status === "completed" ? "Completed" : event.status === "upcoming" ? "Upcoming" : "TBA"}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {(olympiad.teacherGuide.length > 0 || olympiad.parentGuide.length > 0 || olympiad.schoolGuide.length > 0) && (
          <section id="guides" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Guides</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-3">
              {[
                { title: "Teacher Guide", sections: olympiad.teacherGuide },
                { title: "Parent Guide", sections: olympiad.parentGuide },
                { title: "School Guide", sections: olympiad.schoolGuide },
              ].filter((g) => g.sections.length > 0).map((guide) => (
                <div key={guide.title}>
                  <h3 className="text-lg font-bold text-tejas-saffron">{guide.title}</h3>
                  {guide.sections.map((section) => (
                    <div key={section.title.en} className="mt-4">
                      <p className="font-semibold text-tejas-ink">{t(section.title)}</p>
                      <ul className="mt-2 space-y-1">
                        {section.points.map((point) => (
                          <li key={point.en} className="text-sm text-tejas-muted">• {t(point)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="faq" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="mb-6 text-2xl font-bold text-tejas-ink">FAQs</h2>
          <FAQAccordion items={faqItems} />
        </section>

        <section id="register" className="scroll-mt-32 border-t border-stone-200 py-16 text-center">
          <h2 className="text-2xl font-bold text-tejas-ink">Ready to Participate?</h2>
          <p className="mt-2 text-tejas-muted">Register through your school via Olympiad Cell, DHE.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button disabled={isComingSoon}>Register Now</Button>
            <Link href="/schools">
              <Button variant="outline">For Schools</Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
