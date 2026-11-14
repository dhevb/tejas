import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import Link from "next/link";
import { publicBookPublication } from "@/lib/portal/store";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book access",
  description: "Future Tech e-books open from the student portal after payment is verified. English and Mathematics files have not been supplied.",
  path: "/prepare/ebook",
});

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function classRange(classes: number[]): string {
  const sorted = [...classes].sort((a, b) => a - b);
  const label = (value: number) => ROMAN[value] ?? String(value);
  if (sorted.length === 0) return "class range not recorded";
  if (sorted.length === 1) return `Class ${label(sorted[0])}`;
  return `Classes ${label(sorted[0])}–${label(sorted[sorted.length - 1])}`;
}

export default async function EbookPage() {
  const publication = await publicBookPublication();

  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="Student e-book access"
        subtitle="E-books and their mock tests open from the student portal for the stream and class saved at registration. School registration does not charge the e-book fee."
        primaryCta={{ label: "Open the student portal", href: "/learn" }}
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm leading-relaxed text-tejas-ink sm:px-6">
          {publication.ok ? (
            <ul className="space-y-3">
              {publication.books.map((book) => (
                <li key={book.id}>
                  Future Tech Book {book.number} ({classRange(book.classes)}) is {book.published ? "published" : "awaiting organisational approval"}.
                  {" "}
                  {book.publishedTests} of {book.totalTests} included mock tests are published.
                  {book.published ? ` Reading opens in the student portal after the ₹${publication.feeInr} payment for that book is verified.` : " It is not offered for reading while it awaits approval."}
                </li>
              ))}
            </ul>
          ) : (
            <p>The publication status could not be read. This page does not guess which books are published.</p>
          )}
          <p>English and Mathematics e-book files have not been supplied. Unpublished material is not offered as if it were ready.</p>
          <p>The server checks the account stream, class, publication status, and entitlement on every request.</p>
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">School registration</Link>
        </div>
      </section>
    </>
  );
}
