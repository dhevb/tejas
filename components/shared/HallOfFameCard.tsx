import { Medal, Trophy, School as SchoolIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { HallOfFameEntry } from "@/types";

interface HallOfFameCardProps {
  entry: HallOfFameEntry;
  className?: string;
}

const categoryIcons: Record<string, typeof Trophy> = {
  national: Trophy,
  state: Medal,
  school: SchoolIcon,
};

export function HallOfFameCard({ entry, className }: HallOfFameCardProps) {
  const Icon = categoryIcons[entry.category] ?? Trophy;

  return (
    <article
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-6 shadow-tejas transition hover:-translate-y-0.5 hover:shadow-tejas-lg",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tejas-gold/15 text-tejas-gold-dark">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <Badge variant="gold">#{entry.rank}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-bold text-tejas-ink">{entry.name}</h3>
      <p className="text-sm font-medium text-tejas-saffron">{entry.achievement}</p>
      <dl className="mt-4 space-y-1 text-sm text-tejas-muted">
        <div className="flex justify-between">
          <dt>Olympiad</dt>
          <dd className="font-medium text-tejas-ink">{entry.olympiad}</dd>
        </div>
        {entry.state && (
          <div className="flex justify-between">
            <dt>State</dt>
            <dd>{entry.state}</dd>
          </div>
        )}
        {entry.school && entry.category !== "school" && (
          <div className="flex justify-between gap-4">
            <dt>School</dt>
            <dd className="text-right">{entry.school}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Year</dt>
          <dd>{entry.year}</dd>
        </div>
      </dl>
    </article>
  );
}
