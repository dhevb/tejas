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
    text: "Reading, vocabulary, grammar, and the confidence to express an idea clearly.",
    when: "10 December 2026",
    classes: "Classes III–X",
  },
  {
    href: "/olympiads/mathematics",
    title: "TEJAS Mathematics",
    image: "/home/stream-maths.jpg",
    alt: "Illustration of a student drawing a circle and triangle with a compass",
    text: "Number sense, geometry, patterns, and reasoning through a problem.",
    when: "9 December 2026",
    classes: "Classes III–X",
  },
  {
    href: "/olympiads/technology",
    title: "TEJAS Future Tech",
    image: "/home/stream-tech.jpg",
    alt: "Illustration of two students looking at a small classroom robot and a laptop",
    text: "Digital literacy, computational thinking, and a first look at emerging technology.",
    when: "11 December 2026",
    classes: "Classes III–X",
  },
] as const;

const reasons = [
  { icon: Compass, title: "Notice a strength", text: "A school Olympiad gives students a clear task beyond the regular test." },
  { icon: BookOpen, title: "Stay with the idea", text: "The streams ask for reading, reasoning, and careful use of what has been taught." },
  { icon: Lightbulb, title: "Try a new question", text: "Students meet problems that reward thinking, not only recall." },
  { icon: Sparkles, title: "Speak with confidence", text: "English, mathematics, and technology each ask students to show what they can do." },
  { icon: Cpu, title: "Look toward what is next", text: "Future Tech introduces digital tools, safety, and emerging technology at class level." },
  { icon: Users, title: "Take part with the school", text: "Schools register their students. Participation is organised, not an individual online signup." },
] as const;

const steps = [
  { n: "1", title: "School registration", text: "A school submits the form between 1 and 20 November 2026." },
  { n: "2", title: "Student sheet", text: "The school uploads the student sheet and chooses a stream for each student." },
  { n: "3", title: "Preparation", text: "Subject pages and published guides are available. They do not start an online test." },
  { n: "4", title: "Examination", text: "Mathematics, English, and Future Tech are held on 9, 10, and 11 December 2026." },
  { n: "5", title: "Results", text: "Results are placed in February 2027. A declaration date has not been fixed." },
] as const;

const learning = [
  { href: "/olympiads", title: "Olympiad guides", text: "What each stream covers, who may enter, and when it is examined." },
  { href: "/prepare", title: "Prepare hub", text: "Preparation notes already published. This is not a live course or a scored test." },
  { href: "/resources", title: "Resources", text: "Guides and published material for students, teachers, and parents." },
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
              Discover your talent. Explore your potential. Build your future.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-tejas-muted">
              Talent Exploration for Junior Aspiring Scholars. Three Olympiads for Classes III–X, administered by the Department of Holistic Education.
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
              ["III–X", "Participating classes", "The same range in each active stream"],
              ["₹150", "Registration fee", "Per student, per stream"],
              ["20 Nov", "Last registration day", "Opens 1 November 2026"],
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
              <p className="mt-3 text-2xl font-bold">1–20 November 2026</p>
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
            <p className="mt-4 text-lg text-white/80">Give your students an opportunity to explore their abilities, strengthen their skills and discover their potential.</p>
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
              TEJAS is organised through schools. The coordinator uploads one student sheet, selects the streams, and pays ₹150 for each student-stream to the published account. Printed books, when requested, are ₹170 each. E-book access is not for sale.
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
            <Link href="/about" className="font-semibold text-tejas-blue hover:text-tejas-saffron">About</Link>
            <Link href="/contact" className="font-semibold text-tejas-blue hover:text-tejas-saffron">Contact</Link>
          </nav>
        </div>
      </section>
    </>
  );
}
