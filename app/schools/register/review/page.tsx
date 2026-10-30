import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { ReviewDashboard } from "./review-dashboard";

export const metadata = createMetadata({
  title: "Registration review",
  description: "Staff review for TEJAS Olympiad school registrations.",
  path: "/schools/register/review",
  noIndex: true,
});

export default function ReviewPage() {
  return (
    <>
      <PageHero eyebrow="Staff" title="Registration review" subtitle="Payment stays pending until a staff member verifies it. Uploaded proof is not confirmation." />
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ReviewDashboard />
        </div>
      </section>
    </>
  );
}
