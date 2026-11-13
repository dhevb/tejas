import Link from "next/link";
import { redirect } from "next/navigation";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { readOwnAttempt } from "@/lib/portal/store";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Mock test result",
  description: "Result for one mock-test attempt.",
  path: "/learn/attempts",
  noIndex: true,
});

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const { attemptId } = await params;
  const result = await readOwnAttempt(student.id, attemptId);
  if (!result) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-tejas-blue">Result not available</h1>
          <p className="mt-3 text-sm text-tejas-muted">This attempt is not on this account.</p>
          <Link className="mt-4 inline-flex font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        </div>
      </section>
    );
  }
  return (
    <section className="py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link className="text-sm font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        <h1 className="mt-4 text-3xl font-bold text-tejas-blue">Score {result.attempt.score}/{result.attempt.maxScore}</h1>
        <ol className="mt-6 space-y-4">
          {result.questions.map((question) => {
            const explanation = result.explanations.find((item) => item.number === question.number);
            return (
              <li key={question.number} className="rounded-2xl border border-tejas-border bg-white p-4 text-sm">
                <p className="font-semibold">Question {question.number} · {question.right ? "Correct" : "Not correct"}</p>
                <p className="mt-1 text-tejas-muted">Your answer: {question.chosen ?? "Not answered"} · Answer key: {question.correct}</p>
                {explanation?.explanation ? <p className="mt-2">{explanation.explanation}</p> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
