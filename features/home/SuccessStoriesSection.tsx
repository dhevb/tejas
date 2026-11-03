import { SuccessStoryCard } from "@/components/shared/SuccessStoryCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

const stories: {
  name: string;
  achievement: string;
  school: string;
  state: string;
  quote?: string;
}[] = [];

export function SuccessStoriesSection() {
  return (
    <section className="tejas-section bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="Stories"
            title="No success stories published"
            subtitle="TEJAS Olympiad 2026–27 has not published a student story, quotation, or national award."
          />
        </FadeIn>
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.08}>
              <SuccessStoryCard {...s} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
