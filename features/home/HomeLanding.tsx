import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Compass,
  Cpu,
  GraduationCap,
  Lightbulb,
  School,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/shared/FAQSection";
import { currentCycle, pastEnglishOlympiad2025 } from "@/content/current-cycle";
import { hallOfFameRegistry } from "@/content/hall-of-fame";
import { faqItems } from "@/data/faq";

const streams = [
  {
    href: "/olympiads/english",
    title: "TEJAS English",
    image: "/home/stream-english.jpg",
    alt: "Illustration of a student reading a book in an Indian classroom",
    text: "Offline examination at the school. A syllabus has not been published.",
    when: "10 December 2026",
    classes: "Classes III–X",
  },
  {
    href: "/olympiads/mathematics",
    title: "TEJAS Mathematics",
    image: "/home/stream-maths.jpg",
    alt: "Illustration of a student drawing a circle and triangle with a compass",
    text: "Offline examination at the school. A syllabus has not been published.",
    when: "9 December 2026",
    classes: "Classes III–X",
  },
  {
    href: "/olympiads/technology",
    title: "TEJAS Future Tech",
    image: "/home/stream-tech.jpg",
    alt: "Illustration of two students looking at a small classroom robot and a laptop",
    text: "Offline OMR examination for Classes VI–X. It is not a computer-based test, and a syllabus has not been published.",
    when: "11 December 2026",
    classes: "Classes VI–X",
  },
] as const;

const reasons = [
  { icon: Compass, title: "English and Mathematics", text: "Both streams are open to Classes III–X." },
  { icon: BookOpen, title: "Syllabus not yet published", text: "Question counts, duration, and the section pattern will be announced officially." },
  { icon: Lightbulb, title: "Papers sent to the school", text: "Question papers and OMR sheets are dispatched in advance. Completed sheets are couriered the same day." },
  { icon: Sparkles, title: "Prizes already announced", text: "Each class in each stream has prizes of ₹3,100, ₹2,100, ₹1,500, and ten consolation prizes of ₹500." },
  { icon: Cpu, title: "Future Tech is Classes VI–X", text: "Classes III–V are not eligible. The examination is offline and uses OMR sheets." },
  { icon: Users, title: "Take part with the school", text: "Schools register their students from 3 to 20 November 2026. There is no individual online signup." },
] as const;

const steps = [
  { n: "1", title: "School registration", text: "A school submits the form between 3 and 20 November 2026." },
  { n: "2", title: "Student sheet", text: "The school uploads the student sheet and chooses a stream for each student." },
  { n: "3", title: "Preparation", text: "A syllabus and sample papers have not been published. Printed books are optional. This website does not start an online test." },
  { n: "4", title: "Examination", text: "Mathematics, English, and Future Tech are held offline at the school on 9, 10, and 11 December 2026." },
  { n: "5", title: "Results", text: "The brochure prints a tentative date of 12 January 2027. The invitation says the declaration will be communicated separately." },
] as const;

const learning = [
  { href: "/olympiads", title: "Olympiad pages", text: "Who may enter, when each stream is examined, and the published fee." },
  { href: "/prepare", title: "Prepare hub", text: "Mock tests and sample papers are not available. This is not a live course." },
  { href: "/resources", title: "Resources", text: "Only published pages are listed. Missing files are not shown as downloads." },
  { href: "/prepare/mock-tests", title: "Mock test information", text: "This page does not start a test, show a score, or run an online examination." },
] as const;

const previewFaqs = faqItems.filter((item) =>
  ["What is TEJAS?", "Which Olympiads are active in the current TEJAS edition?", "How do schools participate?", "What is the exam format?"].includes(item.question)
);

const recognised = ["eng-b-1", "eng-c-1", "eng-e-1"]
  .map((id) => hallOfFameRegistry.find((entry) => entry.id === id))
  .filter((entry) => entry !== undefined);

export function HomeLanding() {
  return (
    <>
      <section className="relative overflow-hidden bg-tejas-ivory">
        <div className="pointer-events-none absolute inset-0 tejas-pattern opacity-70" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-saffron">TEJAS Olympiad 2026–27</p>
            <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-tejas-blue sm:text-5xl lg:text-6xl">
              Find your spark...
            </h1>
            <p className="mt-4 text-xl font-medium text-tejas-ink sm:text-2xl">
              Talent Exploration for Junior Aspiring Scholars
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-tejas-muted">
              Talent Exploration for Junior Aspiring Scholars. English and Mathematics for Classes III–X, and Future Tech for Classes VI–X, organised by the Department of Holistic Education (DHE), VBITR, Kurukshetra.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/olympiads">
                <Button size="lg" className="w-full sm:w-auto">Explore Olympiads</Button>
              </Link>
              <Link href="/schools/register">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">Register Your School</Button>
              </Link>
            </div>
          </div>
          <div>
            <img
              src="/home/hero-learning.jpg"
              alt="Illustration of an Indian classroom, with a teacher and students writing at wooden desks"
              width={1280}
              height={720}
              className="aspect-video w-full rounded-3xl object-cover shadow-tejas-lg ring-1 ring-tejas-border"
            />
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {streams.map((stream) => (
                <li key={stream.href}>
                  <Link href={stream.href} className="block rounded-xl bg-white px-2 py-3 text-center text-xs font-semibold text-tejas-blue shadow-tejas ring-1 ring-tejas-border transition hover:text-tejas-saffron sm:text-sm">
                    {stream.title.replace("TEJAS ", "")}
                    <span className="mt-1 block text-[11px] font-medium text-tejas-muted">{stream.when.replace(" 2026", "")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20" aria-labelledby="glance-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="glance-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">TEJAS at a glance</h2>
          <p className="mt-3 max-w-2xl text-tejas-muted">These figures are the published programme facts for 2026–27. A count of schools or students for this cycle has not been published.</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["3", "Olympiad streams", "English, Mathematics, Future Tech"],
              ["III–X", "English and Mathematics", "Future Tech is Classes VI–X"],
              ["₹150", "Registration fee", "School retains ₹30; ₹120 to TEJAS"],
              ["20 Nov", "Last registration day", "Opens 3 November 2026"],
            ].map(([value, label, note]) => (
              <div key={label} className="rounded-2xl border border-tejas-border bg-tejas-ivory p-5">
                <dt className="text-sm font-medium text-tejas-muted">{label}</dt>
                <dd className="mt-2 text-3xl font-bold text-tejas-blue">{value}</dd>
                <p className="mt-2 text-sm text-tejas-muted">{note}</p>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-tejas-muted">
            The earlier {pastEnglishOlympiad2025.name.en} ({pastEnglishOlympiad2025.examDates.en}) had {pastEnglishOlympiad2025.totalStudents.toLocaleString("en-IN")} students from {pastEnglishOlympiad2025.totalSchools} schools in {pastEnglishOlympiad2025.regions.en}. Those numbers belong to 2025, not to this cycle.
          </p>
        </div>
      </section>

      <section className="bg-tejas-ivory py-16 md:py-24" aria-labelledby="streams-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="streams-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">Three Olympiad streams</h2>
          <p className="mt-3 max-w-2xl text-tejas-muted">Each stream has its own examination day. A school chooses the stream for each student.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {streams.map((stream) => (
              <article key={stream.href} className="overflow-hidden rounded-3xl border border-tejas-border bg-white shadow-tejas">
                <img src={stream.image} alt={stream.alt} width={1000} height={750} className="aspect-[4/3] w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-tejas-blue">{stream.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tejas-muted">{stream.text}</p>
                  <p className="mt-4 text-sm font-semibold text-tejas-ink">{stream.classes}</p>
                  <p className="text-sm text-tejas-saffron">{stream.when}</p>
                  <Link href={stream.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-tejas-blue hover:text-tejas-saffron">
                    Explore more <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24" aria-labelledby="why-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="why-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">Why TEJAS?</h2>
          <p className="mt-3 max-w-2xl text-tejas-muted">TEJAS is a school Olympiad. It does not promise a rank, a scholarship, or a future result.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((item) => (
              <li key={item.title} className="rounded-2xl border border-tejas-border bg-tejas-ivory p-5">
                <item.icon className="h-6 w-6 text-tejas-saffron" aria-hidden />
                <h3 className="mt-3 font-bold text-tejas-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tejas-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-tejas-ivory py-16 md:py-24" aria-labelledby="process-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="process-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">How a school takes part</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-5">
            {steps.map((step) => (
              <li key={step.n} className="relative rounded-2xl bg-white p-5 shadow-tejas ring-1 ring-tejas-border">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tejas-blue text-sm font-bold text-white">{step.n}</span>
                <h3 className="mt-4 font-bold text-tejas-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tejas-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24" aria-labelledby="dates-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-tejas-saffron" aria-hidden />
            <h2 id="dates-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">Important dates</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            <article className="rounded-2xl bg-tejas-blue p-5 text-white lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-tejas-gold">Registration</p>
              <p className="mt-3 text-2xl font-bold">3–20 November 2026</p>
              <p className="mt-2 text-sm text-white/75">The school form closes on 20 November 2026.</p>
            </article>
            {[
              ["Mathematics", "9 December 2026"],
              ["English", "10 December 2026"],
              ["Future Tech", "11 December 2026"],
            ].map(([name, date]) => (
              <article key={name} className="rounded-2xl border border-tejas-border p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">Examination</p>
                <h3 className="mt-3 text-xl font-bold text-tejas-blue">{name}</h3>
                <p className="mt-2 text-lg font-semibold text-tejas-ink">{date}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm text-tejas-muted">{currentCycle.felicitation.en}</p>
        </div>
      </section>

      <section className="bg-tejas-blue py-16 text-white md:py-20" aria-labelledby="join-heading">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-tejas-gold">For schools</p>
            <h2 id="join-heading" className="mt-3 text-3xl font-bold md:text-4xl">Be a part of TEJAS Olympiad 2026–27</h2>
            <p className="mt-4 text-lg text-white/80">Registration is open to schools from 3 November 2026 to 20 November 2026. The school collects ₹150 per student per stream, retains ₹30, and remits ₹120.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/schools/register">
              <Button size="lg" className="w-full sm:w-auto">Register Your School</Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" size="lg" className="w-full border-white/40 text-white hover:bg-white/10 sm:w-auto">Registration Guidelines</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-tejas-ivory py-16 md:py-24" aria-labelledby="learning-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="learning-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">Learning and resources</h2>
          <p className="mt-3 max-w-2xl text-tejas-muted">Only published pages are linked here. An online examination engine is not open.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {learning.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-tejas-border bg-white p-6 shadow-tejas transition hover:-translate-y-0.5 hover:shadow-tejas-lg">
                <h3 className="text-lg font-bold text-tejas-blue">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tejas-muted">{item.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tejas-saffron">Open <ArrowRight className="h-4 w-4" aria-hidden /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24" aria-labelledby="schools-heading">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <img
            src="/home/school-courtyard.jpg"
            alt="Illustration of a teacher and students walking in an Indian school courtyard"
            width={1152}
            height={864}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-tejas ring-1 ring-tejas-border"
          />
          <div>
            <School className="h-7 w-7 text-tejas-saffron" aria-hidden />
            <h2 id="schools-heading" className="mt-3 text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">Schools register their students</h2>
            <p className="mt-4 text-tejas-muted leading-relaxed">
              TEJAS is organised through schools. The coordinator uploads one student sheet and selects the streams. The school collects ₹150 for each student-stream, retains ₹30, and remits ₹120 to the published account. Printed books, when requested, are ₹170 each; the school retains ₹34 and remits ₹136. E-book access is not for sale.
            </p>
            <p className="mt-3 text-sm text-tejas-muted">{currentCycle.administeredBy.en}.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/schools/register"><Button size="lg" className="w-full sm:w-auto">Open the registration form</Button></Link>
              <Link href="/schools"><Button variant="outline" size="lg" className="w-full sm:w-auto">For schools</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-tejas-ivory py-16 md:py-20" aria-labelledby="recognition-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="recognition-heading" className="text-3xl font-bold tracking-tight text-tejas-ink md:text-4xl">Recognition from the 2025 English Olympiad</h2>
          <p className="mt-3 max-w-2xl text-tejas-muted">Overall first places in the 1st DHE English Olympiad. These are not results for TEJAS 2026–27.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {recognised.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-tejas-border bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">{entry.achievement.en}</p>
                <p className="mt-2 text-xl font-bold text-tejas-blue">{entry.name}</p>
                <p className="mt-1 text-sm text-tejas-muted">{entry.school}</p>
              </li>
            ))}
          </ul>
          <Link href="/hall-of-fame" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-tejas-blue hover:text-tejas-saffron">
            Hall of Fame <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <FAQSection
        items={previewFaqs}
        title="Questions schools ask first"
        subtitle="Registration, streams, and the examination format."
      />
      <div className="bg-white pb-16 text-center">
        <Link href="/faq" className="inline-flex min-h-11 items-center gap-2 font-semibold text-tejas-saffron hover:underline">
          Read all questions <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <section className="border-t border-tejas-border bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-tejas-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-tejas-saffron" aria-hidden /> Also on TEJAS</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="More TEJAS pages">
            <Link href="/research" className="font-semibold text-tejas-blue hover:text-tejas-saffron">Research</Link>
            <Link href="/innovation" className="font-semibold text-tejas-blue hover:text-tejas-saffron">Innovation</Link>
            <Link href="/editions/tejas-2026-27" className="font-semibold text-tejas-blue hover:text-tejas-saffron">This edition</Link>
            <Link href="/documents" className="font-semibold text-tejas-blue hover:text-tejas-saffron">Official documents</Link>
            <Link href="/about" className="font-semibold text-tejas-blue hover:text-tejas-saffron">About</Link>
            <Link href="/contact" className="font-semibold text-tejas-blue hover:text-tejas-saffron">Contact</Link>
          </nav>
        </div>
      </section>
    </>
  );
}
