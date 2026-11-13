import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { createMetadata } from "@/config/seo";
import { PORTAL_EBOOK_FEE_INR } from "@/lib/portal/model";
import { formatInr } from "@/lib/registration/fee";

export const metadata = createMetadata({
  title: "E-book and mock tests",
  description: "Student access to the TEJAS e-book and its included mock tests, limited to the registered stream and class.",
  path: "/learn",
});

export default function LearnHomePage() {
  return (
    <>
      <PageHero
        eyebrow="Student portal"
        title="E-book and mock tests"
        subtitle="A student account stores one stream and one class. After sign-in, the library shows only the e-book and mock tests mapped to that stream and class, and only after the fee is verified and the material is published."
        primaryCta={{ label: "Create a student account", href: "/learn/register" }}
        secondaryCta={{ label: "Sign in", href: "/learn/login" }}
      />
      <section className="py-14">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          <article className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <h2 className="text-lg font-bold text-tejas-blue">Stream and class</h2>
            <p className="mt-2 text-sm leading-relaxed text-tejas-muted">TEJAS English and TEJAS Mathematics use Classes 3–10. TEJAS Future Tech uses Classes 6–10. The choice is locked after registration. A later change is a staff correction with an audit note.</p>
          </article>
          <article className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <h2 className="text-lg font-bold text-tejas-blue">One fee</h2>
            <p className="mt-2 text-sm leading-relaxed text-tejas-muted">The approved price is {formatInr(PORTAL_EBOOK_FEE_INR)} for the applicable e-book and the mock tests included with it. Those mock tests are not billed again. This payment is separate from school Olympiad registration and printed-book orders.</p>
          </article>
          <article className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <h2 className="text-lg font-bold text-tejas-blue">Publication</h2>
            <p className="mt-2 text-sm leading-relaxed text-tejas-muted">Future Tech Book 1 and Book 2 are loaded for review. They stay unpublished until the organisation approves them. English and Mathematics files have not been supplied.</p>
          </article>
        </div>
        <p className="mx-auto mt-8 max-w-5xl px-4 text-sm text-tejas-muted sm:px-6">
          School coordinators continue to use <Link className="font-semibold text-tejas-blue underline" href="/schools/register">school registration</Link>. That form does not sell this e-book.
        </p>
      </section>
    </>
  );
}
