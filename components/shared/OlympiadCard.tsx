import Link from "next/link";
import {
  Calculator,
  FlaskConical,
  Cpu,
  BookOpen,
  Languages,
  Scroll,
  Globe,
  Brain,
  Code,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, LucideIcon> = {
  calculator: Calculator,
  flask: FlaskConical,
  cpu: Cpu,
  "book-open": BookOpen,
  languages: Languages,
  scroll: Scroll,
  globe: Globe,
  brain: Brain,
  code: Code,
  lightbulb: Lightbulb,
};

interface OlympiadCardProps {
  slug: string;
  name: string;
  nameHi?: string;
  description: string;
  icon: string;
  color: string;
  grades: string;
  registrationOpen?: boolean;
  status?: "active" | "coming-soon" | "past";
  className?: string;
}

export function OlympiadCard({
  slug,
  name,
  nameHi,
  description,
  icon,
  color,
  grades,
  registrationOpen = true,
  status,
  className,
}: OlympiadCardProps) {
  const Icon = iconMap[icon] ?? BookOpen;

  return (
    <Link
      href={`/olympiads/${slug}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-stone-200/80 bg-white p-6 shadow-tejas transition-all hover:-translate-y-1 hover:shadow-tejas-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        {status === "active" ? (
          <Badge variant="success">Active</Badge>
        ) : status === "coming-soon" ? (
          <Badge variant="outline">Not announced</Badge>
        ) : registrationOpen ? (
          <Badge variant="success">Open</Badge>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg font-bold text-tejas-ink group-hover:text-tejas-saffron transition-colors">
        {name}
      </h3>
      {nameHi && (
        <p className="font-hindi text-sm text-tejas-muted">{nameHi}</p>
      )}
      <p className="mt-2 flex-1 text-sm text-tejas-muted leading-relaxed">
        {description}
      </p>
      <p className="mt-4 text-xs font-medium text-tejas-blue">{grades}</p>
    </Link>
  );
}
