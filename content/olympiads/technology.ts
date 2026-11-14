import type { OlympiadPortalContent } from "@/content/types";

export const technologyOlympiad: OlympiadPortalContent = {
  slug: "technology",
  name: { en: "TEJAS Future Tech", hi: "TEJAS फ्यूचर टेक" },
  tagline: {
    en: "TEJAS Future Tech Olympiad — Classes VI–X",
    hi: "TEJAS फ्यूचर टेक ओलंपियाड — कक्षा VI–X",
  },
  description: {
    en: "TEJAS Future Tech Olympiad is examined offline on 11 December 2026 for Classes VI–X. It assesses digital literacy, computational thinking, and awareness of emerging technologies.",
    hi: "TEJAS फ्यूचर टेक ओलंपियाड कक्षा VI–X के लिए है। परीक्षा 11 दिसंबर 2026 को है।",
  },
  whySubject: {
    en: "Technology-enabled education is part of the work of the Department of Holistic Education. TEJAS Future Tech Olympiad is the current stream for Classes VI–X.",
    hi: "TEJAS फ्यूचर टेक ओलंपियाड कक्षा VI–X के लिए है। आयोजक समग्र शिक्षा विभाग है।",
  },
  status: "active",
  icon: "cpu",
  color: "#8A5A10",
  grades: {
    en: "Classes VI–X",
    hi: "कक्षा VI–X",
  },
  duration: { en: "45 minutes", hi: "45 मिनट" },
  questions: 40,
  registrationOpen: true,
  eligibility: [
    {
      en: "Students in Classes VI–X in recognised schools",
      hi: "मान्यता प्राप्त विद्यालयों में कक्षा VI–X के छात्र",
    },
    {
      en: "School registration via Olympiad Cell, DHE",
      hi: "DHE ओलंपियाड सेल के माध्यम से पंजीकरण",
    },
    {
      en: "No prior coding experience is required",
      hi: "पहले से coding अनुभव आवश्यक नहीं",
    },
  ],
  examPattern: [
    {
      section: { en: "Digital Literacy & Tools", hi: "डिजिटल साक्षरता एवं उपकरण" },
      questions: 12,
      marks: 12,
    },
    {
      section: { en: "Computational Thinking", hi: "Computational Thinking" },
      questions: 10,
      marks: 10,
    },
    {
      section: { en: "Internet, Safety & Ethics", hi: "इंटरनेट, सुरक्षा एवं नैतिकता" },
      questions: 8,
      marks: 8,
    },
    {
      section: { en: "Emerging Tech Awareness (AI, IoT, Robotics)", hi: "उभरती तकनीक जागरूकता" },
      questions: 10,
      marks: 10,
    },
  ],
  syllabus: [
    {
      level: { en: "Level C", hi: "स्तर C" },
      classes: { en: "Class VI", hi: "कक्षा VI" },
      topics: [
        { en: "MS Office basics and file management", hi: "MS Office मूल बातें" },
        { en: "Algorithms and flowcharts introduction", hi: "एल्गोरिदम और फ्लोचार्ट परिचय" },
        { en: "Cyber safety and digital citizenship", hi: "साइबर सुरक्षा और डिजिटल नागरिकता" },
      ],
    },
    {
      level: { en: "Level D", hi: "स्तर D" },
      classes: { en: "Class VII–VIII", hi: "कक्षा VII–VIII" },
      topics: [
        { en: "Programming logic and pseudocode", hi: "प्रोग्रामिंग लॉजिक और pseudocode" },
        { en: "Introduction to AI and machine learning concepts", hi: "AI और ML अवधारणाएँ" },
        { en: "Robotics and IoT awareness", hi: "रोबोटिक्स और IoT जागरूकता" },
      ],
    },
    {
      level: { en: "Level E", hi: "स्तर E" },
      classes: { en: "Class IX–X", hi: "कक्षा IX–X" },
      topics: [
        { en: "Data science fundamentals and visualisation", hi: "डेटा विज्ञान मूल बातें" },
        { en: "AI ethics and responsible technology", hi: "AI नैतिकता और जिम्मेदार प्रौद्योगिकी" },
        { en: "Innovation, startups, and Bharat's tech ecosystem", hi: "नवाचार, स्टार्टअप और भारत का tech ecosystem" },
      ],
    },
  ],
  preparationRoadmap: [
    {
      phase: { en: "Digital Basics (Weeks 1–2)", hi: "डिजिटल मूल (सप्ताह 1–2)" },
      description: {
        en: "Review computer fundamentals, internet safety, and basic software tools for your grade.",
        hi: "कंप्यूटर मूल बातें, इंटरनेट सुरक्षा की समीक्षा।",
      },
    },
    {
      phase: { en: "Logic & Innovation (Weeks 3–4)", hi: "तर्क एवं नवाचार (सप्ताह 3–4)" },
      description: {
        en: "Practice flowcharts, pseudocode, and read about AI/robotics news in Bharat.",
        hi: "फ्लोचार्ट, pseudocode अभ्यास और AI/robotics समाचार पढ़ें।",
      },
    },
    {
      phase: { en: "Mock Tests (Weeks 5–6)", hi: "मॉक टेस्ट (सप्ताह 5–6)" },
      description: {
        en: "Published Future Tech mock tests open from the student portal after payment is verified. This page does not start a test.",
        hi: "प्रकाशित फ्यूचर टेक मॉक टेस्ट छात्र पोर्टल में भुगतान सत्यापन के बाद खुलते हैं।",
      },
    },
  ],
  books: [
    {
      title: { en: "TEJAS Future Tech e-books", hi: "TEJAS फ्यूचर टेक ई-पुस्तक" },
      author: { en: "Department of Holistic Education", hi: "समग्र शिक्षा विभाग" },
      publisher: { en: "Student portal", hi: "छात्र पोर्टल" },
      description: {
        en: "Book 1 is for Classes VI–VIII and Book 2 is for Classes IX–X. They open from the student portal when published and the payment is verified. This page does not open a file.",
        hi: "पुस्तक 1 कक्षा VI–VIII और पुस्तक 2 कक्षा IX–X। छात्र पोर्टल से खुलती हैं।",
      },
    },
  ],
  mockTests: [],
  samplePapers: [],
  previousPapers: [],
  videoLectures: [],
  awards: [
    {
      level: { en: "National Top Achievers", hi: "राष्ट्रीय शीर्ष achievers" },
      description: {
        en: "₹3,100, ₹2,100, ₹1,500, and ten consolation prizes of ₹500 each for overall toppers in each class. The school with the highest student participation is recognised, and its principal receives a Certificate of Appreciation. Gold, silver, and bronze medals for outstanding students.",
        hi: "TEJAS राष्ट्रीय सम्मान में पदक और प्रमाणपत्र",
      },
    },
    {
      level: { en: "Innovation Recognition", hi: "नवाचार मान्यता" },
      description: {
        en: "Special recognition for outstanding tech aptitude at school level",
        hi: "विद्यालय स्तर पर उत्कृष्ट tech aptitude के लिए विशेष मान्यता",
      },
    },
    {
      level: { en: "All Participants", hi: "सभी प्रतिभागी" },
      description: {
        en: "Digital participation certificate",
        hi: "डिजिटल सहभागिता प्रमाणपत्र",
      },
    },
  ],
  faqs: [
    {
      question: { en: "Do I need to know coding?", hi: "क्या coding आना चाहिए?" },
      answer: {
        en: "No prior coding is required. Future Tech is for Classes VI–X and focuses on digital literacy, logical thinking, and technology awareness appropriate to each grade.",
        hi: "निचले स्तरों के लिए prior coding आवश्यक नहीं।",
      },
    },
    {
      question: { en: "When is TEJAS Future Tech Olympiad?", hi: "TEJAS फ्यूचर टेक ओलंपियाड कब है?" },
      answer: {
        en: "TEJAS Future Tech is on 11 December 2026. Schools register from 3 November 2026 to 20 November 2026.",
        hi: "TEJAS फ्यूचर टेक 11 दिसंबर 2026 को है। पंजीकरण 3–20 नवंबर 2026।",
      },
    },
  ],
  teacherGuide: [
    {
      title: { en: "Integrating Tech in Classroom", hi: "कक्षा में Tech एकीकरण" },
      points: [
        { en: "Use computer lab sessions for Olympiad-style MCQ practice", hi: "कंप्यूटर लैब में MCQ अभ्यास" },
        { en: "Discuss cyber safety and digital ethics regularly", hi: "साइबर सुरक्षा और डिजिटल नैतिकता पर चर्चा" },
      ],
    },
  ],
  parentGuide: [
    {
      title: { en: "Safe Technology Use", hi: "सुरक्षित प्रौद्योगिकी उपयोग" },
      points: [
        { en: "Supervise internet usage and teach privacy basics", hi: "इंटरनेट उपयोग की देखरेख" },
        { en: "Encourage curiosity about how technology works", hi: "प्रौद्योगिकी कैसे काम करती है — जिज्ञासा" },
      ],
    },
  ],
  schoolGuide: [
    {
      title: { en: "Infrastructure Requirements", hi: "अवसंरचना आवश्यकताएँ" },
      points: [
        { en: "Exam conducted via OMR — no computer lab required for exam day", hi: "OMR द्वारा परीक्षा — exam day पर computer lab आवश्यक नहीं" },
        { en: "Optional computer lab for preparation sessions", hi: "तैयारी के लिए वैकल्पिक computer lab" },
      ],
    },
  ],
  calendar: [
    {
      label: { en: "TEJAS Future Tech — registration opens", hi: "पंजीकरण प्रारंभ" },
      date: "2026-11-03",
      status: "upcoming",
    },
    {
      label: { en: "TEJAS Future Tech — registration closes", hi: "पंजीकरण समाप्ति" },
      date: "2026-11-20",
      status: "upcoming",
    },
    {
      label: { en: "TEJAS Future Tech Olympiad — examination", hi: "परीक्षा" },
      date: "2026-12-11",
      status: "upcoming",
    },
  ],
  hallOfFameHighlights: [],
  skillsDeveloped: [
    { en: "Digital literacy and safe internet practices", hi: "डिजिटल साक्षरता" },
    { en: "Computational thinking and algorithmic logic", hi: "Computational thinking" },
    { en: "Awareness of AI, robotics, and emerging tech", hi: "AI, robotics जागरूकता" },
  ],
  learningOutcomes: [
    { en: "Responsible technology use and digital citizenship", hi: "जिम्मेदार technology उपयोग" },
    { en: "Foundation for coding, innovation, and STEM careers", hi: "coding और STEM careers की नींव" },
  ],
  careerPathways: [
    { en: "Software engineering and AI/ML", hi: "Software engineering और AI/ML" },
    { en: "Cybersecurity and network administration", hi: "Cybersecurity" },
    { en: "Product design, EdTech, and startups", hi: "Product design, EdTech और startups" },
  ],
  sampleQuestions: [
    {
      question: { en: "Which device stores permanent data in a computer? (a) RAM (b) ROM (c) CPU (d) Monitor", hi: "स्थायी डेटा कौन सा उपकरण संग्रहीत करता है?" },
      hint: { en: "Level C — Digital basics", hi: "स्तर C" },
    },
    {
      question: { en: "What is the next step after 'Start' in a flowchart that checks if a number is even?", hi: "Flowchart में even check के बाद अगला कदम?" },
      hint: { en: "Level D — Logic", hi: "स्तर D — Logic" },
    },
  ],
};
