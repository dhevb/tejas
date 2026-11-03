import type { ResourceItem } from "@/content/types";

function ls(en: string, hi: string) {
  return { en, hi };
}

/** Only pages and files that exist. Unpublished books, papers, and videos are not listed. */
export const resourceRegistry: ResourceItem[] = [
  {
    id: "sch-reg-guide",
    title: ls("School registration — TEJAS Olympiad 2026–27", "विद्यालय पंजीकरण"),
    description: ls("Register the school and upload the student sheet. Registration is open from 3 to 20 November 2026.", "3 से 20 नवंबर 2026 तक पंजीकरण।"),
    category: "school",
    type: "article",
    href: "/schools/register",
  },
  {
    id: "student-template",
    title: ls("Student sheet template", "विद्यार्थी शीट"),
    description: ls("Excel template. English and Mathematics are Classes III–X. Future Tech is Classes VI–X.", "अंग्रेज़ी और गणित कक्षा III–X। फ्यूचर टेक कक्षा VI–X।"),
    category: "downloads",
    type: "practice",
    href: "/api/register/template",
  },
  {
    id: "parent-faq",
    title: ls("Questions about TEJAS Olympiad 2026–27", "प्रश्न"),
    description: ls("Dates, eligibility, fees, and the offline examination.", "तिथियाँ, पात्रता, शुल्क और ऑफ़लाइन परीक्षा।"),
    category: "parent",
    type: "article",
    href: "/faq",
  },
  {
    id: "prac-mock-all",
    title: ls("Mock tests", "मॉक टेस्ट"),
    description: ls("No mock test is open. This page does not start a test or show a score.", "कोई मॉक टेस्ट खुला नहीं है।"),
    category: "practice",
    type: "practice",
    href: "/prepare/mock-tests",
  },
  {
    id: "ebook-status",
    title: ls("E-book", "ई-बुक"),
    description: ls("The invitation price is ₹49. Sales are closed and no login is available.", "निमंत्रण में कीमत ₹49 है। बिक्री बंद है।"),
    category: "books",
    type: "article",
    href: "/prepare/ebook",
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
