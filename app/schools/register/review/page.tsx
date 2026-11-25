import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { ReviewDashboard } from "./review-dashboard";

export const metadata = createMetadata({
  title: "Registration review",
  description: "Owner review for TEJAS Olympiad school registrations.",
  path: "/schools/register/review",
  noIndex: true,
});

export default function ReviewPage() {
  return (
    <>
      <PageHero eyebrow="Owner" title="Registration review" subtitle="Confirmed gross, school share and TEJAS share are shown separately from saved fee fields. Proof submitted is not bank confirmation. Pending, rejected and refund/adjustment are never counted as received." />
      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <ReviewDashboard />
        </div>
      </section>
    </>
  );
}
