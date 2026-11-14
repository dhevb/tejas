import type { ResourceItem } from "@/content/types";

function ls(en: string, hi: string) {
  return { en, hi };
}

/**
 * Only destinations that exist are listed.
 * Placeholder downloads, invented question counts, and sample certificates are not shown as available files.
 */
export const resourceRegistry: ResourceItem[] = [
  {
    id: "prac-mock-all",
    title: ls("Mock tests in the student portal", "छात्र पोर्टल में मॉक टेस्ट"),
    description: ls("Published Future Tech mock tests open after payment is verified. This link does not start a test.", "प्रकाशित फ्यूचर टेक मॉक टेस्ट भुगतान सत्यापन के बाद खुलते हैं।"),
    category: "practice",
    subject: "Future Tech",
    type: "practice",
    href: "/prepare/mock-tests",
  },
  {
    id: "parent-faq",
    title: ls("Parent FAQ — TEJAS Olympiad 2026–27", "अभिभावक FAQ"),
    description: ls("Published answers on eligibility, fees, dates, and the 2025 English Olympiad.", "पात्रता, शुल्क, तिथियाँ और 2025 अंग्रेज़ी ओलंपियाड।"),
    category: "parent",
    type: "article",
    href: "/faq",
  },
  {
    id: "sch-reg-guide",
    title: ls("School registration — TEJAS Olympiad 2026–27", "विद्यालय पंजीकरण"),
    description: ls("Register the school and upload the student sheet. Registration is 3–20 November 2026.", "विद्यालय पंजीकरण और छात्र सूची। पंजीकरण 3–20 नवंबर 2026।"),
    category: "school",
    type: "article",
    href: "/schools/register",
  },
  {
    id: "dl-eng-2025",
    title: ls("1st DHE English Olympiad — edition archive", "प्रथम DHE English Olympiad संग्रह"),
    description: ls("Historical record of the 13–16 October 2025 examination. The brief-report PDF is not attached on this website.", "13–16 अक्टूबर 2025 का ऐतिहासिक रिकॉर्ड। रिपोर्ट की PDF यहाँ संलग्न नहीं है।"),
    category: "downloads",
    subject: "English",
    type: "article",
    href: "/editions/dhe-english-2025",
  },
  {
    id: "bsp-guide",
    title: ls("Shiksha Mahakumbh", "शिक्षा महाकुंभ"),
    description: ls("The Shiksha Mahakumbh website. A Bal Shodh Patrika submission file is not hosted here.", "शिक्षा महाकुंभ की वेबसाइट। बाल शोध पत्रिका की फाइल यहाँ नहीं है।"),
    category: "bal-shodh",
    type: "article",
    href: "https://www.shikshamahakumbh.com",
  },
];

export const resourceCategories = [
  { id: "books", label: ls("Books", "पुस्तकें"), icon: "book" },
  { id: "question-bank", label: ls("Question Bank", "प्रश्न बैंक"), icon: "list" },
  { id: "practice", label: ls("Practice", "अभ्यास"), icon: "pen" },
  { id: "videos", label: ls("Videos", "वीडियो"), icon: "video" },
  { id: "blogs", label: ls("Blogs", "ब्लॉग"), icon: "file-text" },
  { id: "articles", label: ls("Articles", "लेख"), icon: "newspaper" },
  { id: "teacher", label: ls("Teacher Toolkit", "शिक्षक टूलकिट"), icon: "graduation-cap" },
  { id: "parent", label: ls("Parent Guide", "अभिभावक गाइड"), icon: "users" },
  { id: "school", label: ls("School Resources", "विद्यालय संसाधन"), icon: "school" },
  { id: "downloads", label: ls("Downloads", "डाउनलोड"), icon: "download" },
  { id: "research", label: ls("Research Papers", "शोध पत्र"), icon: "microscope" },
  { id: "bal-shodh", label: ls("Bal Shodh Patrika", "बाल शोध पत्रिका"), icon: "book-open" },
] as const;

export function getResourcesByCategory(category: string) {
  return resourceRegistry.filter((r) => r.category === category);
}
