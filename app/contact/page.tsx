import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";
import { Mail, MapPin, Phone } from "lucide-react";
import { brand } from "@/design-system/tokens";
import { currentCycle } from "@/content/current-cycle";

export const metadata = createMetadata({
  title: "Contact",
  description: "Contact TEJAS — Bharat's National Talent Development Ecosystem.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in Touch"
        subtitle="Questions about olympiads, school partnerships, or the TEJAS platform."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <FadeIn>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <Mail className="h-6 w-6 text-tejas-saffron shrink-0" aria-hidden />
                  <div>
                    <h3 className="font-bold text-tejas-ink">Email</h3>
                    <p className="text-tejas-muted">{currentCycle.olympiadEmail}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="h-6 w-6 text-tejas-saffron shrink-0" aria-hidden />
                  <div>
                    <h3 className="font-bold text-tejas-ink">Phone</h3>
                    <p className="text-tejas-muted">{currentCycle.convener.phoneDisplay}</p>
                    <p className="text-sm text-tejas-muted">{currentCycle.convener.name}, {currentCycle.convener.titles.join("; ")}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-tejas-saffron shrink-0" aria-hidden />
                  <div>
                    <h3 className="font-bold text-tejas-ink">Organisation</h3>
                    <p className="text-tejas-muted">{brand.parentOrg}</p>
                    <p className="text-sm text-tejas-muted">{currentCycle.address}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <form className="rounded-2xl border border-stone-200 bg-white p-8 shadow-tejas space-y-4">
                <h2 className="text-xl font-bold text-tejas-ink">Send a Message</h2>
                <p className="text-sm text-tejas-muted">Form submission is disabled in Phase 0.</p>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-tejas-ink">Name</label>
                  <input id="name" type="text" disabled className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 opacity-60" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-tejas-ink">Email</label>
                  <input id="email" type="email" disabled className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 opacity-60" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-tejas-ink">Message</label>
                  <textarea id="message" rows={4} disabled className="mt-1 w-full rounded-lg border border-stone-200 px-4 py-2 opacity-60" />
                </div>
                <button type="button" disabled className="w-full rounded-xl bg-tejas-saffron/50 py-3 text-white font-medium cursor-not-allowed">
                  Send Message — Coming Soon
                </button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
