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
      <PageHero eyebrow="Owner" title="Registration review" subtitle="Verified amounts are confirmed payments only. Proof submitted is not bank confirmation. Pending and rejected are shown separately." />
      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <ReviewDashboard />
        </div>
      </section>
    </>
  );
}
