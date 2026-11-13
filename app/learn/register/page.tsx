import { PageHero } from "@/components/shared/PageHero";
import { createMetadata } from "@/config/seo";
import { RegisterForm } from "@/app/learn/register/register-form";

export const metadata = createMetadata({
  title: "Student registration",
  description: "Register a TEJAS student account with a stream and class.",
  path: "/learn/register",
});

export default function RegisterPage() {
  return (
    <>
      <PageHero eyebrow="Student portal" title="Create a student account" subtitle="Stream and class are required. They are stored with the account and are not edited from this login afterwards." />
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <RegisterForm />
        </div>
      </section>
    </>
  );
}
