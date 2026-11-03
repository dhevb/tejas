import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { EbookLoginForm } from "./ebook-login-form";

export const metadata = createMetadata({
  title: "E-book login",
  description: "Sign in to read a TEJAS e-book online. This login is only for e-book access.",
  path: "/ebook/login",
});

export default function EbookLoginPage() {
  return (
    <div className="bg-tejas-ivory">
      <section className="bg-tejas-blue text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">E-book</p>
          <h1 className="mt-3 text-4xl font-bold">E-book login</h1>
          <p className="mt-4 text-white/85">Use the email and password issued after payment verification. This page does not register a school for the Olympiad.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <EbookLoginForm />
        <p className="text-sm text-tejas-muted">
          No login yet? <Link className="font-semibold text-tejas-blue underline" href="/ebook/register">Register for an e-book</Link>.
        </p>
      </section>
    </div>
  );
}
