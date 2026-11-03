import { Brain, Lightbulb, Shield, BookOpen, Cpu, Users, Sparkles, Target } from "lucide-react";
import { FeatureGrid } from "@/components/shared/FeatureGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

const differentiators = [
  {
    icon: BookOpen,
    title: "English and Mathematics",
    titleHi: "अंग्रेज़ी और गणित",
    description: "Classes III–X. The syllabus has not been published.",
  },
  {
    icon: Cpu,
    title: "Future Tech",
    titleHi: "फ्यूचर टेक",
    description: "Classes VI–X only. It is an offline OMR examination, not a computer-based test.",
  },
  {
    icon: Shield,
    title: "Offline examinations",
    titleHi: "ऑफ़लाइन परीक्षा",
    description: "Question papers and OMR sheets are sent to the school. Completed sheets are couriered the same day.",
  },
  {
    icon: Target,
    title: "Preparation material",
    titleHi: "तैयारी सामग्री",
    description: "Sample papers, mock tests, and videos have not been published.",
  },
  {
    icon: Sparkles,
    title: "Announced prizes",
    titleHi: "घोषित पुरस्कार",
    description: "₹3,100, ₹2,100, ₹1,500, and ten consolation prizes of ₹500 in each class of each stream.",
  },
  {
    icon: Users,
    title: "Schools register",
    titleHi: "विद्यालय पंजीकरण",
    description: "Registration opens on 3 November 2026 and closes on 20 November 2026.",
  },
  {
    icon: Lightbulb,
    title: "School share",
    titleHi: "विद्यालय हिस्सा",
    description: "The school collects ₹150, retains ₹30, and remits ₹120. Printed books are ₹170, with ₹34 retained and ₹136 remitted.",
  },
  {
    icon: Brain,
    title: "Results",
    titleHi: "परिणाम",
    description: "The brochure prints a tentative date of 12 January 2027. The invitation says the declaration will be communicated separately.",
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
            title="TEJAS Olympiad 2026–27"
            subtitle="Talent Exploration for Junior Aspiring Scholars. Organised by the Department of Holistic Education."
          />
        </FadeIn>
        <FeatureGrid items={differentiators} columns={4} />
      </div>
    </section>
  );
}
