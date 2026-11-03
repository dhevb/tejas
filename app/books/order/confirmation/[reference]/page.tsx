import Link from "next/link";
import { notFound } from "next/navigation";
import { createMetadata } from "@/config/seo";
import { bookReferenceIsValid } from "@/lib/orders/files";
import { classLabel, readPrintedBookOrder, streamLabel } from "@/lib/orders/books";
import { OFFICIAL_BANK } from "@/lib/registration/official-bank";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Printed book order recorded",
  description: "A printed book order has been recorded. Payment has not been collected and the books have not been dispatched.",
  path: "/books/order/confirmation",
  noIndex: true,
});

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function BookOrderConfirmation({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!bookReferenceIsValid(reference)) notFound();
  const order = await readPrintedBookOrder(reference);
  if (!order) notFound();

  return (
    <section className="bg-tejas-ivory py-12">
      <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm text-tejas-ink sm:px-6">
        <div className="space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">Printed book order recorded</p>
          <h1 className="break-all text-2xl font-bold text-tejas-blue">{order.reference}</h1>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-amber-950">This order is recorded only. Payment has not been collected. The books have not been dispatched.</p>
          <p>School: {order.schoolName}</p>
          <p>Address: {order.schoolAddress}</p>
          <p>School contact: {order.schoolEmail}, {order.schoolMobile}</p>
          <p>Contact person: {order.coordinatorName}, {order.coordinatorDesignation}, {order.coordinatorEmail}, {order.coordinatorMobile}</p>
          <h2 className="text-lg font-bold text-tejas-blue">Class and stream quantities</h2>
          <ul className="space-y-1">
            {order.lines.map((line) => (
              <li key={`${line.classNumber}-${line.stream}`}>{classLabel(line.classNumber)}, {streamLabel(line.stream)}: {line.quantity}</li>
            ))}
          </ul>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div><dt className="text-tejas-muted">Total quantity</dt><dd className="font-semibold">{order.quantity}</dd></div>
            <div><dt className="text-tejas-muted">Gross amount</dt><dd className="font-semibold">{inr.format(order.grossAmount)}</dd></div>
            <div><dt className="text-tejas-muted">School share</dt><dd className="font-semibold">{inr.format(order.schoolShare)}</dd></div>
            <div><dt className="text-tejas-muted">TEJAS payable</dt><dd className="font-semibold">{inr.format(order.amountPayable)}</dd></div>
          </dl>
          <div className="rounded-xl border border-tejas-border bg-tejas-ivory p-4">
            <h2 className="font-bold text-tejas-blue">Account for the TEJAS payable amount</h2>
            <p className="mt-2 text-tejas-muted">Showing this account does not mean the payment has been received. This order is not marked paid.</p>
            <p className="mt-2">{OFFICIAL_BANK.accountHolder}</p>
            <p>{OFFICIAL_BANK.bankName}, {OFFICIAL_BANK.branch}</p>
            <p>Account {OFFICIAL_BANK.accountNumber}</p>
            <p>IFSC {OFFICIAL_BANK.ifsc}</p>
            <p>UPI {OFFICIAL_BANK.upiId}</p>
          </div>
          <p>This confirmation is not an Olympiad registration and it does not include an e-book login.</p>
          <Link href="/books/order" className="inline-flex font-semibold text-tejas-blue underline">Back to the order form</Link>
        </div>
      </div>
    </section>
  );
}
