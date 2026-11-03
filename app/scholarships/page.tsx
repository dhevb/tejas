import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Scholarships",
  description: "Scholarship amounts for TEJAS Olympiad 2026–27 have not been announced.",
  path: "/scholarships",
});

export default function ScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Scholarships"
        title="Scholarships & Grants"
        subtitle="Scholarship amounts for TEJAS Olympiad 2026–27 have not been announced. The published cash prizes are on the Olympiad pages."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-tejas-muted leading-relaxed">
              The invitation lists, for each class in each stream, ₹3,100, ₹2,100, ₹1,500, and ten consolation prizes of ₹500. The school with the highest participation is recognised, and its principal receives a Certificate of Appreciation. The brochure says outstanding students will receive a gold medal, a silver medal and a bronze medal, and that every participant receives an e-certificate. The documents do not say whether the medals are in addition to the cash prizes. No separate scholarship, grant, or fellowship amount is stated in the invitation or the brochure.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
