import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";
import { programme } from "@/content/current-cycle";

export const metadata = createMetadata({
  title: "Official documents",
  description: "View and download the TEJAS Olympiad 2026–27 brochure, the invitation dated 31 October 2026, and the 2025 English Olympiad report.",
  path: "/documents",
});

const documents = [
  {
    title: "TEJAS Olympiad 2026–27 brochure",
    description: "The official brochure: streams, registration 3–30 November 2026, results 12 January 2027, cash prizes, medals and e-certificates, the 2025 legacy, and the published office address.",
    href: "/documents/tejas-olympiad-2026-27-brochure.pdf",
    file: "tejas-olympiad-2026-27-brochure.pdf",
  },
  {
    title: "Invitation dated 31 October 2026",
    description: "Letter DHE/TEJAS/26-27/03 from Sonu Agnihotri Sharma, Convener. It states the examination dates, registration from 3 to 30 November 2026, results on 12 January 2027, fees, books, cash prizes, medals and e-certificates.",
    href: "/documents/tejas-olympiad-2026-27-invitation.pdf",
    file: "tejas-olympiad-2026-27-invitation.pdf",
  },
  {
    title: "Brief report of the 1st DHE English Olympiad (2025)",
    description: "The previous report of the 2025 English Olympiad. It is not the brochure or the invitation for TEJAS Olympiad 2026–27. It records 10,040 students, 25 schools, and the 2025 prize lists.",
    href: "/documents/dhe-english-olympiad-2025-brief-report.pdf",
    file: "dhe-english-olympiad-2025-brief-report.pdf",
  },
] as const;

export default function DocumentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Official documents"
        title="Brochure, invitation, and 2025 report"
        subtitle="These are the supplied files. Open one to read it, or download the same file."
        primaryCta={{ label: "School registration", href: "/schools/register" }}
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          {documents.map((document, index) => (
            <FadeIn key={document.href} delay={index * 0.05}>
              <article className="rounded-2xl border border-tejas-border bg-white p-6 shadow-tejas">
                <h2 className="text-xl font-bold text-tejas-ink">{document.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-tejas-muted">{document.description}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tejas-blue px-5 text-sm font-semibold text-white" href={document.href} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                  <a className="inline-flex min-h-11 items-center justify-center rounded-xl border border-tejas-border px-5 text-sm font-semibold text-tejas-blue" href={document.href} download={document.file}>
                    Download
                  </a>
                </div>
              </article>
            </FadeIn>
          ))}

          <FadeIn>
            <div className="rounded-2xl border border-tejas-saffron/40 bg-tejas-saffron/5 p-6 text-sm leading-relaxed text-tejas-ink">
              <h2 className="text-lg font-bold">Confirmed programme facts</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Registration is {programme.registrationOpens} to {programme.registrationCloses} on the invitation, the brochure ({programme.brochureRegistration}), and the school form at <Link className="font-semibold text-tejas-blue underline" href="/schools/register">/schools/register</Link>.</li>
                <li>{programme.results}</li>
                <li>{programme.awardNote}</li>
                <li>The official registration channel is <Link className="font-semibold text-tejas-blue underline" href="/schools/register">/schools/register</Link>. The brochure QR opens the same school registration page.</li>
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
