import { createMetadata } from "@/config/seo";
import { EbookReader } from "./reader";

export const metadata = createMetadata({
  title: "E-book reading",
  description: "Read an authorised TEJAS e-book online. Download is not available.",
  path: "/ebook/read",
  noIndex: true,
});

export default function EbookReadPage() {
  return (
    <div className="bg-tejas-ivory">
      <section className="bg-tejas-blue text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">E-book</p>
          <h1 className="mt-3 text-4xl font-bold">Online reading</h1>
          <p className="mt-4 text-white/85">Only the books authorised for this login are requested. There is no download button.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <EbookReader />
      </section>
    </div>
  );
}
