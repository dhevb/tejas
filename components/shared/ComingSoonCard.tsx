import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ComingSoonCardProps {
  title: string;
  titleHi?: string;
  description: string;
  descriptionHi?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ComingSoonCard({
  title,
  titleHi,
  description,
  descriptionHi,
  icon,
  className,
}: ComingSoonCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 transition hover:border-tejas-saffron/40 hover:bg-white",
        className
      )}
    >
      <div className="absolute inset-0 tejas-mandala opacity-30 pointer-events-none" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tejas-blue/10 text-tejas-blue">
            {icon ?? <Sparkles className="h-5 w-5" aria-hidden />}
          </div>
          <Badge variant="outline">Not announced</Badge>
        </div>
        <h3 className="mt-4 font-bold text-tejas-ink">{title}</h3>
        {titleHi && <p className="font-hindi text-sm text-tejas-muted">{titleHi}</p>}
        <p className="mt-2 text-sm text-tejas-muted leading-relaxed">{description}</p>
        {descriptionHi && <p className="mt-1 font-hindi text-xs text-tejas-muted/80">{descriptionHi}</p>}
      </div>
    </div>
  );
}
