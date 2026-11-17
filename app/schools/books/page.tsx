import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { IndividualBookOrderForm, SchoolBookOrderForm } from "./book-order-form";

export const metadata = createMetadata({
  title: "Printed book orders",
  description: "Order TEJAS printed books separately from Olympiad registration.",
  path: "/schools/books",
});

export default function PrintedBooksPage() {
  return (
    <section className="bg-tejas-ivory py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">Printed books</p>
        <h1 className="mt-3 text-4xl font-bold text-tejas-blue">Printed book orders</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tejas-muted">
          A printed book is ₹170. This order is separate from Olympiad registration and is paid to the Union Bank of India book account. <Link className="font-semibold text-tejas-blue underline" href="/schools/register">School registration</Link> does not include this order.
        </p>
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold text-tejas-blue">School printed-book order</h2>
          <SchoolBookOrderForm />
          <IndividualBookOrderForm />
        </div>
      </div>
    </section>
  );
}
