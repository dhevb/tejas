import { MapPin, Users, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { School } from "@/types";

interface SchoolCardProps {
  school: School;
  className?: string;
}

const tierLabels = {
  platinum: "Platinum Partner",
  gold: "Gold Partner",
  silver: "Silver Partner",
};

export function SchoolCard({ school, className }: SchoolCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-6 shadow-tejas",
        className
      )}
    >
      <Badge
        variant={school.tier === "platinum" ? "gold" : "outline"}
        className="mb-4"
      >
        {tierLabels[school.tier]}
      </Badge>
      <h3 className="text-lg font-bold text-tejas-ink">{school.name}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-tejas-muted">
        <MapPin className="h-4 w-4" aria-hidden />
        {school.city}, {school.state}
      </p>
      <div className="mt-4 flex gap-6 text-sm">
        <div className="flex items-center gap-2 text-tejas-muted">
          <Users className="h-4 w-4" aria-hidden />
          <span>{school.students.toLocaleString()} students</span>
        </div>
        <div className="flex items-center gap-2 text-tejas-gold-dark">
          <Medal className="h-4 w-4" aria-hidden />
          <span>{school.medals} medals</span>
        </div>
      </div>
    </article>
  );
}
