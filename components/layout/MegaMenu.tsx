"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/config/navigation";

interface MegaMenuProps {
  item: NavItem;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function MegaMenu({ item, isOpen, onOpen, onClose }: MegaMenuProps) {
  const pathname = usePathname();
  const sectionActive =
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    item.megaMenu?.some((section) => section.items.some((sub) => pathname === sub.href)) === true;

  if (!item.megaMenu?.length) {
    return (
      <Link
        href={item.href}
        className="rounded-lg px-3 py-2 text-sm font-medium text-tejas-ink transition hover:text-tejas-saffron"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition xl:px-2.5 xl:text-sm 2xl:px-3",
          isOpen || sectionActive ? "bg-tejas-saffron-soft/70 text-tejas-saffron" : "text-tejas-ink hover:text-tejas-saffron"
        )}
        aria-expanded={isOpen}
        onClick={() => (isOpen ? onClose() : onOpen())}
      >
        {item.label}
        <ChevronDown className={cn("h-4 w-4 transition", isOpen && "rotate-180")} aria-hidden />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-[520px] rounded-2xl border border-stone-200 bg-white p-6 shadow-tejas-lg">
            <div className="grid gap-8 sm:grid-cols-2">
              {item.megaMenu.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">
                    {section.title}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {section.items.map((sub) => (
                      <li key={sub.href + sub.label}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          className="group block rounded-lg px-2 py-2 transition hover:bg-tejas-saffron-soft/40"
                        >
                          <span className="flex items-center gap-2 font-medium text-tejas-ink group-hover:text-tejas-saffron">
                            {sub.label}
                            {sub.badge && <Badge className="text-[10px] py-0">{sub.badge}</Badge>}
                          </span>
                          {sub.description && (
                            <span className="block text-xs text-tejas-muted">{sub.description}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-stone-100 pt-4">
              <Link
                href={item.href}
                onClick={onClose}
                className="text-sm font-semibold text-tejas-saffron hover:underline"
              >
                View all {item.label} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
