import Link from "next/link";
import { redirect } from "next/navigation";
import { PayForm } from "@/app/learn/pay/pay-form";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { dashboard } from "@/lib/portal/store";
import { bookPublicPayment } from "@/lib/registration/official-bank";
import { formatInr } from "@/lib/registration/fee";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book payment",
  description: "Pay the e-book fee for the signed-in student's selected streams and class.",
  path: "/learn/pay",
  noIndex: true,
});

export default async function PayPage() {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const view = await dashboard(student);
  const bank = bookPublicPayment();
  const payable = view.purchaseOptions.filter((item) => item.status === "available" || item.status === "pending");
  const defaultSelected = payable.map((item) => item.streamId);
  const defaultTotal = payable.reduce((sum, item) => sum + item.amountInr, 0);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <Link className="text-sm font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        <h1 className="mt-4 text-3xl font-bold text-tejas-blue">E-book payment</h1>
        <p className="mt-2 text-sm text-tejas-muted">
          Class {view.student.classLevel}. Already purchased streams are not charged again. Future Tech Book 1 is included with a Future Tech entitlement at no extra charge.
        </p>
        {payable.length === 0 ? (
          <p className="mt-3 text-sm text-tejas-muted">
            There is no unpaid stream fee for this account. Open the dashboard to buy another eligible stream, or return to your library.
          </p>
        ) : (
          <article className="mt-6 rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <ul className="space-y-2 text-sm">
              {view.purchaseOptions.map((option) => (
                <li key={option.streamId} className="flex flex-wrap justify-between gap-2 border-b border-tejas-border py-2">
                  <span className="font-semibold text-tejas-ink">{option.streamName}</span>
                  <span className="text-tejas-muted">
                    {option.status === "purchased"
                      ? "Already purchased"
                      : option.status === "unavailable"
                        ? (option.reason ?? "Unavailable")
                        : `${formatInr(option.amountInr)} · ${option.includedMockTests} mock tests`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-tejas-muted">
              Transfer the total for the streams you select below. Default selection covers all unpaid streams ({formatInr(defaultTotal)}). {bank.message} Sending the reference does not open the material until verification succeeds.
            </p>
            <h2 className="mt-4 text-lg font-bold text-tejas-blue">{bank.heading}</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div><dt className="font-semibold">{"Account holder's name"}</dt><dd>{bank.accountHolder}</dd></div>
              <div><dt className="font-semibold">Account number</dt><dd>{bank.accountNumber}</dd></div>
              <div><dt className="font-semibold">IFSC code</dt><dd>{bank.ifsc}</dd></div>
              <div><dt className="font-semibold">Bank name</dt><dd>{bank.bankName}</dd></div>
              <div><dt className="font-semibold">Branch</dt><dd>{bank.branch}</dd></div>
            </dl>
            <PayForm
              options={payable.map((item) => ({
                streamId: item.streamId,
                streamName: item.streamName,
                amountInr: item.amountInr,
                includedMockTests: item.includedMockTests,
              }))}
              defaultSelected={defaultSelected}
            />
          </article>
        )}
      </div>
    </section>
  );
}
