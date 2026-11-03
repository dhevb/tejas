import Link from "next/link";
import { notFound } from "next/navigation";
import { createMetadata } from "@/config/seo";
import { classLabel, streamLabel } from "@/lib/orders/books";
import { readEbookAccount, toPublicEbook } from "@/lib/orders/ebook";
import { ebookReferenceIsValid } from "@/lib/orders/files";
import { OFFICIAL_BANK } from "@/lib/registration/official-bank";
import { CredentialForm } from "../credential-form";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book registration recorded",
  description: "An e-book registration has been recorded. Payment is not verified and no password is shown on this page until it is collected by the registered contact.",
  path: "/ebook/register/confirmation",
  noIndex: true,
});

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function EbookConfirmation({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!ebookReferenceIsValid(reference)) notFound();
  const account = await readEbookAccount(reference);
  if (!account) notFound();
  const view = toPublicEbook(account);

  return (
    <section className="bg-tejas-ivory py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-4 rounded-3xl border border-tejas-border bg-white p-6 text-sm text-tejas-ink shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">E-book registration recorded</p>
          <h1 className="break-all text-2xl font-bold text-tejas-blue">{view.reference}</h1>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-amber-950">This registration is recorded only. Payment has not been collected on this website. {view.paymentVerified ? "Payment has been marked verified by staff." : "Payment has not been verified, so no login has been created yet."}</p>
          <p>Student: {view.studentName}</p>
          <p>Parent: {view.parentName}</p>
          <p>School: {view.schoolName}</p>
          <p>{classLabel(view.classNumber)}. Streams: {view.streams.map((stream) => streamLabel(stream)).join(", ")}.</p>
          <p>Login email: {view.email}</p>
          <p className="font-semibold">Fee recorded: {inr.format(view.feeAmount)} for this student. The fee is not charged again for each stream.</p>
          <div className="rounded-xl border border-tejas-border bg-tejas-ivory p-4">
            <h2 className="font-bold text-tejas-blue">Account for the ₹49 fee</h2>
            <p className="mt-2 text-tejas-muted">Showing this account does not mean the payment has been received.</p>
            <p className="mt-2">{OFFICIAL_BANK.accountHolder}, {OFFICIAL_BANK.bankName}, {OFFICIAL_BANK.branch}</p>
            <p>Account {OFFICIAL_BANK.accountNumber}, IFSC {OFFICIAL_BANK.ifsc}, UPI {OFFICIAL_BANK.upiId}</p>
          </div>
          <CredentialForm reference={view.reference} />
          <p>This is not an Olympiad registration and it does not order a printed book. No e-book file is available for download.</p>
          <Link href="/ebook/login" className="inline-flex font-semibold text-tejas-blue underline">E-book login</Link>
        </div>
      </div>
    </section>
  );
}
