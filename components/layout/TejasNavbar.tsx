"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ExternalLink, Globe, User } from "lucide-react";
import { mainNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { brand } from "@/design-system/tokens";
import { TejasEmblem } from "@/components/brand/TejasEmblem";
import { MegaMenu } from "./MegaMenu";
import { SearchBox } from "@/components/shared/SearchBox";
import { useI18n } from "@/lib/i18n/context";
import { AnalyticsEvents } from "@/lib/analytics/events";

export function TejasNavbar() {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-tejas-ivory/90 backdrop-blur-md"
      )}
    >
      <div className="border-b border-stone-200/60 bg-tejas-blue px-4 py-1.5 text-center text-xs text-white/90">
        <span className="font-hindi">समग्र शिक्षा विभाग</span>
        <span className="mx-2 opacity-50">·</span>
        <span>Proudly powered by </span>
        <a
          href="https://www.dhe.org.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-tejas-gold hover:underline"
        >
          {brand.parentOrg}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>

      <nav
        className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-saffron rounded-lg"
        >
          <TejasEmblem size="md" />
          <div className="min-w-0 leading-tight">
            <span className="block text-lg font-bold tracking-wide text-tejas-blue">{brand.name}</span>
            <span className="text-xs text-tejas-muted xl:hidden 2xl:block">{brand.tagline}</span>
          </div>
        </Link>

        <div className="hidden max-w-sm flex-1 justify-center 2xl:flex">
          <SearchBox className="w-full max-w-xs" />
        </div>

        <div className="hidden items-center gap-0.5 xl:flex">
          {mainNav.map((item) =>
            item.megaMenu ? (
              <MegaMenu
                key={item.href}
                item={item}
                isOpen={activeMega === item.label}
                onOpen={() => setActiveMega(item.label)}
                onClose={() => setActiveMega(null)}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors xl:px-2.5 xl:text-sm 2xl:px-3",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "text-tejas-saffron bg-tejas-saffron-soft/50"
                    : "text-tejas-ink hover:text-tejas-saffron"
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-tejas-muted hover:text-tejas-ink"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" aria-hidden />
            {locale === "en" ? "हिं" : "EN"}
          </button>
          <Button variant="ghost" size="sm" disabled title="Login coming soon" aria-label="Login">
            <User className="h-4 w-4" aria-hidden />
          </Button>
          <Link href="/prepare/mock-tests">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              Mock Test
            </Button>
          </Link>
          <Link href="/#register" onClick={() => AnalyticsEvents.registerClick("navbar")}>
            <Button size="sm" className="whitespace-nowrap" title="Registration portal opening in Phase 4">
              Register
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-tejas-ink xl:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-stone-200 bg-white px-4 py-4 xl:hidden">
          <SearchBox className="mb-4" />
          <div className="flex flex-col gap-1">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-medium",
                    active ? "bg-tejas-saffron-soft text-tejas-saffron" : "text-tejas-ink hover:bg-tejas-saffron-soft"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/prepare/mock-tests" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                Mock Test
              </Button>
            </Link>
            <Link href="/#register" onClick={() => { setOpen(false); AnalyticsEvents.registerClick("navbar"); }}>
              <Button size="sm" className="w-full" title="Registration portal opening in Phase 4">
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
