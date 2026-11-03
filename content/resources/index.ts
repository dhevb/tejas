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
    description: ls("The invitation says online mock tests are being prepared. None is open, and this page does not start a test.", "निमंत्रण कहता है कि ऑनलाइन मॉक टेस्ट तैयार किए जा रहे हैं। कोई टेस्ट खुला नहीं है।"),
    category: "practice",
    type: "practice",
    href: "/prepare/mock-tests",
  },
  {
    id: "doc-brochure",
    title: ls("TEJAS Olympiad 2026–27 brochure", "ब्रोशर"),
    description: ls("The updated brochure. Open it in the browser or download the supplied file.", "अद्यतन ब्रोशर।"),
    category: "downloads",
    type: "article",
    href: "/documents/tejas-olympiad-2026-27-brochure.pdf",
  },
  {
    id: "doc-letter",
    title: ls("Invitation dated 31 October 2026", "निमंत्रण पत्र"),
    description: ls("Letter DHE/TEJAS/26-27/03. It states dates, fees, books, and cash prizes.", "पत्र DHE/TEJAS/26-27/03।"),
    category: "downloads",
    type: "article",
    href: "/documents/tejas-olympiad-2026-27-invitation.pdf",
  },
  {
    id: "doc-report-2025",
    title: ls("2025 English Olympiad report", "2025 रिपोर्ट"),
    description: ls("Historical report of the 1st DHE English Olympiad. It is not the 2026–27 brochure.", "2025 की ऐतिहासिक रिपोर्ट। यह 2026–27 का ब्रोशर नहीं है।"),
    category: "downloads",
    type: "article",
    href: "/documents/dhe-english-olympiad-2025-brief-report.pdf",
  },
  {
    id: "ebook-status",
    title: ls("E-book", "ई-बुक"),
    description: ls("Separate registration at ₹49 per student. No e-book file has been supplied yet.", "अलग पंजीकरण, ₹49 प्रति विद्यार्थी। ई-बुक फ़ाइल अभी नहीं दी गई है।"),
    category: "books",
    type: "article",
    href: "/ebook/register",
  },
  {
    id: "printed-books",
    title: ls("Printed book order", "मुद्रित पुस्तक आदेश"),
    description: ls("Separate from Olympiad registration. ₹170 per book, ₹34 school share, ₹136 payable to TEJAS.", "ओलंपियाड पंजीकरण से अलग। ₹170 प्रति पुस्तक।"),
    category: "books",
    type: "article",
    href: "/books/order",
  },
  {
    id: "ebook-login",
    title: ls("E-book login", "ई-बुक लॉगिन"),
    description: ls("Sign in after payment is verified. Reading is online only.", "भुगतान सत्यापन के बाद साइन इन। पढ़ना केवल ऑनलाइन है।"),
    category: "books",
    type: "article",
    href: "/ebook/login",
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
