import type { OlympiadPortalContent } from "@/content/types";
import { currentCycle, CURRENT_EDITION_LABEL } from "@/content/current-cycle";

export const technologyOlympiad: OlympiadPortalContent = {
  slug: "technology",
  name: { en: "TEJAS Future Tech", hi: "TEJAS फ्यूचर टेक" },
  tagline: {
    en: "DHE Tech Olympiad — digital literacy, innovation, and emerging technologies",
    hi: "DHE टेक ओलंपियाड — डिजिटल साक्षरता, नवाचार और उभरती प्रौद्योगिकियाँ",
  },
  description: {
    en: "TEJAS Future Tech is examined on 11 December 2026 for Classes III–X. It assesses digital literacy, computational thinking, and awareness of emerging technologies.",
    hi: "DHE टेक ओलंपियाड डिजिटल साक्षरता, computational thinking और उभरती प्रौद्योगिकियों की जागरूकता का मूल्यांकन करता है।",
  },
  whySubject: {
    en: "Technology-enabled education and innovation ecosystems are core to DHE's mission. The Tech Olympiad prepares students for a digital Bharat — from basic computer literacy to AI awareness and responsible technology use.",
    hi: "प्रौद्योगिकी-सक्षम शिक्षा DHE के मिशन का मुख्य हिस्सा है। टेक ओलंपियाड डिजिटल भारत के लिए छात्रों को तैयार करता है।",
  },
  status: "active",
  icon: "cpu",
  color: "#8A5A10",
  grades: currentCycle.grades,
  duration: { en: "45 minutes", hi: "45 मिनट" },
  questions: 40,
  registrationOpen: true,
  eligibility: [
    {
      en: "Students in Classes III–X in recognised schools",
      hi: "मान्यता प्राप्त विद्यालयों में कक्षा III–X के छात्र",
    },
    {
      en: "School registration via Olympiad Cell, DHE",
      hi: "DHE ओलंपियाड सेल के माध्यम से पंजीकरण",
    },
    {
      en: "No prior coding experience required for lower levels",
      hi: "निचले स्तरों के लिए prior coding अनुभव आवश्यक नहीं",
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
      level: { en: "Level B", hi: "स्तर B" },
      classes: { en: "Class III–IV", hi: "कक्षा III–IV" },
      topics: [
        { en: "Basic computer parts and functions", hi: "मूल कंप्यूटर भाग और कार्य" },
        { en: "Safe internet usage for children", hi: "बच्चों के लिए सुरक्षित इंटरनेट उपयोग" },
        { en: "Introduction to keyboard and mouse skills", hi: "कीबोर्ड और माउस कौशल परिचय" },
      ],
    },
    {
      level: { en: "Level C", hi: "स्तर C" },
      classes: { en: "Class V–VI", hi: "कक्षा V–VI" },
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
        en: "Full-length Tech Olympiad mock with OMR practice.",
        hi: "OMR अभ्यास के साथ पूर्ण टेक ओलंपियाड मॉक।",
      },
    },
  ],
  books: [
    {
      title: { en: "DHE Tech Olympiad Guide", hi: "DHE टेक ओलंपियाड गाइड" },
      author: { en: "Olympiad Cell, DHE", hi: "ओलंपियाड सेल, DHE" },
      publisher: { en: "DHE Publications", hi: "DHE प्रकाशन" },
    },
    {
      title: { en: "Digital Bharat — Young Innovator's Handbook", hi: "डिजिटल भारत — युवा नवप्रवर्तक पुस्तिका" },
      author: { en: "TEJAS Editorial Board", hi: "TEJAS संपादकीय मंडल" },
      publisher: { en: "TEJAS Publications", hi: "TEJAS प्रकाशन" },
    },
  ],
  mockTests: [
    {
      id: "tech-mock-c",
      title: { en: "Mock Test — Level C", hi: "मॉक टेस्ट — स्तर C" },
      questions: 30,
      duration: "40 min",
      level: { en: "Level C", hi: "स्तर C" },
    },
    {
      id: "tech-mock-e",
      title: { en: "Mock Test — Level E", hi: "मॉक टेस्ट — स्तर E" },
      questions: 40,
      duration: "45 min",
      level: { en: "Level E", hi: "स्तर E" },
    },
  ],
  samplePapers: [
    {
      id: "tech-sample-d",
      title: { en: "Sample Paper — Level D", hi: "नमूना प्रश्नपत्र — स्तर D" },
      year: 2026,
      level: { en: "Level D", hi: "स्तर D" },
      edition: CURRENT_EDITION_LABEL,
    },
  ],
  previousPapers: [],
  videoLectures: [
    {
      id: "tech-v1",
      title: { en: "Introduction to AI for School Students", hi: "स्कूल छात्रों के लिए AI परिचय" },
      duration: "35 min",
      speaker: { en: "DHE Innovation Cell", hi: "DHE नवाचार सेल" },
    },
  ],
  awards: [
    {
      level: { en: "National Top Achievers", hi: "राष्ट्रीय शीर्ष achievers" },
      description: {
        en: "₹3,100, ₹2,100, ₹1,500, and five consolation prizes of ₹500 for overall toppers in each class. Gold, silver, and bronze medals for outstanding students.",
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
        en: "No prior coding is required for lower levels. The Olympiad focuses on digital literacy, logical thinking, and technology awareness appropriate to each grade.",
        hi: "निचले स्तरों के लिए prior coding आवश्यक नहीं।",
      },
    },
    {
      question: { en: "When is the DHE Tech Olympiad?", hi: "DHE टेक ओलंपियाड कब है?" },
      answer: {
        en: "TEJAS Future Tech is on 11 December 2026. Schools register from 1 November 2026 to 20 November 2026.",
        hi: "TEJAS फ्यूचर टेक 11 दिसंबर 2026 को है। पंजीकरण 1–20 नवंबर 2026।",
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
      label: { en: "Registration Opens", hi: "पंजीकरण प्रारंभ" },
      date: "2026-07-01",
      status: "tba",
    },
    {
      label: { en: "DHE Tech Olympiad — Examination", hi: "परीक्षा" },
      date: "2026-09-01",
      status: "tba",
    },
    {
      label: { en: "Felicitation — TEJAS National Ceremony", hi: "TEJAS राष्ट्रीय सम्मान" },
      date: "2026-10-01",
      status: "tba",
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
