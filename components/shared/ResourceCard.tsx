import Link from "next/link";
import { FileText, Video, BookOpen, PenLine, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types";

interface ResourceCardProps {
  resource: Resource;
  className?: string;
}

const typeIcons: Record<Resource["type"], typeof FileText> = {
  pdf: FileText,
  video: Video,
  article: BookOpen,
  practice: PenLine,
  book: BookOpen,
};

export function ResourceCard({ resource, className }: ResourceCardProps) {
  const Icon = typeIcons[resource.type] ?? FileText;
  const unavailable = !resource.href || resource.href === "#";
  const classNameForCard = cn(
    "flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-tejas",
    !unavailable && "group transition hover:-translate-y-0.5 hover:shadow-tejas-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron",
    className
  );
  const body = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tejas-blue/10 text-tejas-blue">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {unavailable ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-tejas-muted">Not available</span>
        ) : (
          <ArrowUpRight className="h-5 w-5 text-tejas-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
        )}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-tejas-saffron">
        {resource.subject}
      </p>
      <h3 className={cn("mt-1 font-bold text-tejas-ink", !unavailable && "transition-colors group-hover:text-tejas-saffron")}>
        {resource.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-tejas-muted">{resource.description}</p>
    </>
  );

  if (unavailable) {
    return <div className={classNameForCard}>{body}</div>;
  }

  return (
    <Link href={resource.href} className={classNameForCard}>
      {body}
    </Link>
  );
}
