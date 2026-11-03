import type { OlympiadPortalContent } from "@/content/types";
import { programme } from "@/content/current-cycle";

function ls(en: string, hi: string) {
  return { en, hi };
}

const awaiting = ls(programme.syllabus, "पाठ्यक्रम, प्रश्न संख्या, अवधि और खंड आधिकारिक रूप से घोषित किए जाएँगे।");

export const mathematicsOlympiad: OlympiadPortalContent = {
  slug: "mathematics",
  name: ls("TEJAS Mathematics", "TEJAS गणित"),
  tagline: ls(programme.tagline, programme.tagline),
  description: ls(
    "TEJAS Mathematics is examined offline on 9 December 2026 for Classes III–X. Question papers and OMR sheets are sent to the school in advance. The syllabus, question count, and duration have not been published.",
    "TEJAS गणित की परीक्षा 9 दिसंबर 2026 को कक्षा III–X के लिए ऑफ़लाइन है। प्रश्नपत्र और OMR पहले भेजे जाते हैं। पाठ्यक्रम, प्रश्न संख्या और अवधि अभी प्रकाशित नहीं हुई है।",
  ),
  whySubject: ls(
    "The brochure says TEJAS Mathematics will develop logical reasoning, problem-solving, conceptual understanding and numerical confidence. The examination is offline for Classes III–X. It is not the 2025 English Olympiad.",
    "TEJAS गणित TEJAS ओलंपियाड 2026–27 की वर्तमान स्ट्रीम है। यह 2025 की अंग्रेज़ी परीक्षा नहीं है और ऑनलाइन परीक्षा नहीं है।",
  ),
  status: "active",
  icon: "calculator",
  color: "#1A2B5D",
  grades: ls("Classes III–X", "कक्षा III–X"),
  duration: awaiting,
  questions: 0,
  registrationOpen: true,
  eligibility: [
    ls("Classes III–X.", "कक्षा III–X।"),
    ls("The examination is offline at the participating school on 9 December 2026.", "परीक्षा 9 दिसंबर 2026 को भाग लेने वाले विद्यालय में ऑफ़लाइन होती है।"),
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
      description: ls(`${programme.bookShareUse} ${programme.ebookAccess}`, "मुद्रित पुस्तक अनिवार्य नहीं है। ई-बुक लॉगिन अभी खुला नहीं है।"),
    },
  ],
  mockTests: [],
  samplePapers: [],
  previousPapers: [],
  videoLectures: [],
  awards: [
    {
      level: ls("Class-wise prizes", "कक्षावार पुरस्कार"),
      description: ls(`${programme.awards} ${programme.brochureAwards} ${programme.awardNote}`, "निमंत्रण में नकद पुरस्कार हैं। ब्रोशर में पदक और ई-प्रमाणपत्र हैं।"),
    },
  ],
  faqs: [
    {
      question: ls("Which classes may enter TEJAS Mathematics?", "TEJAS गणित में कौन सी कक्षाएँ आ सकती हैं?"),
      answer: ls("Classes III–X. Future Tech is a separate stream for Classes VI–X.", "कक्षा III–X। फ्यूचर टेक अलग स्ट्रीम है, कक्षा VI–X।"),
    },
    {
      question: ls("When is the examination?", "परीक्षा कब है?"),
      answer: ls(
        "9 December 2026. Schools register from 3 November 2026 to 20 November 2026. The fee is ₹150 per student per stream. The school retains ₹30 and remits ₹120 to TEJAS.",
        "9 दिसंबर 2026। पंजीकरण 3 नवंबर 2026 से 20 नवंबर 2026 तक। शुल्क ₹150 प्रति विद्यार्थी प्रति स्ट्रीम। विद्यालय ₹30 रखता है और ₹120 TEJAS को भेजता है।",
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
    { label: ls("TEJAS Mathematics examination", "TEJAS गणित परीक्षा"), date: "2026-12-09T12:00:00+05:30", status: "upcoming" },
  ],
  hallOfFameHighlights: [],
  skillsDeveloped: [],
  learningOutcomes: [],
  careerPathways: [],
  sampleQuestions: [],
};
