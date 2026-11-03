import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { EbookRegisterForm } from "./ebook-register-form";

export const metadata = createMetadata({
  title: "E-book registration",
  description: "Register one student for TEJAS e-book access at ₹49. This is separate from Olympiad registration and printed book orders.",
  path: "/ebook/register",
});

export default function EbookRegisterPage() {
  return (
    <div className="bg-tejas-ivory">
      <section className="bg-tejas-blue text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">E-book</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">E-book registration</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            One student, one login, ₹49. This does not register the student for the Olympiad and it does not order a printed book.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75">
            English and Mathematics are for Classes III–X. Future Tech is for Classes VI–X. A password is created only after payment is verified. Reading stays on this website. There is no download.
          </p>
          <p className="mt-4 text-sm">
            <Link className="font-semibold text-white underline" href="/ebook/login">E-book login</Link>
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <EbookRegisterForm />
      </section>
    </div>
  );
}
