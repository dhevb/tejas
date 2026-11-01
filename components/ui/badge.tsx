import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gold" | "success" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-tejas-saffron-soft text-tejas-saffron-dark",
    gold: "bg-tejas-gold/15 text-tejas-gold-dark",
    success: "bg-emerald-50 text-tejas-emerald",
    outline: "border border-stone-300 text-tejas-muted bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
