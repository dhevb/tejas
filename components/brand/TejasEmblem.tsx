import { cn } from "@/lib/utils";

interface TejasEmblemProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
}

const sizes = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-56 w-56",
  hero: "h-44 w-44",
};

/** Official TEJAS seal. The image file is used as supplied; the circle is only a crop of its white canvas. */
export function TejasEmblem({ size = "md", className }: TejasEmblemProps) {
  return (
    <img
      src="/brand/tejas-logo.jpg"
      alt="TEJAS logo"
      width={806}
      height={805}
      className={cn("shrink-0 rounded-full object-cover shadow-sm ring-1 ring-tejas-gold/50", sizes[size], className)}
    />
  );
}
