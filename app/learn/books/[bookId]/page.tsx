import Link from "next/link";
import { redirect } from "next/navigation";
import { BookReader } from "@/app/learn/books/[bookId]/reader";
import { createMetadata } from "@/config/seo";
import { currentStudent } from "@/lib/portal/current";
import { accessFor } from "@/lib/portal/store";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Read e-book",
  description: "Secure reading for the signed-in student's e-book.",
  path: "/learn/books",
  noIndex: true,
});

const REASON: Record<string, string> = {
  unpublished: "This e-book is awaiting organisational approval.",
  unpaid: "Payment for this e-book has not been verified.",
  wrong_stream: "This e-book belongs to a different stream.",
  wrong_class: "This e-book is mapped to a different class.",
  unknown: "This e-book is not available for this account.",
  not_checked: "This material has not completed source checking.",
};

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const student = await currentStudent();
  if (!student) redirect("/learn/login");
  const { bookId } = await params;
  const decision = await accessFor(student, bookId);
  return (
    <section className="py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link className="text-sm font-semibold text-tejas-blue underline" href="/learn/dashboard">Back to the library</Link>
        {decision.ok ? (
          <>
            <h1 className="mt-4 text-3xl font-bold text-tejas-blue">{decision.book.title}</h1>
            <p className="mt-2 text-sm text-tejas-muted">Shown for {decision.book.streamName}, classes {decision.book.assignedClasses.join(", ")}.</p>
            <div className="mt-6"><BookReader bookId={decision.book.id} title={decision.book.title} /></div>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-3xl font-bold text-tejas-blue">E-book closed</h1>
            <p className="mt-3 text-sm text-tejas-muted">{REASON[decision.reason]}</p>
          </>
        )}
      </div>
    </section>
  );
}
