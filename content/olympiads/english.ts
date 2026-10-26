import type { OlympiadPortalContent } from "@/content/types";
import { currentCycle, pastEnglishOlympiad2025, CURRENT_EDITION_LABEL } from "@/content/current-cycle";

export const englishOlympiad: OlympiadPortalContent = {
  slug: "english",
  name: { en: "TEJAS English", hi: "TEJAS अंग्रेज़ी" },
  tagline: {
    en: "DHE English Olympiad — strengthening language fundamentals from an early age",
    hi: "DHE अंग्रेज़ी ओलंपियाड — प्रारंभिक आयु से भाषा की मजबूत नींव",
  },
  description: {
    en: "Language is not merely a medium of communication; it is the foundation of expression, creativity, and confidence. The DHE English Olympiad strengthens vocabulary, grammar, reading comprehension, and creative language usage while building competitive spirit.",
    hi: "भाषा केवल संचार का माध्यम नहीं; यह अभिव्यक्ति, रचनात्मकता और आत्मविश्वास की नींव है। DHE अंग्रेज़ी ओलंपियाड शब्दावली, व्याकरण, पठन बोध और रचनात्मक भाषा उपयोग को मजबूत करता है।",
  },
  whySubject: {
    en: "TEJAS English is examined on 10 December 2026 for Classes III–X. It follows the 1st DHE English Olympiad (10,040+ students, 25 schools) held on 13–16 October 2025.",
    hi: "TEJAS अंग्रेज़ी की परीक्षा 10 दिसंबर 2026 को है। कक्षा III–X।",
  },
  status: "active",
  icon: "book-open",
  color: "#E85D04",
  grades: currentCycle.grades,
  duration: { en: "60 minutes", hi: "60 मिनट" },
  questions: 50,
  registrationOpen: true,
  partner: pastEnglishOlympiad2025.partner,
  eligibility: [
    {
      en: "Students enrolled in recognised schools across Bharat",
      hi: "भारत भर के मान्यता प्राप्त विद्यालयों में नामांकित विद्यार्थी",
    },
    {
      en: "Grade range: Classes III–X (Current TEJAS Edition)",
      hi: "कक्षा सीमा: कक्षा III–X (वर्तमान TEJAS संस्करण)",
    },
    {
      en: "School registration through Olympiad Cell, DHE official channels",
      hi: "DHE ओलंपियाड सेल के आधिकारिक चैनलों के माध्यम से विद्यालय पंजीकरण",
    },
    {
      en: "One attempt per edition per student",
      hi: "प्रति संस्करण प्रति विद्यार्थी एक प्रयास",
    },
  ],
  examPattern: [
    {
      section: { en: "Vocabulary & Grammar", hi: "शब्दावली एवं व्याकरण" },
      questions: 20,
      marks: 20,
    },
    {
      section: { en: "Reading Comprehension", hi: "पठन बोध" },
      questions: 15,
      marks: 15,
    },
    {
      section: { en: "Creative Language Usage", hi: "रचनात्मक भाषा उपयोग" },
      questions: 10,
      marks: 10,
    },
    {
      section: { en: "Analytical & Application", hi: "विश्लेषणात्मक एवं अनुप्रयोग" },
      questions: 5,
      marks: 5,
    },
  ],
  syllabus: [
    {
      level: { en: "Level A", hi: "स्तर A" },
      classes: { en: "Class I–II", hi: "कक्षा I–II" },
      topics: [
        { en: "Basic vocabulary & picture-word association", hi: "मूल शब्दावली एवं चित्र-शब्द संबंध" },
        { en: "Simple sentence formation", hi: "सरल वाक्य निर्माण" },
        { en: "Phonics & pronunciation basics", hi: "ध्वन्यात्मकता एवं उच्चारण मूल बातें" },
      ],
    },
    {
      level: { en: "Level B", hi: "स्तर B" },
      classes: { en: "Class III–IV", hi: "कक्षा III–IV" },
      topics: [
        { en: "Parts of speech & tenses", hi: "शब्द भेद एवं काल" },
        { en: "Short passage comprehension", hi: "लघु गद्यांश बोध" },
        { en: "Synonyms, antonyms & spelling", hi: "पर्यायवाची, विलोम एवं वर्तनी" },
      ],
    },
    {
      level: { en: "Level C", hi: "स्तर C" },
      classes: { en: "Class V–VI", hi: "कक्षा V–VI" },
      topics: [
        { en: "Advanced grammar & sentence transformation", hi: "उन्नत व्याकरण एवं वाक्य परिवर्तन" },
        { en: "Paragraph comprehension & inference", hi: "अनुच्छेद बोध एवं निष्कर्ष" },
        { en: "Creative writing prompts", hi: "रचनात्मक लेखन संकेत" },
      ],
    },
    {
      level: { en: "Level D", hi: "स्तर D" },
      classes: { en: "Class VII–VIII", hi: "कक्षा VII–VIII" },
      topics: [
        { en: "Complex grammar & error detection", hi: "जटिल व्याकरण एवं त्रुटि पहचान" },
        { en: "Literary devices & figurative language", hi: "साहित्यिक उपकरण एवं रूपक भाषा" },
        { en: "Critical reading & analysis", hi: "आलोचनात्मक पठन एवं विश्लेषण" },
      ],
    },
    {
      level: { en: "Level E", hi: "स्तर E" },
      classes: { en: "Class IX–X", hi: "कक्षा IX–X" },
      topics: [
        { en: "Advanced comprehension & summarisation", hi: "उन्नत बोध एवं सारांश" },
        { en: "Essay-style & argumentative prompts", hi: "निबंध एवं तर्कपूर्ण संकेत" },
        { en: "Communication skills & global expression", hi: "संचार कौशल एवं वैश्विक अभिव्यक्ति" },
      ],
    },
  ],
  preparationRoadmap: [
    {
      phase: { en: "Foundation (Weeks 1–2)", hi: "नींव (सप्ताह 1–2)" },
      description: {
        en: "Review grade-appropriate grammar rules, build daily vocabulary lists, and practice 10 MCQs daily.",
        hi: "कक्षा-अनुकूल व्याकरण नियमों की समीक्षा, दैनिक शब्दावली सूची और प्रतिदिन 10 MCQ अभ्यास।",
      },
    },
    {
      phase: { en: "Comprehension (Weeks 3–4)", hi: "बोध (सप्ताह 3–4)" },
      description: {
        en: "Practice reading passages from NCERT readers and newspapers. Focus on inference and main-idea questions.",
        hi: "NCERT पाठ्यपुस्तकों और समाचार पत्रों से गद्यांश अभ्यास। निष्कर्ष और मुख्य विचार प्रश्नों पर ध्यान।",
      },
    },
    {
      phase: { en: "Mock & OMR Practice (Weeks 5–6)", hi: "मॉक एवं OMR अभ्यास (सप्ताह 5–6)" },
      description: {
        en: "Take full-length mock tests using OMR sheets. Practice time management — 50 questions in 60 minutes.",
        hi: "OMR शीट का उपयोग कर पूर्ण लंबाई मॉक टेस्ट। समय प्रबंधन — 60 मिनट में 50 प्रश्न।",
      },
    },
  ],
  books: [
    {
      title: { en: "DHE English Olympiad Workbook — Level-wise", hi: "DHE अंग्रेज़ी ओलंपियाड कार्यपुस्तिका — स्तरवार" },
      author: { en: "Olympiad Cell, DHE", hi: "ओलंपियाड सेल, DHE" },
      publisher: { en: "DHE Publications", hi: "DHE प्रकाशन" },
      description: {
        en: "Official preparation workbook aligned with five examination levels (A–E).",
        hi: "पाँच परीक्षा स्तरों (A–E) के अनुरूप आधिकारिक तैयारी कार्यपुस्तिका।",
      },
    },
    {
      title: { en: "English Connection — Language Enhancement Series", hi: "English Connection — भाषा विकास श्रृंखला" },
      author: { en: "English Connection", hi: "English Connection" },
      publisher: { en: "Collaborating Partner", hi: "सहयोगी भागीदार" },
      description: {
        en: "Partner resource for the 1st DHE English Olympiad — vocabulary and comprehension modules.",
        hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड के लिए साझेदार संसाधन।",
      },
    },
    {
      title: { en: "1st DHE English Olympiad — Previous Year Collection", hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड — पिछले वर्ष संग्रह" },
      author: { en: "TEJAS Editorial Board", hi: "TEJAS संपादकीय मंडल" },
      publisher: { en: "TEJAS Publications", hi: "TEJAS प्रकाशन" },
    },
  ],
  mockTests: [
    {
      id: "eng-mock-a",
      title: { en: "Mock Test — Level A (Classes I–II)", hi: "मॉक टेस्ट — स्तर A" },
      questions: 30,
      duration: "45 min",
      level: { en: "Level A", hi: "स्तर A" },
    },
    {
      id: "eng-mock-c",
      title: { en: "Mock Test — Level C (Classes V–VI)", hi: "मॉक टेस्ट — स्तर C" },
      questions: 40,
      duration: "50 min",
      level: { en: "Level C", hi: "स्तर C" },
    },
    {
      id: "eng-mock-e",
      title: { en: "Mock Test — Level E (Classes IX–X)", hi: "मॉक टेस्ट — स्तर E" },
      questions: 50,
      duration: "60 min",
      level: { en: "Level E", hi: "स्तर E" },
    },
  ],
  samplePapers: [
    {
      id: "eng-sample-b",
      title: { en: "Sample Paper — Level B", hi: "नमूना प्रश्नपत्र — स्तर B" },
      year: 2026,
      level: { en: "Level B — Classes III–IV", hi: "स्तर B" },
      edition: CURRENT_EDITION_LABEL,
    },
    {
      id: "eng-sample-d",
      title: { en: "Sample Paper — Level D", hi: "नमूना प्रश्नपत्र — स्तर D" },
      year: 2026,
      level: { en: "Level D — Classes VII–VIII", hi: "स्तर D" },
      edition: CURRENT_EDITION_LABEL,
    },
  ],
  previousPapers: [
    {
      id: "eng-2025-all",
      title: { en: "1st DHE English Olympiad — All Levels", hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड — सभी स्तर" },
      year: 2025,
      level: { en: "Levels A–E", hi: "स्तर A–E" },
      edition: "SMK 5.0",
    },
  ],
  videoLectures: [
    {
      id: "eng-v1",
      title: { en: "English Olympiad Strategy — Olympiad Cell", hi: "अंग्रेज़ी ओलंपियाड रणनीति" },
      duration: "45 min",
      speaker: { en: "Olympiad Cell, DHE", hi: "ओलंपियाड सेल, DHE" },
    },
    {
      id: "eng-v2",
      title: { en: "Reading Comprehension Masterclass", hi: "पठन बोध मास्टरक्लास" },
      duration: "30 min",
      speaker: { en: "English Connection", hi: "English Connection" },
    },
  ],
  awards: [
    {
      level: { en: "Overall Top 3 (Each Level)", hi: "समग्र शीर्ष 3 (प्रत्येक स्तर)" },
      description: {
        en: "₹3,100, ₹2,100, and ₹1,500, plus five consolation prizes of ₹500, for overall toppers in each class across participating schools. Outstanding students also receive gold, silver, and bronze medals.",
        hi: "₹3,100, ₹2,100, ₹1,500 और पाँच सांत्वना पुरस्कार ₹500।",
      },
    },
    {
      level: { en: "School-wise Top 3 (Each Level)", hi: "विद्यालयवार शीर्ष 3" },
      description: {
        en: "Medals, certificates, and recognition for school-level champions at each of five levels",
        hi: "पाँच स्तरों में विद्यालय स्तर चैंपियन के लिए पदक और प्रमाणपत्र",
      },
    },
    {
      level: { en: "All Participants", hi: "सभी प्रतिभागी" },
      description: {
        en: "Digital participation certificate with verification QR code",
        hi: "सत्यापन QR कोड के साथ डिजिटल सहभागिता प्रमाणपत्र",
      },
    },
    {
      level: { en: "TEJAS National Felicitation", hi: "TEJAS राष्ट्रीय सम्मान" },
      description: {
        en: "Top achievers honoured at the TEJAS National Felicitation Ceremony — independent event, details TBA",
        hi: "TEJAS राष्ट्रीय सम्मान समारोह में शीर्ष achievers",
      },
    },
  ],
  faqs: [
    {
      question: {
        en: "What was the 1st DHE English Olympiad?",
        hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड क्या था?",
      },
      answer: {
        en: "The first-ever DHE English Olympiad was conducted 13–16 October 2025 across 25 schools in Punjab, Haryana and Chandigarh, with 10,040+ students from Classes I–X. It was organised by Olympiad Cell, DHE in collaboration with English Connection under Shiksha Mahakumbh 5th Edition.",
        hi: "13–16 अक्टूबर 2025 को पंजाब, हरियाणा और चंडीगढ़ के 25 विद्यालयों में 10,040+ छात्रों के साथ आयोजित।",
      },
    },
    {
      question: {
        en: "When is the next DHE English Olympiad?",
        hi: "अगला DHE अंग्रेज़ी ओलंपियाड कब है?",
      },
      answer: {
        en: "TEJAS English is on 10 December 2026. Schools register from 1 November 2026 to 20 November 2026. The fee is ₹100 per student per stream.",
        hi: "TEJAS अंग्रेज़ी 10 दिसंबर 2026 को है। पंजीकरण 1–20 नवंबर 2026।",
      },
    },
    {
      question: { en: "Is there negative marking?", hi: "क्या नegative marking है?" },
      answer: {
        en: "No negative marking. The examination uses MCQ format with OMR sheets for transparency and fairness.",
        hi: "कोई negative marking नहीं। OMR शीट के साथ MCQ प्रारूप।",
      },
    },
    {
      question: { en: "How do schools participate?", hi: "विद्यालय कैसे भाग लें?" },
      answer: {
        en: "Schools register at /schools/register. Write to tejasolympiad@shikshamahakumbh.com or call +91-99886 90588.",
        hi: "विद्यालय /schools/register पर पंजीकरण करें।",
      },
    },
  ],
  teacherGuide: [
    {
      title: { en: "Role of Teachers", hi: "शिक्षकों की भूमिका" },
      points: [
        { en: "Identify meritorious students across all five levels (A–E)", hi: "पाँच स्तरों में meritorious छात्रों की पहचान" },
        { en: "Conduct weekly vocabulary and comprehension drills", hi: "साप्ताहिक शब्दावली और बोध अभ्यास" },
        { en: "Familiarise students with OMR sheet marking practice", hi: "OMR शीट अभ्यास से परिचित कराएँ" },
      ],
    },
    {
      title: { en: "School Coordination", hi: "विद्यालय समन्वय" },
      points: [
        { en: "Nominate an Olympiad Coordinator for DHE communication", hi: "DHE संचार के लिए ओलंपियाड समन्वयक नामित करें" },
        { en: "Ensure exam venue readiness and invigilation standards", hi: "परीक्षा स्थल और निरीक्षण मानक सुनिश्चित करें" },
        { en: "Share results and certificates with parents promptly", hi: "परिणाम और प्रमाणपत्र अभिभावकों को साझा करें" },
      ],
    },
  ],
  parentGuide: [
    {
      title: { en: "Supporting Your Child", hi: "अपने बच्चे का समर्थन" },
      points: [
        { en: "Encourage daily reading — newspapers, storybooks, and NCERT texts", hi: "दैनिक पठन प्रोत्साहित करें" },
        { en: "Create a quiet 30-minute daily practice routine", hi: "30 मिनट का दैनिक अभ्यास समय" },
        { en: "Focus on effort and learning, not just rank", hi: "केवल रैंक नहीं, प्रयास और सीख पर ध्यान" },
      ],
    },
    {
      title: { en: "Exam Day Tips", hi: "परीक्षा दिवस सुझाव" },
      points: [
        { en: "Ensure proper rest and a healthy breakfast", hi: "पर्याप्त विश्राम और स्वस्थ नाश्ता" },
        { en: "Carry admit card, school ID, and required stationery", hi: "प्रवेश पत्र, ID और stationery लाएँ" },
        { en: "Teach OMR filling technique before exam day", hi: "परीक्षा से पहले OMR भरने की तकनीक सिखाएँ" },
      ],
    },
  ],
  schoolGuide: [
    {
      title: { en: "Registration Process", hi: "पंजीकरण प्रक्रिया" },
      points: [
        { en: "Register via Olympiad Cell, DHE official channels", hi: "DHE ओलंपियाड सेल के आधिकारिक चैनलों से पंजीकरण" },
        { en: "Submit student list by level (A–E) with accurate class mapping", hi: "स्तर (A–E) के अनुसार छात्र सूची जमा करें" },
        { en: "Coordinate exam dates within the announced window", hi: "घोषित अवधि में परीक्षा तिथि समन्वय" },
      ],
    },
    {
      title: { en: "Benefits for Schools", hi: "विद्यालयों के लिए लाभ" },
      points: [
        { en: "Data-driven academic insights from Olympiad performance", hi: "ओलंपियाड प्रदर्शन से डेटा-संचालित अंतर्दृष्टि" },
        { en: "Multi-level recognition and motivation system", hi: "बहु-स्तरीय मान्यता प्रणाली" },
        { en: "Visibility at Shiksha Mahakumbh national platform", hi: "शिक्षा महाकुंभ राष्ट्रीय मंच पर दृश्यता" },
      ],
    },
  ],
  calendar: [
    {
      label: { en: "1st DHE English Olympiad (Past)", hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड" },
      date: "2025-10-13",
      status: "completed",
    },
    {
      label: { en: "Overall Toppers Felicitation — SMK 5.0", hi: "समग्र शीर्ष achievers — SMK 5.0" },
      date: "2025-11-01",
      status: "completed",
    },
    {
      label: { en: "School-wise Felicitation — CSIR CSIO", hi: "विद्यालयवार सम्मान" },
      date: "2026-02-13",
      status: "completed",
    },
    {
      label: { en: "DHE English Olympiad 2.0 — Registration Opens", hi: "पंजीकरण प्रारंभ" },
      date: "2026-07-01",
      status: "tba",
    },
    {
      label: { en: "DHE English Olympiad 2.0 — Examination", hi: "परीक्षा" },
      date: "2026-09-01",
      status: "tba",
    },
    {
      label: { en: "Top Achievers Felicitation — TEJAS National Ceremony", hi: "TEJAS राष्ट्रीय सम्मान" },
      date: "2026-10-01",
      status: "tba",
    },
  ],
  hallOfFameHighlights: [
    { name: "Kanav Goyal", school: "Wisdom World School, Kurukshetra", level: { en: "Level D — 1st", hi: "स्तर D — प्रथम" }, year: 2025 },
    { name: "Nidhi", school: "Sharda Sarvhitkari School, Chandigarh", level: { en: "Level E — 1st", hi: "स्तर E — प्रथम" }, year: 2025 },
    { name: "Kasak Thakur", school: "Kundan International School, Chandigarh", level: { en: "Level B — 1st", hi: "स्तर B — प्रथम" }, year: 2025 },
    { name: "Nashra", school: "St. Vivekanand Millennium School, Pinjore", level: { en: "Level A — 1st", hi: "स्तर A — प्रथम" }, year: 2025 },
  ],
  skillsDeveloped: [
    { en: "Vocabulary building and contextual usage", hi: "शब्दावली निर्माण" },
    { en: "Reading comprehension and inference", hi: "पठन बोध और निष्कर्ष" },
    { en: "Grammar accuracy and sentence structure", hi: "व्याकरण शुद्धता" },
    { en: "Creative and analytical writing", hi: "रचनात्मक और विश्लेषणात्मक लेखन" },
    { en: "OMR-based exam discipline and time management", hi: "OMR अनुशासन और समय प्रबंधन" },
  ],
  learningOutcomes: [
    { en: "Strengthen linguistic fundamentals from an early age", hi: "प्रारंभिक आयु से भाषा की मजबूत नींव" },
    { en: "Build confidence for global communication while rooted in Bharatiya values", hi: "भारतीय मूल्यों में निहित वैश्विक संचार आत्मविश्वास" },
    { en: "Develop competitive spirit and exam readiness", hi: "प्रतियोगी भावना और परीक्षा तैयारी" },
  ],
  careerPathways: [
    { en: "Journalism, media, and content creation", hi: "पत्रकारिता, मीडिया और content creation" },
    { en: "Law, civil services, and public policy", hi: "विधि, civil services और public policy" },
    { en: "Teaching, translation, and language research", hi: "शिक्षण, अनुवाद और भाषा अनुसंधान" },
    { en: "International relations and diplomacy", hi: "अंतर्राष्ट्रीय संबंध और diplomacy" },
  ],
  sampleQuestions: [
    {
      question: { en: "Choose the synonym of 'Benevolent': (a) Kind (b) Cruel (c) Silent (d) Swift", hi: "Benevolent का पर्यायवाची चुनें" },
      hint: { en: "Level D — Vocabulary", hi: "स्तर D — शब्दावली" },
    },
    {
      question: { en: "Read: 'The early bird catches the worm.' What does this proverb mean?", hi: "यह कहावत क्या अर्थ देती है?" },
      hint: { en: "Level C — Comprehension", hi: "स्तर C — बोध" },
    },
    {
      question: { en: "Identify the error: 'She don't like apples.'", hi: "त्रुटि पहचानें" },
      hint: { en: "Level E — Grammar", hi: "स्तर E — व्याकरण" },
    },
  ],
};
