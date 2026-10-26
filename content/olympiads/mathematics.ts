import type { OlympiadPortalContent } from "@/content/types";
import { currentCycle, CURRENT_EDITION_LABEL } from "@/content/current-cycle";

export const mathematicsOlympiad: OlympiadPortalContent = {
  slug: "mathematics",
  name: { en: "TEJAS Mathematics", hi: "TEJAS गणित" },
  tagline: {
    en: "DHE Maths Olympiad — logical reasoning, problem-solving, and mathematical excellence",
    hi: "DHE गणित ओलंपियाड — तार्किक तर्क, समस्या समाधान और गणितीय उत्कृष्टता",
  },
  description: {
    en: "TEJAS Mathematics is examined on 9 December 2026 for Classes III–X. It strengthens conceptual clarity, analytical thinking, and problem-solving.",
    hi: "DHE गणित ओलंपियाड अवधारणात्मक स्पष्टता, विश्लेषणात्मक सोच और समस्या समाधान कौशल को मजबूत करता है।",
  },
  whySubject: {
    en: "Mathematics is the language of science and innovation. From Srinivasa Ramanujan to modern data science, mathematical thinking drives Bharat's knowledge economy. The DHE Maths Olympiad identifies and nurtures young mathematical talent nationwide.",
    hi: "गणित विज्ञान और नवाचार की भाषा है। DHE गणित ओलंपियाड युवा गणितीय प्रतिभा की पहचान और पोषण करता है।",
  },
  status: "active",
  icon: "calculator",
  color: "#172B67",
  grades: currentCycle.grades,
  duration: { en: "60 minutes", hi: "60 मिनट" },
  questions: 50,
  registrationOpen: true,
  eligibility: [
    {
      en: "Students in Classes III–X enrolled in recognised schools",
      hi: "मान्यता प्राप्त विद्यालयों में कक्षा III–X के छात्र",
    },
    {
      en: "School registration through Olympiad Cell, DHE",
      hi: "DHE ओलंपियाड सेल के माध्यम से विद्यालय पंजीकरण",
    },
    {
      en: "Grade-appropriate level assignment (Levels B–E for current TEJAS Edition)",
      hi: "कक्षा-अनुकूल स्तर निर्धारण",
    },
  ],
  examPattern: [
    {
      section: { en: "Number Systems & Arithmetic", hi: "संख्या प्रणाली एवं अंकगणित" },
      questions: 15,
      marks: 15,
    },
    {
      section: { en: "Algebra & Patterns", hi: "बीजगणित एवं पैटर्न" },
      questions: 12,
      marks: 12,
    },
    {
      section: { en: "Geometry & Mensuration", hi: "ज्यामिति एवं मापन" },
      questions: 10,
      marks: 10,
    },
    {
      section: { en: "Logical Reasoning & Data", hi: "तार्किक तर्क एवं डेटा" },
      questions: 8,
      marks: 8,
    },
    {
      section: { en: "Higher-Order Problem Solving", hi: "उच्च स्तरीय समस्या समाधान" },
      questions: 5,
      marks: 5,
    },
  ],
  syllabus: [
    {
      level: { en: "Level B", hi: "स्तर B" },
      classes: { en: "Class III–IV", hi: "कक्षा III–IV" },
      topics: [
        { en: "Addition, subtraction, multiplication, division", hi: "जोड़, घटाव, गुणा, भाग" },
        { en: "Basic fractions and shapes", hi: "मूल भिन्न और आकृतियाँ" },
        { en: "Patterns and simple word problems", hi: "पैटर्न और सरल शाब्दिक प्रश्न" },
      ],
    },
    {
      level: { en: "Level C", hi: "स्तर C" },
      classes: { en: "Class V–VI", hi: "कक्षा V–VI" },
      topics: [
        { en: "Decimals, percentages, LCM/HCF", hi: "दशमलव, प्रतिशत, LCM/HCF" },
        { en: "Basic algebra and equations", hi: "मूल बीजगणित और समीकरण" },
        { en: "Area, perimeter, and angles", hi: "क्षेत्रफल, परिमाप और कोण" },
      ],
    },
    {
      level: { en: "Level D", hi: "स्तर D" },
      classes: { en: "Class VII–VIII", hi: "कक्षा VII–VIII" },
      topics: [
        { en: "Linear equations and polynomials", hi: "रैखिक समीकरण और बहुपद" },
        { en: "Pythagoras theorem and coordinate geometry basics", hi: "पाइथागोरस प्रमेय और निर्देशांक ज्यामिति" },
        { en: "Statistics and probability introduction", hi: "सांख्यिकी और प्रायिकता परिचय" },
      ],
    },
    {
      level: { en: "Level E", hi: "स्तर E" },
      classes: { en: "Class IX–X", hi: "कक्षा IX–X" },
      topics: [
        { en: "Quadratic equations and trigonometry", hi: "द्विघात समीकरण और त्रिकोणमिति" },
        { en: "Coordinate geometry and constructions", hi: "निर्देशांक ज्यामिति और रचनाएँ" },
        { en: "Olympiad-style combinatorics and number theory basics", hi: "ओलंपियाड-शैली संयोजकता" },
      ],
    },
  ],
  preparationRoadmap: [
    {
      phase: { en: "Concepts (Weeks 1–2)", hi: "अवधारणाएँ (सप्ताह 1–2)" },
      description: {
        en: "Revise NCERT chapters for your grade. Focus on fundamentals before attempting Olympiad-level questions.",
        hi: "अपनी कक्षा के NCERT अध्यायों की समीक्षा।",
      },
    },
    {
      phase: { en: "Practice (Weeks 3–4)", hi: "अभ्यास (सप्ताह 3–4)" },
      description: {
        en: "Solve 20 MCQs daily from sample papers. Track weak topics and revisit concepts.",
        hi: "नमूना प्रश्नपत्रों से प्रतिदिन 20 MCQ हल करें।",
      },
    },
    {
      phase: { en: "Mock Tests (Weeks 5–6)", hi: "मॉक टेस्ट (सप्ताह 5–6)" },
      description: {
        en: "Full-length timed tests with OMR practice. Aim for accuracy first, then speed.",
        hi: "OMR अभ्यास के साथ पूर्ण लंबाई समयबद्ध टेस्ट।",
      },
    },
  ],
  books: [
    {
      title: { en: "DHE Maths Olympiad Workbook", hi: "DHE गणित ओलंपियाड कार्यपुस्तिका" },
      author: { en: "Olympiad Cell, DHE", hi: "ओलंपियाड सेल, DHE" },
      publisher: { en: "DHE Publications", hi: "DHE प्रकाशन" },
    },
    {
      title: { en: "NCERT Mathematics — Grade-wise Revision", hi: "NCERT गणित — कक्षावार संशोधन" },
      author: { en: "NCERT", hi: "NCERT" },
      publisher: { en: "NCERT", hi: "NCERT" },
    },
    {
      title: { en: "Logical Reasoning for Young Mathematicians", hi: "युवा गणितज्ञों के लिए तार्किक तर्क" },
      author: { en: "TEJAS Editorial Board", hi: "TEJAS संपादकीय मंडल" },
      publisher: { en: "TEJAS Publications", hi: "TEJAS प्रकाशन" },
    },
  ],
  mockTests: [
    {
      id: "math-mock-c",
      title: { en: "Mock Test — Level C", hi: "मॉक टेस्ट — स्तर C" },
      questions: 40,
      duration: "50 min",
      level: { en: "Level C", hi: "स्तर C" },
    },
    {
      id: "math-mock-e",
      title: { en: "Mock Test — Level E", hi: "मॉक टेस्ट — स्तर E" },
      questions: 50,
      duration: "60 min",
      level: { en: "Level E", hi: "स्तर E" },
    },
  ],
  samplePapers: [
    {
      id: "math-sample-d",
      title: { en: "Sample Paper — Level D", hi: "नमूना प्रश्नपत्र — स्तर D" },
      year: 2026,
      level: { en: "Level D", hi: "स्तर D" },
      edition: CURRENT_EDITION_LABEL,
    },
  ],
  previousPapers: [],
  videoLectures: [
    {
      id: "math-v1",
      title: { en: "Problem-Solving Strategies for Maths Olympiad", hi: "गणित ओलंपियाड समस्या समाधान रणनीति" },
      duration: "40 min",
      speaker: { en: "Olympiad Cell, DHE", hi: "ओलंपियाड सेल, DHE" },
    },
  ],
  awards: [
    {
      level: { en: "National Top Achievers", hi: "राष्ट्रीय शीर्ष achievers" },
      description: {
        en: "₹3,100, ₹2,100, ₹1,500, and five consolation prizes of ₹500 for overall toppers in each class. Gold, silver, and bronze medals for outstanding students.",
        hi: "पदक, प्रमाणपत्र और TEJAS राष्ट्रीय सम्मान",
      },
    },
    {
      level: { en: "School & State Recognition", hi: "विद्यालय एवं राज्य मान्यता" },
      description: {
        en: "School-wise and state-wise toppers honoured with certificates",
        hi: "विद्यालयवार और राज्यवार शीर्ष achievers",
      },
    },
    {
      level: { en: "All Participants", hi: "सभी प्रतिभागी" },
      description: {
        en: "Digital participation certificate with QR verification",
        hi: "QR सत्यापन के साथ डिजिटल प्रमाणपत्र",
      },
    },
  ],
  faqs: [
    {
      question: { en: "When is the DHE Maths Olympiad?", hi: "DHE गणित ओलंपियाड कब है?" },
      answer: {
        en: "TEJAS Mathematics is on 9 December 2026. Schools register from 1 November 2026 to 20 November 2026.",
        hi: "TEJAS गणित 9 दिसंबर 2026 को है। पंजीकरण 1–20 नवंबर 2026।",
      },
    },
    {
      question: { en: "Which classes can participate?", hi: "कौन सी कक्षाएँ भाग ले सकती हैं?" },
      answer: {
        en: "Classes III–X, as printed for TEJAS Olympiad 2026–27.",
        hi: "वर्तमान स्वतंत्र TEJAS चक्र में कक्षा III–X।",
      },
    },
    {
      question: { en: "Is the syllabus aligned with NCERT?", hi: "क्या पाठ्यक्रम NCERT के अनुरूप है?" },
      answer: {
        en: "Yes. Questions are grade-appropriate and aligned with NCERT and major state board curricula, with higher-order thinking components.",
        hi: "हाँ, NCERT और प्रमुख राज्य बोर्ड के अनुरूप।",
      },
    },
  ],
  teacherGuide: [
    {
      title: { en: "Classroom Preparation", hi: "कक्षा तैयारी" },
      points: [
        { en: "Integrate 5 Olympiad-style questions weekly in maths class", hi: "साप्ताहिक 5 ओलंपियाड-शैली प्रश्न" },
        { en: "Use peer learning groups for problem-solving", hi: "समस्या समाधान के लिए सहपाठी समूह" },
        { en: "Track student progress with diagnostic tests", hi: "नैदानिक टेस्ट से प्रगति ट्रैक करें" },
      ],
    },
  ],
  parentGuide: [
    {
      title: { en: "Home Support", hi: "घर पर समर्थन" },
      points: [
        { en: "Encourage puzzle-solving and mental maths daily", hi: "दैनिक पहेली और मानसिक गणित" },
        { en: "Avoid exam pressure — focus on conceptual understanding", hi: "अवधारणात्मक समझ पर ध्यान" },
      ],
    },
  ],
  schoolGuide: [
    {
      title: { en: "School Registration", hi: "विद्यालय पंजीकरण" },
      points: [
        { en: "Register through Olympiad Cell official channels", hi: "ओलंपियाड सेल के आधिकारिक चैनलों से" },
        { en: "Nominate students by grade level (B–E)", hi: "कक्षा स्तर (B–E) के अनुसार छात्र नामांकित करें" },
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
      label: { en: "DHE Maths Olympiad — Examination", hi: "परीक्षा" },
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
    { en: "Logical reasoning and pattern recognition", hi: "तार्किक तर्क और pattern recognition" },
    { en: "Numerical aptitude and mental maths", hi: "संख्यात्मक अभिरुचि" },
    { en: "Problem decomposition and solution strategies", hi: "समस्या विघटन" },
  ],
  learningOutcomes: [
    { en: "Conceptual clarity beyond rote formulas", hi: "रटант से परे अवधारणात्मक स्पष्टता" },
    { en: "Higher-order thinking for Olympiad-level questions", hi: "Olympiad-स्तरीय उच्च सोच" },
  ],
  careerPathways: [
    { en: "Engineering, architecture, and data science", hi: "इंजीनियरिंग, architecture और data science" },
    { en: "Actuarial science, finance, and economics", hi: "Actuarial science, finance और economics" },
    { en: "Pure mathematics, research, and teaching", hi: "शुद्ध गणित, अनुसंधान और शिक्षण" },
  ],
  sampleQuestions: [
    {
      question: { en: "If 3x + 7 = 22, find x.", hi: "3x + 7 = 22 में x ज्ञात करें" },
      hint: { en: "Level D — Algebra", hi: "स्तर D — बीजगणित" },
    },
    {
      question: { en: "What is 25% of 480?", hi: "480 का 25% क्या है?" },
      hint: { en: "Level C — Percentages", hi: "स्तर C — प्रतिशत" },
    },
  ],
};
