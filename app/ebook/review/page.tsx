import { createMetadata } from "@/config/seo";
import { EbookVerifyForm } from "./verify-form";

export const metadata = createMetadata({
  title: "E-book payment review",
  description: "Staff verification for a separate e-book registration.",
  path: "/ebook/review",
  noIndex: true,
});

export default function EbookReviewPage() {
  return (
    <div className="bg-tejas-ivory">
      <section className="bg-tejas-blue text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">Staff</p>
          <h1 className="mt-3 text-4xl font-bold">E-book payment review</h1>
          <p className="mt-4 text-white/85">Verify one e-book registration. This page does not change Olympiad payments or printed book orders.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <EbookVerifyForm />
      </section>
    </div>
  );
}
