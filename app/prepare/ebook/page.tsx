import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import Link from "next/link";

export const metadata = createMetadata({
  title: "E-book",
  description: "E-book registration and online reading are separate from Olympiad registration. The fee is ₹49 per student.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="E-book registration and reading"
        subtitle="This is separate from Olympiad school registration and from printed book orders. The fee is ₹49 per student. A login is created only after payment is verified."
        primaryCta={{ label: "Register", href: "/ebook/register" }}
        secondaryCta={{ label: "E-book login", href: "/ebook/login" }}
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm leading-relaxed text-tejas-ink sm:px-6">
          <p>English and Mathematics are for Classes III–X. Future Tech is for Classes VI–X. The reading page shows only the streams authorised for that student.</p>
          <p>No e-book file has been supplied. The reading page does not offer a download, and it does not publish a file address. Payment recorded on the registration page is not the same as a verified payment.</p>
          <p><Link href="/books/order" className="font-semibold text-tejas-blue underline">Printed book orders</Link> use a different form and a different price.</p>
        </div>
      </section>
    </>
  );
}
