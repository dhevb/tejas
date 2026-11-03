import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { BookOrderForm } from "./book-order-form";

export const metadata = createMetadata({
  title: "Printed book order",
  description: "Order TEJAS printed books by class and stream. ₹170 per book, with ₹34 retained by the school and ₹136 payable to TEJAS. This is not Olympiad registration.",
  path: "/books/order",
});

export default function BookOrderPage() {
  return (
    <div className="bg-tejas-ivory">
      <section className="bg-tejas-blue text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">Printed books</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Printed book order</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            This form orders printed preparation books only. It does not register students for the Olympiad and it does not create an e-book login.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["₹170", "Price per book"],
              ["₹34", "School share"],
              ["₹136", "Payable to TEJAS"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <dt className="text-xs font-semibold uppercase tracking-widest text-tejas-gold">{label}</dt>
                <dd className="mt-1 text-2xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/75">
            The school share is at the school’s discretion. Printed books are not compulsory for Olympiad participation. Olympiad registration stays on the <Link className="font-semibold text-white underline" href="/schools/register">school registration form</Link>.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <BookOrderForm />
      </section>
    </div>
  );
}
