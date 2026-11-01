import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { footerNav } from "@/config/navigation";
import { brand } from "@/design-system/tokens";
import { currentCycle } from "@/content/current-cycle";
import { TejasEmblem } from "@/components/brand/TejasEmblem";

export function TejasFooter() {
  return (
    <footer className="border-t border-stone-200 bg-tejas-blue text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <TejasEmblem size="md" />
              <div>
                <span className="text-xl font-bold">{brand.name}</span>
                <p className="text-xs text-tejas-gold">{brand.tagline}</p>
                <p className="mt-1 max-w-[16rem] text-xs text-white/70">{brand.fullName}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/70 leading-relaxed">
              {brand.fullName} — Bharat&apos;s National Talent Development Ecosystem by the{" "}
              {brand.parentOrg}.
            </p>
            <p className="mt-2 font-hindi text-sm text-white/60">
              भारत का राष्ट्रीय प्रतिभा विकास पारिस्थितिकी तंत्र
            </p>
            <address className="mt-5 space-y-1 text-sm not-italic text-white/75">
              <p>{currentCycle.administeredBy.en}</p>
              <p>{currentCycle.address}</p>
              <p>
                <a className="hover:text-white" href={`mailto:${currentCycle.olympiadEmail}`}>{currentCycle.olympiadEmail}</a>
              </p>
              <p>
                <a className="hover:text-white" href={`tel:${currentCycle.convener.phoneTel}`}>{currentCycle.convener.phoneDisplay}</a>
              </p>
            </address>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-tejas-gold">
              Platform
            </h3>
            <ul className="mt-4 space-y-2">
              {footerNav.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-tejas-gold">
              Learning
            </h3>
            <ul className="mt-4 space-y-2">
              {footerNav.learning.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-tejas-gold">
              Olympiads
            </h3>
            <ul className="mt-4 space-y-2">
              {footerNav.olympiads.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-tejas-gold">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              {footerNav.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-tejas-gold">
              DHE Ecosystem
            </h3>
            <ul className="mt-4 space-y-2">
              {footerNav.dhe.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/50 md:flex-row">
          <p>&copy; {new Date().getFullYear()} {brand.name} · {brand.parentOrg} · {brand.country}</p>
          <p>{brand.domain}</p>
        </div>
      </div>
    </footer>
  );
}
