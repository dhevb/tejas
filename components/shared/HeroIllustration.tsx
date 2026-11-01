import { cn } from "@/lib/utils";
import { TejasEmblem } from "@/components/brand/TejasEmblem";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-square max-w-lg", className)}>
      <div className="absolute inset-0 rounded-full tejas-mandala opacity-40" aria-hidden />
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <TejasEmblem size="hero" className="shadow-tejas-lg ring-4 ring-white" />
      </div>
    </div>
  );
}
