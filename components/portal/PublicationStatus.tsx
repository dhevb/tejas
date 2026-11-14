import { publicBookPublication } from "@/lib/portal/store";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function classRange(classes: number[]): string {
  const sorted = [...classes].sort((a, b) => a - b);
  const label = (value: number) => ROMAN[value] ?? String(value);
  if (sorted.length === 0) return "class range not recorded";
  if (sorted.length === 1) return `Class ${label(sorted[0])}`;
  return `Classes ${label(sorted[0])}–${label(sorted[sorted.length - 1])}`;
}

/** Reads the publication table. It does not guess, and it does not return student or payment rows. */
export async function PublicationStatus() {
  const publication = await publicBookPublication();
  if (!publication.ok) {
    return <p>The publication status could not be read. This page does not guess which books are published.</p>;
  }
  return (
    <ul className="space-y-3">
      {publication.books.map((book) => (
        <li key={book.id}>
          Future Tech Book {book.number}, {book.title} ({classRange(book.classes)}) is {book.published ? "published" : "awaiting organisational approval"}.
          {" "}
          {book.publishedTests} of {book.totalTests} included mock tests are published.
          {book.published ? ` Reading opens in the student portal after the ₹${publication.feeInr} payment for that book is verified.` : " It is not offered for reading while it awaits approval."}
        </li>
      ))}
    </ul>
  );
}
