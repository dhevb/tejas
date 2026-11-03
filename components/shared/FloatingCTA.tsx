"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingCTAProps {
  label?: string;
  href?: string;
  className?: string;
}

export function FloatingCTA({
  label = "School registration",
  href = "/schools/register",
  className,
}: FloatingCTAProps) {
  const pathname = usePathname();
  if (pathname.startsWith("/schools/register")) return null;
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 hidden md:block",
        className
      )}
    >
      <Link href={href}>
        <Button size="lg" className="shadow-tejas-lg ring-4 ring-tejas-saffron/20">
          {label}
        </Button>
      </Link>
    </div>
  );
}
