import Link from "next/link";
import { redirect } from "next/navigation";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { dashboard } from "@/lib/portal/store";
import { formatInr } from "@/lib/registration/fee";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "My e-book",
  description: "E-book and mock tests for the signed-in student.",
  path: "/learn/dashboard",
  noIndex: true,
});

export default async function DashboardPage() {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const view = await dashboard(student);
  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-tejas-saffron">Student library</p>
          <h1 className="mt-2 text-3xl font-bold text-tejas-blue">{view.student.fullName}</h1>
          <p className="mt-2 text-tejas-muted">{view.student.streamName} · Class {view.student.classLevel} · {view.student.schoolName}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link className="font-semibold text-tejas-blue underline" href="/learn/account">Account details</Link>
            <Link className="font-semibold text-tejas-blue underline" href="/learn/pay">Payment</Link>
            <form action="/api/learn/logout" method="post"><button className="font-semibold text-tejas-blue underline" type="submit">Sign out</button></form>
          </div>
        </header>
        {view.books.length === 0 ? (
          <article className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <h2 className="text-xl font-bold text-tejas-ink">No e-book is assigned</h2>
            <p className="mt-2 text-sm leading-relaxed text-tejas-muted">
              {view.quote.status === "fee_not_approved"
                ? `${view.student.streamName} does not yet have an approved e-book fee or a supplied file. Nothing from another stream is shown here.`
                : "No published or prepared book is mapped to this class. Nothing from another class is shown here."}
            </p>
          </article>
        ) : view.books.map((book) => (
          <article key={book.id} className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <p className="text-sm font-semibold text-tejas-saffron">Book {book.bookNumber}</p>
            <h2 className="mt-1 text-2xl font-bold text-tejas-blue">{book.title}</h2>
            <p className="mt-2 text-sm text-tejas-muted">Assigned classes {book.assignedClasses.join(", ")}. Fee {formatInr(book.amountInr)}, including {book.includedMockTests} mock tests at no extra charge.</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="font-semibold">Publication</dt><dd>{book.publicationStatus === "published" ? "Published" : "Awaiting approval"}</dd></div>
              <div><dt className="font-semibold">Payment</dt><dd>{book.paymentStatus}</dd></div>
              <div><dt className="font-semibold">Reading</dt><dd>{book.canRead ? "Open" : "Locked"}</dd></div>
            </dl>
            {book.canRead ? (
              <Link className="mt-4 inline-flex font-semibold text-tejas-blue underline" href={`/learn/books/${book.id}`}>Read this e-book</Link>
            ) : (
              <p className="mt-4 text-sm text-tejas-muted">{book.publicationStatus !== "published" ? "This file stays closed until the organisation publishes it." : "Reading opens after staff verify the payment."} {book.paymentStatus === "unpaid" || book.paymentStatus === "rejected" ? <Link className="font-semibold text-tejas-blue underline" href="/learn/pay">Go to payment</Link> : null}</p>
            )}
            <h3 className="mt-6 text-lg font-bold">Mock tests</h3>
            <ul className="mt-3 divide-y divide-tejas-border">
              {book.tests.map((test) => (
                <li key={test.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-tejas-ink">{test.title}</p>
                    <p className="text-tejas-muted">{test.paperCode} · {test.questionCount} questions · {test.publicationStatus === "published" ? "Published" : "Not published"}</p>
                    {test.attempts > 0 ? <p className="text-tejas-muted">Latest score {test.latestScore}/{test.latestMax}</p> : null}
                  </div>
                  {test.canStart ? (
                    <Link className="font-semibold text-tejas-blue underline" href={`/learn/tests/${test.id}`}>Open test</Link>
                  ) : (
                    <span className="text-tejas-muted">Not open</span>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {view.history.length > 0 ? (
          <article className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
            <h2 className="text-xl font-bold">Your attempts</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {view.history.map((attempt) => (
                <li key={attempt.id}>
                  {attempt.status === "submitted" ? (
                    <Link className="font-semibold text-tejas-blue underline" href={`/learn/attempts/${attempt.id}`}>{attempt.testId}: {attempt.score}/{attempt.maxScore}</Link>
                  ) : (
                    <span>{attempt.testId}: {attempt.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
