import { createMetadata } from "@/config/seo";
import { StaffConsole } from "@/app/learn/staff/staff-console";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book inventory",
  description: "Staff inventory for TEJAS e-books and mock tests.",
  path: "/learn/staff",
  noIndex: true,
});

export default function StaffPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-tejas-blue">E-book and mock-test inventory</h1>
        <p className="mt-2 max-w-3xl text-sm text-tejas-muted">Staff can review supplied files, correct a student's stream or class, and verify payment. Publishing here changes this environment's overlay. It does not deploy the site or write production data.</p>
        <div className="mt-8"><StaffConsole /></div>
      </div>
    </section>
  );
}
