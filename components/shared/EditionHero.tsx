"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BackgroundPattern } from "./BackgroundPattern";

interface EditionHeroProps {
  year: number;
  name: string;
  subtitle: string;
  theme?: string;
  quote?: string;
  bio: string;
  accent?: string;
  status?: "current" | "upcoming" | "past";
  className?: string;
}

export function EditionHero({
  year,
  name,
  subtitle,
  theme,
  quote,
  bio,
  accent = "#A3531C",
  status = "current",
  className,
}: EditionHeroProps) {
  return (
    <section
      className={cn("relative overflow-hidden py-20 md:py-28 text-white", className)}
      style={{ background: `linear-gradient(135deg, ${accent} 0%, #1A2B5D 100%)` }}
    >
      <BackgroundPattern variant="mandala" className="opacity-20" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="bg-white/20 text-white border-0">
              {status === "current" ? "Current Edition" : status === "past" ? "Archive" : "Upcoming"}
            </Badge>
            <p className="mt-6 text-6xl font-black opacity-90 md:text-8xl">{year}</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl lg:text-5xl">{name}</h1>
            <p className="mt-2 text-xl text-white/80">{subtitle}</p>
            {theme && <p className="mt-4 text-lg italic text-white/70">&ldquo;{theme}&rdquo;</p>}
            <p className="mt-6 max-w-xl text-white/85 leading-relaxed">{bio}</p>
            {quote && (
              <blockquote className="mt-6 border-l-4 border-white/40 pl-4 text-white/90 italic">
                {quote}
              </blockquote>
            )}
          </div>
          <div className="relative aspect-[4/3] rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-8">
              <p className="text-sm uppercase tracking-widest text-white/60">Edition Gallery</p>
              <p className="mt-2 text-2xl font-bold">Coming Soon</p>
              <p className="mt-2 text-sm text-white/70">Visual storytelling & archival media</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
