import Link from "next/link";
import { redirect } from "next/navigation";
import { PayForm } from "@/app/learn/pay/pay-form";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { loadCatalog } from "@/lib/portal/catalog.server";
import { quoteFee } from "@/lib/portal/model";
import { OFFICIAL_BANK } from "@/lib/registration/official-bank";
import { formatInr } from "@/lib/registration/fee";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book payment",
  description: "Pay the e-book fee for the signed-in student's stream and class.",
  path: "/learn/pay",
  noIndex: true,
});

export default async function PayPage() {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const quote = quoteFee(loadCatalog(), student.streamId, student.classLevel);
  return (
    <section className="py-12">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <Link className="text-sm font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        <h1 className="mt-4 text-3xl font-bold text-tejas-blue">E-book payment</h1>
        {quote.status !== "payable" ? (
          <p className="mt-3 text-sm text-tejas-muted">{quote.status === "fee_not_approved" ? quote.reason : "No e-book fee applies to this account."}</p>
        ) : (
          <article className="mt-6 rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <p className="text-sm leading-relaxed text-tejas-muted">Transfer {formatInr(quote.amountInr)} for the e-book and its {quote.includedMockTests} mock tests. The mock tests are included. This payment is separate from Olympiad registration and printed-book orders. Sending the reference does not open the material.</p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div><dt className="font-semibold">Account holder</dt><dd>{OFFICIAL_BANK.accountHolder}</dd></div>
              <div><dt className="font-semibold">Account number</dt><dd>{OFFICIAL_BANK.accountNumber}</dd></div>
              <div><dt className="font-semibold">IFSC</dt><dd>{OFFICIAL_BANK.ifsc}</dd></div>
              <div><dt className="font-semibold">UPI</dt><dd>{OFFICIAL_BANK.upiId}</dd></div>
              <div><dt className="font-semibold">Bank</dt><dd>{OFFICIAL_BANK.bankName}, {OFFICIAL_BANK.branch}</dd></div>
            </dl>
            <PayForm />
          </article>
        )}
      </div>
    </section>
  );
}
