import Link from "next/link";
import { redirect } from "next/navigation";
import { TestRunner } from "@/app/learn/tests/[testId]/test-runner";
import { findTest, loadCatalog } from "@/lib/portal/catalog.server";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { accessFor } from "@/lib/portal/store";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Mock test",
  description: "A mock test assigned to the signed-in student.",
  path: "/learn/tests",
  noIndex: true,
});

export default async function TestPage({ params }: { params: Promise<{ testId: string }> }) {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const { testId } = await params;
  const test = findTest(loadCatalog(), testId);
  const decision = test ? await accessFor(student, test.bookId, test.id) : { ok: false as const, reason: "unknown" as const };
  return (
    <section className="py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link className="text-sm font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        {decision.ok && decision.test ? (
          <>
            <h1 className="mt-4 text-3xl font-bold text-tejas-blue">{decision.test.title}</h1>
            <p className="mt-2 text-sm text-tejas-muted">{decision.test.paperCode} · {decision.test.questionCount} questions · {decision.test.timeAllowed} · {decision.test.maximumMarks} marks · negative marking: {decision.test.negativeMarking}</p>
            <TestRunner testId={decision.test.id} />
          </>
        ) : (
          <>
            <h1 className="mt-4 text-3xl font-bold text-tejas-blue">Mock test closed</h1>
            <p className="mt-3 text-sm text-tejas-muted">This test is not open for the stream and class on this account, or it is still unpublished or unpaid.</p>
          </>
        )}
      </div>
    </section>
  );
}
