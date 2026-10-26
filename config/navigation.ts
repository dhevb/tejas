import type { LucideIcon } from "lucide-react";

export interface MegaMenuItem {
  label: string;
  labelHi?: string;
  href: string;
  description?: string;
  descriptionHi?: string;
  badge?: string;
}

export interface MegaMenuSection {
  title: string;
  titleHi?: string;
  items: MegaMenuItem[];
}

export interface NavItem {
  label: string;
  labelHi?: string;
  href: string;
  megaMenu?: MegaMenuSection[];
}

/** Platform-first navigation — TEJAS as ecosystem, Olympiads as one vertical */
export const mainNav: NavItem[] = [
  {
    label: "Olympiads",
    labelHi: "ओलंपियाड",
    href: "/olympiads",
    megaMenu: [
      {
        title: "Active Streams",
        titleHi: "सक्रिय streams",
        items: [
          { label: "TEJAS English", labelHi: "अंग्रेज़ी", href: "/olympiads/english", description: "10 December 2026", badge: "Active" },
          { label: "TEJAS Mathematics", labelHi: "गणित", href: "/olympiads/mathematics", description: "9 December 2026", badge: "Active" },
          { label: "TEJAS Future Tech", labelHi: "फ्यूचर टेक", href: "/olympiads/technology", description: "11 December 2026", badge: "Active" },
        ],
      },
      {
        title: "All Subjects",
        titleHi: "सभी विषय",
        items: [
          { label: "Science", href: "/olympiads/science", description: "Coming in future edition" },
          { label: "Hindi", href: "/olympiads/hindi", description: "Language & literature" },
          { label: "AI & Data Science", href: "/olympiads/ai", description: "Responsible AI" },
          { label: "View All", href: "/olympiads", description: "10-subject ecosystem" },
        ],
      },
    ],
  },
  {
    label: "Learning",
    labelHi: "शिक्षण",
    href: "/prepare",
    megaMenu: [
      {
        title: "Prepare",
        items: [
          { label: "Prepare Hub", href: "/prepare", description: "Topic-wise drills & strategy" },
          { label: "Mock Tests", href: "/prepare/mock-tests", description: "Full-length simulations" },
          { label: "Resources", href: "/resources", description: "Books, videos, downloads" },
        ],
      },
    ],
  },
  {
    label: "Research",
    labelHi: "अनुसंधान",
    href: "/research",
  },
  {
    label: "Innovation",
    labelHi: "नवाचार",
    href: "/innovation",
  },
  {
    label: "Resources",
    labelHi: "संसाधन",
    href: "/resources",
  },
  {
    label: "Schools",
    labelHi: "विद्यालय",
    href: "/schools",
  },
  {
    label: "Hall of Fame",
    labelHi: "हॉल ऑफ फेम",
    href: "/hall-of-fame",
  },
  {
    label: "About",
    labelHi: "परिचय",
    href: "/about",
  },
];

export const futureModules = [
  { label: "AI Mentor", labelHi: "AI मेंटर", href: "#", comingSoon: true },
  { label: "Student Dashboard", labelHi: "छात्र पोर्टल", href: "#", comingSoon: true },
  { label: "Scholarships", labelHi: "छात्रवृत्ति", href: "/scholarships", comingSoon: false },
  { label: "Rankings", labelHi: "रैंकिंग", href: "/rankings", comingSoon: false },
  { label: "National Talent Index", labelHi: "राष्ट्रीय प्रतिभा सूचकांक", href: "#", comingSoon: true },
  { label: "Mobile App", labelHi: "मोबाइल ऐप", href: "#", comingSoon: true },
] as const;

export const footerNav = {
  platform: [
    { label: "About TEJAS", href: "/about" },
    { label: "Editions", href: "/editions" },
    { label: "Roadmap", href: "/about#roadmap" },
    { label: "Research", href: "/research" },
    { label: "Innovation", href: "/innovation" },
  ],
  olympiads: [
    { label: "English", href: "/olympiads/english" },
    { label: "Mathematics", href: "/olympiads/mathematics" },
    { label: "Future Tech", href: "/olympiads/technology" },
    { label: "School registration", href: "/schools/register" },
    { label: "All Olympiads", href: "/olympiads" },
  ],
  learning: [
    { label: "Prepare Hub", href: "/prepare" },
    { label: "Mock Tests", href: "/prepare/mock-tests" },
    { label: "Resources", href: "/resources" },
    { label: "Hall of Fame", href: "/hall-of-fame" },
  ],
  support: [
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "For Schools", href: "/schools" },
    { label: "School registration", href: "/schools/register" },
  ],
  dhe: [
    { label: "DHE Website", href: "https://www.dhe.org.in", external: true },
    { label: "Shiksha Mahakumbh", href: "https://www.shikshamahakumbh.com", external: true },
  ],
} as const;
