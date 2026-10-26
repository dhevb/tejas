import { Award, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CertificatePreviewProps {
  studentName?: string;
  olympiad?: string;
  rank?: string;
  edition?: string;
  className?: string;
}

export function CertificatePreview({
  studentName = "Student Name",
  olympiad = "Mathematics Olympiad",
  rank = "National Top 100",
  edition = "TEJAS Olympiad 2026–27",
  className,
}: CertificatePreviewProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-tejas-gold/40 bg-gradient-to-br from-amber-50 via-white to-tejas-saffron-soft/20 p-8 shadow-tejas-lg",
        className
      )}
    >
      <div className="absolute inset-0 bg-mandala-accent opacity-50 pointer-events-none" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between">
          <Badge variant="gold">Official Certificate</Badge>
          <Award className="h-10 w-10 text-tejas-gold" aria-hidden />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-tejas-muted">
          Department of Holistic Education
        </p>
        <h3 className="mt-2 text-2xl font-bold text-tejas-blue">Certificate of Excellence</h3>
        <p className="mt-4 text-sm text-tejas-muted">This is to certify that</p>
        <p className="mt-1 text-xl font-bold text-tejas-ink">{studentName}</p>
        <p className="mt-4 text-sm text-tejas-muted leading-relaxed">
          has demonstrated outstanding performance in the{" "}
          <span className="font-semibold text-tejas-ink">{olympiad}</span> under the{" "}
          <span className="font-semibold text-tejas-ink">{edition}</span>.
        </p>
        <p className="mt-3 text-sm font-medium text-tejas-saffron">{rank}</p>
        <div className="mt-8 flex items-end justify-between border-t border-tejas-gold/20 pt-6">
          <div>
            <div className="h-8 w-32 border-b border-tejas-ink/30" />
            <p className="mt-1 text-xs text-tejas-muted">Authorised Signatory</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <QrCode className="h-12 w-12 text-tejas-blue/60" aria-hidden />
            <p className="text-[10px] text-tejas-muted">Verify: TEJAS-XXXX-XXXX</p>
          </div>
        </div>
      </div>
    </div>
  );
}
