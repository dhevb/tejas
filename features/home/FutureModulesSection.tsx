import { ComingSoonCard } from "@/components/shared/ComingSoonCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { futureModules } from "@/config/navigation";
import { Brain, BookOpen, Smartphone, LineChart, GraduationCap, FlaskConical } from "lucide-react";

const icons = [Brain, GraduationCap, FlaskConical, BookOpen, LineChart, Smartphone];

export function FutureModulesSection() {
  return (
    <section className="tejas-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="Roadmap"
            title="The Ecosystem We're Building"
            subtitle="Phase 1 establishes the experience. These modules arrive next — without coupling the UI to backend yet."
          />
        </FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {futureModules.map((mod, i) => {
            const Icon = icons[i % icons.length];
            return (
              <FadeIn key={mod.label} delay={i * 0.05}>
                <ComingSoonCard
                  title={mod.label}
                  titleHi={mod.labelHi}
                  description="This has not been announced for TEJAS Olympiad 2026–27."
                  icon={<Icon className="h-5 w-5" aria-hidden />}
                />
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
