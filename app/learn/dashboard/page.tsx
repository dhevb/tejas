import Link from "next/link";
import { redirect } from "next/navigation";
import { BuyMoreStreams } from "@/app/learn/dashboard/buy-more-streams";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { dashboard } from "@/lib/portal/store";
import { formatInr } from "@/lib/registration/fee";
import { streamById, type StreamId } from "@/lib/registration/schema";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "TEJAS Olympiad student library",
  description: "TEJAS Olympiad e-book and mock tests for the signed-in student.",
  path: "/learn/dashboard",
  noIndex: true,
});

const STREAM_ORDER: StreamId[] = ["english", "mathematics", "technology"];

export default async function DashboardPage() {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const view = await dashboard(student);
  const booksByStream = STREAM_ORDER.map((streamId) => ({
    streamId,
    streamName: streamById(streamId).name,
    books: view.books.filter((book) => book.streamId === streamId),
  })).filter((group) => group.books.length > 0);
  const mockTests = view.books.flatMap((book) =>
    book.tests.map((test) => ({
      ...test,
      bookId: book.id,
      bookTitle: book.title,
      streamName: book.streamName,
      streamId: book.streamId,
      canReadBook: book.canRead,
    })),
  );
  const paidNames = view.paidStreams.map((id) => streamById(id).name);
  const pendingOptions = view.purchaseOptions.filter((item) => item.status === "pending" || item.status === "available");

  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">
        <header className="rounded-3xl border border-tejas-border bg-gradient-to-br from-tejas-ivory via-white to-white p-6 shadow-tejas sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-tejas-saffron">TEJAS Olympiad · My Learning</p>
          <h1 className="mt-2 text-3xl font-bold text-tejas-blue sm:text-4xl">{view.student.fullName}</h1>
          <p className="mt-2 text-tejas-muted">
            Class {view.student.classLevel} · {view.student.schoolName}
          </p>
          <p className="mt-3 text-sm text-tejas-ink">
            Purchased streams: {paidNames.length > 0 ? paidNames.join(", ") : "None yet"}
          </p>
          {view.student.contentQa ? (
            <p className="mt-3 rounded-2xl border border-tejas-saffron/40 bg-white/80 px-4 py-3 text-sm text-tejas-ink" role="status">
              Authorised content QA testing account. All published English, Mathematics and Future Tech e-books and mock tests are open for preview. This login is not a staff console and does not show other students&apos; records or payment details.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link className="font-semibold text-tejas-blue underline" href="/learn/account">Account details</Link>
            {view.student.contentQa ? null : <Link className="font-semibold text-tejas-blue underline" href="/learn/pay">Payment</Link>}
            <form action="/api/learn/logout" method="post"><button className="font-semibold text-tejas-blue underline" type="submit">Sign out</button></form>
          </div>
        </header>

        <section aria-labelledby="my-books-heading" className="space-y-4">
          <div>
            <h2 id="my-books-heading" className="text-2xl font-bold text-tejas-ink">My Books</h2>
            <p className="mt-1 text-sm text-tejas-muted">Organised by Olympiad stream. Future Tech Book 1 stays available with a Book 2 entitlement.</p>
          </div>
          {booksByStream.length === 0 ? (
            <article className="rounded-3xl border border-tejas-border bg-white p-6 shadow-tejas">
              <h3 className="text-xl font-bold text-tejas-ink">No e-book is assigned yet</h3>
              <p className="mt-2 text-sm leading-relaxed text-tejas-muted">
                {view.quote.status === "fee_not_approved"
                  ? `${view.student.streamName} does not yet have an approved e-book fee or a supplied file.`
                  : "Select a stream below or complete payment to open your library."}
              </p>
            </article>
          ) : booksByStream.map((group) => (
            <div key={group.streamId} className="space-y-3">
              <h3 className="text-lg font-bold text-tejas-blue">{group.streamName}</h3>
              {group.books.map((book) => (
                <article key={book.id} className="rounded-3xl border border-tejas-border bg-white p-5 shadow-tejas sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-tejas-saffron">Book {book.bookNumber}</p>
                      <h4 className="mt-1 text-xl font-bold text-tejas-ink sm:text-2xl">{book.title}</h4>
                      <p className="mt-2 text-sm text-tejas-muted">
                        Classes {book.assignedClasses.join(", ")}
                        {book.syllabusCompanion
                          ? " · Included with Future Tech entitlement for reading (no extra charge; Book 1 mock tests stay with a Book 1 purchase)"
                          : ` · Fee ${formatInr(book.amountInr)} · ${book.includedMockTests} mock tests`}
                      </p>
                    </div>
                    <p className="rounded-full border border-tejas-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-tejas-ink">
                      {book.canRead ? "Open" : book.paymentStatus === "reported" ? "Pending verification" : "Locked"}
                    </p>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div><dt className="font-semibold">Publication</dt><dd>{book.publicationStatus === "published" ? "Published" : "Awaiting approval"}</dd></div>
                    <div><dt className="font-semibold">Payment</dt><dd>{book.paymentStatus}</dd></div>
                    <div><dt className="font-semibold">Reading</dt><dd>{book.canRead ? "Available" : "Locked"}</dd></div>
                  </dl>
                  {book.canRead ? (
                    <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-tejas-blue underline" href={`/learn/books/${book.id}`}>
                      {book.paymentStatus === "verified" ? "Continue reading" : "Read this e-book"}
                    </Link>
                  ) : (
                    <p className="mt-4 text-sm text-tejas-muted">
                      {book.publicationStatus !== "published"
                        ? "This file stays closed until the organisation publishes it."
                        : "Reading opens after screenshot OCR automatic approval or staff verification."}
                      {" "}
                      {book.paymentStatus === "unpaid" || book.paymentStatus === "rejected" || book.paymentStatus === "none" ? (
                        <Link className="font-semibold text-tejas-blue underline" href="/learn/pay">Go to payment</Link>
                      ) : null}
                    </p>
                  )}
                  <h5 className="mt-6 text-base font-bold text-tejas-ink">Associated mock tests</h5>
                  <ul className="mt-2 divide-y divide-tejas-border">
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
            </div>
          ))}
        </section>

        <section aria-labelledby="mock-tests-heading" className="space-y-3">
          <div>
            <h2 id="mock-tests-heading" className="text-2xl font-bold text-tejas-ink">Mock Tests</h2>
            <p className="mt-1 text-sm text-tejas-muted">Only tests included with your valid stream entitlements are listed.</p>
          </div>
          <article className="rounded-3xl border border-tejas-border bg-white p-5 shadow-tejas sm:p-6">
            {mockTests.length === 0 ? (
              <p className="text-sm text-tejas-muted">No mock tests are linked to your library yet.</p>
            ) : (
              <ul className="divide-y divide-tejas-border">
                {mockTests.map((test) => (
                  <li key={test.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-tejas-ink">{test.title}</p>
                      <p className="text-tejas-muted">{test.streamName} · {test.bookTitle} · {test.paperCode}</p>
                      {test.attempts > 0 ? <p className="text-tejas-muted">Completed · latest {test.latestScore}/{test.latestMax}</p> : <p className="text-tejas-muted">Not started</p>}
                    </div>
                    {test.canStart ? (
                      <Link className="font-semibold text-tejas-blue underline" href={`/learn/tests/${test.id}`}>Open test</Link>
                    ) : (
                      <span className="text-tejas-muted">{test.canReadBook ? "Not open" : "Locked with book"}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        {view.student.contentQa ? null : (
          <section aria-labelledby="buy-more-heading" className="space-y-3">
            <div>
              <h2 id="buy-more-heading" className="text-2xl font-bold text-tejas-ink">Buy More Books</h2>
              <p className="mt-1 text-sm text-tejas-muted">
                One email can purchase multiple streams. Already purchased streams are not charged again. Price {formatInr(49)} per stream.
              </p>
            </div>
            <BuyMoreStreams options={view.purchaseOptions} />
            {pendingOptions.length > 0 ? (
              <p className="text-sm text-tejas-muted">
                Ready to pay? Open <Link className="font-semibold text-tejas-blue underline" href="/learn/pay">Payment</Link> to transfer the total for your selected unpaid streams.
              </p>
            ) : null}
          </section>
        )}

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
