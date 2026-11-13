import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { createMetadata } from "@/config/seo";
import { LoginForm } from "@/app/learn/login/login-form";

export const metadata = createMetadata({
  title: "Student sign in",
  description: "Sign in to the TEJAS e-book and mock-test portal.",
  path: "/learn/login",
});

export default function LoginPage() {
  return (
    <>
      <PageHero eyebrow="Student portal" title="Sign in" subtitle="The library opens the stream and class saved on this account." />
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <LoginForm />
          <p className="mx-auto mt-4 max-w-md text-sm text-tejas-muted">New student? <Link className="font-semibold text-tejas-blue underline" href="/learn/register">Create an account</Link></p>
        </div>
      </section>
    </>
  );
}
