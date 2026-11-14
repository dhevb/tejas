"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
}

export function SearchBox({
  className,
  placeholder = "Search is not available",
}: SearchBoxProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tejas-muted" aria-hidden />
      <input
        type="search"
        disabled
        placeholder={placeholder}
        aria-label="Search is not available"
        title="Search is not available"
        className="w-full rounded-xl border border-stone-200 bg-white/90 py-2 pl-10 pr-4 text-sm text-tejas-ink placeholder:text-tejas-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}
