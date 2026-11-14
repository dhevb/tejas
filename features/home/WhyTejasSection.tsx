import { Brain, Lightbulb, Shield, BookOpen, Cpu, Users, Target } from "lucide-react";
import { FeatureGrid } from "@/components/shared/FeatureGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

const differentiators = [
  {
    icon: BookOpen,
    title: "Bharatiya Knowledge + Modern Education",
    titleHi: "भारतीय ज्ञान + आधुनिक शिक्षा",
    description: "Contemporary excellence rooted in ethical values, culture, character, and life skills.",
  },
  {
    icon: Brain,
    title: "Concept-Based Assessment",
    titleHi: "अवधारणा-आधारित मूल्यांकन",
    description: "Logical reasoning, creativity, problem-solving — not rote memorization.",
  },
  {
    icon: Shield,
    title: "Secure Online Examinations",
    titleHi: "सुरक्षित ऑनलाइन परीक्षा",
    description: "Technology-enabled integrity with transparent, fair evaluation processes.",
  },
  {
    icon: Target,
    title: "Comprehensive Preparation",
    titleHi: "समग्र तैयारी",
    description: "Mock tests, sample papers, concept videos, and performance materials.",
  },
  {
    icon: Lightbulb,
    title: "Innovation & Entrepreneurship",
    titleHi: "नवाचार और उद्यमिता",
    description: "Inspiring job creators — not merely job seekers.",
  },
  {
    icon: Users,
    title: "National Movement",
    titleHi: "राष्ट्रीय आंदोलन",
    description: "Beyond examinations — talent, research, innovation, and nation building.",
  },
  {
    icon: Cpu,
    title: "Future-Ready Ecosystem",
    titleHi: "भविष्य-तैयार पारिस्थितिकी तंत्र",
    description: "AI learning, digital credentials, and research pathways — coming soon.",
  },
];

export function WhyTejasSection() {
  return (
    <section className="tejas-section relative overflow-hidden">
      <div className="absolute inset-0 tejas-pattern opacity-50 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="Why TEJAS"
            title="Not Just an Olympiad — a National Movement"
            subtitle="Gurukul clarity × Nalanda wisdom × modern technology — for Bharat's next generation."
          />
        </FadeIn>
        <FeatureGrid items={differentiators} columns={4} />
      </div>
    </section>
  );
}
