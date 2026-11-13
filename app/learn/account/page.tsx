import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/app/learn/account/account-form";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { toPublicStudent } from "@/lib/portal/store";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Student account",
  description: "Account details for the TEJAS e-book portal.",
  path: "/learn/account",
  noIndex: true,
});

export default async function AccountPage() {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const view = toPublicStudent(student);
  return (
    <section className="py-12">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <Link className="text-sm font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        <h1 className="mt-4 text-3xl font-bold text-tejas-blue">Account</h1>
        <dl className="mt-4 grid gap-2 rounded-3xl border border-tejas-border bg-white p-6 text-sm shadow-tejas">
          <div><dt className="font-semibold">Stream</dt><dd>{view.streamName}</dd></div>
          <div><dt className="font-semibold">Class</dt><dd>Class {view.classLevel}</dd></div>
          <div><dt className="font-semibold">Email</dt><dd>{view.email}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-tejas-muted">Stream and class stay as registered. A correction is made by staff and written to the audit log.</p>
        <AccountForm fullName={view.fullName} parentName={view.parentName} mobile={view.mobile} schoolName={view.schoolName} />
      </div>
    </section>
  );
}
