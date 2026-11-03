import type { OlympiadPortalContent } from "@/content/types";
import { programme } from "@/content/current-cycle";

function ls(en: string, hi: string) {
  return { en, hi };
}

const awaiting = ls(programme.syllabus, "पाठ्यक्रम, प्रश्न संख्या, अवधि और खंड आधिकारिक रूप से घोषित किए जाएँगे।");

export const englishOlympiad: OlympiadPortalContent = {
  slug: "english",
  name: ls("TEJAS English", "TEJAS अंग्रेज़ी"),
  tagline: ls(programme.tagline, programme.tagline),
  description: ls(
    "TEJAS English is examined offline on 10 December 2026 for Classes III–X. Question papers and OMR sheets are sent to the school in advance. The syllabus, question count, and duration have not been published.",
    "TEJAS अंग्रेज़ी की परीक्षा 10 दिसंबर 2026 को कक्षा III–X के लिए ऑफ़लाइन है। प्रश्नपत्र और OMR पहले भेजे जाते हैं। पाठ्यक्रम, प्रश्न संख्या और अवधि अभी प्रकाशित नहीं हुई है।",
  ),
  whySubject: ls(
    "The brochure says TEJAS English will strengthen language proficiency, comprehension, communication skills and analytical thinking. The 2026–27 examination is offline for Classes III–X. The 1st DHE English Olympiad, held on 13–16 October 2025, is a separate past examination.",
    "13–16 अक्टूबर 2025 का प्रथम DHE अंग्रेज़ी ओलंपियाड एक अलग पिछली परीक्षा है। 2026–27 में TEJAS अंग्रेज़ी कक्षा III–X के लिए है और ऑनलाइन परीक्षा नहीं है।",
  ),
  status: "active",
  icon: "book-open",
  color: "#A3531C",
  grades: ls("Classes III–X", "कक्षा III–X"),
  duration: awaiting,
  questions: 0,
  registrationOpen: true,
  eligibility: [
    ls("Classes III–X.", "कक्षा III–X।"),
    ls("The examination is offline at the participating school on 10 December 2026.", "परीक्षा 10 दिसंबर 2026 को भाग लेने वाले विद्यालय में ऑफ़लाइन होती है।"),
    ls("Schools register. There is no individual online entry.", "पंजीकरण विद्यालय करता है। व्यक्तिगत ऑनलाइन प्रवेश नहीं है।"),
  ],
  examPattern: [],
  syllabus: [],
  preparationRoadmap: [],
  books: [
    {
      title: ls("Printed preparation book", "मुद्रित तैयारी पुस्तक"),
      author: ls("Optional", "वैकल्पिक"),
      publisher: ls("₹170 per copy. The school retains ₹34 and remits ₹136 to TEJAS.", "₹170 प्रति प्रति। विद्यालय ₹34 रखता है और ₹136 TEJAS को भेजता है।"),
      description: ls(`${programme.bookShareUse} ${programme.ebookAccess}`, "मुद्रित पुस्तक अलग आदेश है। ई-बुक अलग पंजीकरण है।"),
    },
  ],
  mockTests: [],
  samplePapers: [],
  previousPapers: [],
  videoLectures: [],
  awards: [
    {
      level: ls("Class-wise prizes", "कक्षावार पुरस्कार"),
      description: ls(programme.awards, "प्रत्येक कक्षा में प्रथम ₹3,100, द्वितीय ₹2,100, तृतीय ₹1,500, और दस सांत्वना पुरस्कार ₹500।"),
    },
  ],
  faqs: [
    {
      question: ls("Which classes may enter TEJAS English?", "TEJAS अंग्रेज़ी में कौन सी कक्षाएँ आ सकती हैं?"),
      answer: ls("Classes III–X.", "कक्षा III–X।"),
    },
    {
      question: ls("When is the examination?", "परीक्षा कब है?"),
      answer: ls(
        "10 December 2026. Schools register from 3 November 2026 to 20 November 2026. The fee is ₹150 per student per stream. The school retains ₹30 and remits ₹120 to TEJAS.",
        "10 दिसंबर 2026। पंजीकरण 3 नवंबर 2026 से 20 नवंबर 2026 तक। शुल्क ₹150 प्रति विद्यार्थी प्रति स्ट्रीम। विद्यालय ₹30 रखता है और ₹120 TEJAS को भेजता है।",
      ),
    },
    {
      question: ls("Has the syllabus been published?", "क्या पाठ्यक्रम प्रकाशित हुआ है?"),
      answer: awaiting,
    },
  ],
  teacherGuide: [],
  parentGuide: [],
  schoolGuide: [
    {
      title: ls("At the school", "विद्यालय में"),
      points: programme.examProcess.map((point) => ls(point, point)),
    },
  ],
  calendar: [
    { label: ls("Registration opens", "पंजीकरण शुरू"), date: "2026-11-03T12:00:00+05:30", status: "upcoming" },
    { label: ls("Registration closes", "पंजीकरण बंद"), date: "2026-11-20T12:00:00+05:30", status: "upcoming" },
    { label: ls("TEJAS English examination", "TEJAS अंग्रेज़ी परीक्षा"), date: "2026-12-10T12:00:00+05:30", status: "upcoming" },
  ],
  hallOfFameHighlights: [],
  skillsDeveloped: [],
  learningOutcomes: [],
  careerPathways: [],
  sampleQuestions: [],
};
