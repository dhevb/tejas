import type { ResourceItem } from "@/content/types";

function ls(en: string, hi: string) {
  return { en, hi };
}

export const resourceRegistry: ResourceItem[] = [
  // Books
  { id: "book-eng-wb", title: ls("DHE English Olympiad Workbook — All Levels", "DHE अंग्रेज़ी कार्यपुस्तिका"), description: ls("Official level-wise preparation workbook (A–E)", "आधिकारिक स्तरवार कार्यपुस्तिका"), category: "books", subject: "English", type: "book", href: "#" },
  { id: "book-math-wb", title: ls("DHE Maths Olympiad Workbook", "DHE गणित कार्यपुस्तिका"), description: ls("Grade-appropriate maths preparation", "कक्षा-अनुकूल गणित तैयारी"), category: "books", subject: "Mathematics", type: "book", href: "#" },
  { id: "book-tech-guide", title: ls("Digital Bharat — Young Innovator's Handbook", "डिजिटल भारत पुस्तिका"), description: ls("Tech Olympiad preparation guide", "टेक ओलंपियाड गाइड"), category: "books", subject: "Technology", type: "book", href: "#" },
  // Question Bank
  { id: "qb-eng", title: ls("English Olympiad Question Bank — 500+ MCQs", "अंग्रेज़ी प्रश्न बैंक"), description: ls("Level-wise MCQ collection with answer keys", "स्तरवार MCQ संग्रह"), category: "question-bank", subject: "English", type: "practice", href: "#" },
  { id: "qb-math", title: ls("Maths Olympiad Question Bank", "गणित प्रश्न बैंक"), description: ls("Topic-wise maths questions by grade", "कक्षावार गणित प्रश्न"), category: "question-bank", subject: "Mathematics", type: "practice", href: "#" },
  // Practice
  { id: "prac-eng-omr", title: ls("OMR Practice Sheet — English Olympiad", "OMR अभ्यास शीट"), description: ls("Practice OMR filling for exam day", "परीक्षा दिवस OMR अभ्यास"), category: "practice", subject: "English", type: "practice", href: "#" },
  { id: "prac-mock-all", title: ls("Full-Length Mock Tests — All Active Streams", "पूर्ण मॉक टेस्ट"), description: ls("English, Maths, Technology mock tests", "तीनों streams"), category: "practice", subject: "All", type: "practice", href: "/prepare/mock-tests" },
  // Videos
  { id: "vid-eng-strategy", title: ls("English Olympiad Strategy Session", "अंग्रेज़ी रणनीति सत्र"), description: ls("Olympiad Cell, DHE masterclass", "Olympiad Cell masterclass"), category: "videos", subject: "English", type: "video", href: "#" },
  { id: "vid-ai-intro", title: ls("Introduction to AI for School Students", "AI परिचय"), description: ls("DHE Innovation Cell — 35 min session", "35 मिनट सत्र"), category: "videos", subject: "Technology", type: "video", href: "#" },
  // Articles & Blogs
  { id: "art-nep-olympiad", title: ls("NEP 2020 and Olympiad Culture in Bharat", "NEP 2020 और ओलंपियाड संस्कृति"), description: ls("How competitive assessment aligns with NEP vision", "NEP vision के साथ alignment"), category: "articles", type: "article", href: "#" },
  { id: "blog-eng-tips", title: ls("10 Tips for Reading Comprehension Success", "पठन बोध 10 सुझाव"), description: ls("Expert tips from English Connection", "English Connection सुझाव"), category: "blogs", subject: "English", type: "article", href: "#" },
  // Parent Guide
  { id: "parent-guide", title: ls("Parent's Guide to TEJAS Olympiads", "TEJAS ओलंपियाड — अभिभावक गाइड"), description: ls("How to support your child — registration, preparation, exam day, and results", "पंजीकरण, तैयारी, परीक्षा दिवस और परिणाम"), category: "parent", type: "pdf", href: "#" },
  { id: "parent-faq", title: ls("Parent FAQ — TEJAS Olympiad 2026–27", "अभिभावक FAQ"), description: ls("Common questions on eligibility, fees, and school coordination", "पात्रता, शुल्क और विद्यालय समन्वय"), category: "parent", type: "article", href: "/faq" },
  { id: "tr-guide", title: ls("Teacher's Guide — DHE Olympiads", "शिक्षक गाइड"), description: ls("Complete guide for Olympiad coordinators", "ओलंपियाड समन्वयक गाइड"), category: "teacher", type: "pdf", href: "#" },
  { id: "tr-lesson-plans", title: ls("Weekly Lesson Plans — English Olympiad Prep", "साप्ताहिक lesson plans"), description: ls("6-week classroom preparation plan", "6-सप्ताह कक्षा योजना"), category: "teacher", subject: "English", type: "pdf", href: "#" },
  // School Resources
  { id: "sch-reg-guide", title: ls("School registration — TEJAS Olympiad 2026–27", "विद्यालय पंजीकरण"), description: ls("Register the school and upload the student sheet", "पंजीकरण और छात्र सूची"), category: "school", type: "article", href: "/schools/register" },
  { id: "sch-invigilation", title: ls("Exam Invigilation Standards", "परीक्षा निरीक्षण मानक"), description: ls("OMR exam day protocols for schools", "OMR exam day protocols"), category: "school", type: "pdf", href: "#" },
  // Downloads
  { id: "dl-eng-2025", title: ls("1st DHE English Olympiad — Brief Report", "प्रथम DHE English Olympiad रिपोर्ट"), description: ls("Official report with statistics and results", "आधिकारिक रिपोर्ट"), category: "downloads", subject: "English", type: "pdf", href: "#" },
  { id: "dl-sample-cert", title: ls("Sample Participation Certificate", "नमूना प्रमाणपत्र"), description: ls("Certificate format with QR verification", "QR सत्यापन प्रमाणपत्र"), category: "downloads", type: "pdf", href: "#" },
  { id: "dl-syllabus-all", title: ls("TEJAS Olympiad Syllabus — All Active Streams", "TEJAS पाठ्यक्रम"), description: ls("English, Maths, Technology syllabus PDF", "तीनों streams पाठ्यक्रम"), category: "downloads", type: "pdf", href: "#" },
  // Research
  { id: "res-olympiad-impact", title: ls("Impact of School Olympiads on Learning Outcomes", "ओलंपियाड का प्रभाव"), description: ls("DHE research paper on Olympiad Cell outcomes", "DHE research paper"), category: "research", type: "pdf", href: "#" },
  // Bal Shodh Patrika
  { id: "bsp-guide", title: ls("Bal Shodh Patrika — Submission Guide", "बाल शोध पत्रिका गाइड"), description: ls("Classes 9–12 student research journal guidelines", "कक्षा 9–12 शोध journal"), category: "bal-shodh", type: "pdf", href: "https://www.shikshamahakumbh.com" },
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
