import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { IndividualRegistrationForm } from "./individual-form";

export const metadata = createMetadata({
  title: "Individual student registration",
  description: "Register one student for TEJAS Olympiad 2026–27 without a school representative.",
  path: "/schools/register/individual",
});

export default function IndividualRegistrationPage() {
  return (
    <section className="bg-tejas-ivory py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">TEJAS Olympiad 2026–27</p>
        <h1 className="mt-3 text-4xl font-bold text-tejas-blue">Individual Student Registration</h1>
        <p className="mt-3 text-sm text-tejas-muted"><Link className="font-semibold text-tejas-blue underline" href="/schools/register">School registration</Link> is a separate form.</p>
        <div className="mt-8">
          <IndividualRegistrationForm />
        </div>
      </div>
    </section>
  );
}
