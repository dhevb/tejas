import type { OlympiadPortalContent } from "@/content/types";
import { programme } from "@/content/current-cycle";

function ls(en: string, hi: string) {
  return { en, hi };
}

const awaiting = ls(programme.syllabus, "पाठ्यक्रम, प्रश्न संख्या, अवधि और खंड आधिकारिक रूप से घोषित किए जाएँगे।");

export const technologyOlympiad: OlympiadPortalContent = {
  slug: "technology",
  name: ls("TEJAS Future Tech", "TEJAS फ्यूचर टेक"),
  tagline: ls(programme.tagline, programme.tagline),
  description: ls(
    "TEJAS Future Tech is examined offline on 11 December 2026 for Classes VI–X. It is not open to Classes III–V. The examination uses question papers and OMR sheets at the school. It is not a computer-based examination. The syllabus, question count, and duration have not been published.",
    "TEJAS फ्यूचर टेक की परीक्षा 11 दिसंबर 2026 को कक्षा VI–X के लिए ऑफ़लाइन है। कक्षा III–V के लिए नहीं है। यह कंप्यूटर-आधारित परीक्षा नहीं है। पाठ्यक्रम अभी प्रकाशित नहीं हुआ है।",
  ),
  whySubject: ls(
    "The brochure says TEJAS Future Tech will encourage scientific curiosity, technological awareness, innovation, and readiness for future-oriented learning. Eligibility is Classes VI–X. The examination is offline and uses OMR sheets. It is not a computer-based test.",
    "फ्यूचर टेक TEJAS ओलंपियाड 2026–27 की तीन स्ट्रीम में से एक है। पात्रता केवल कक्षा VI–X है।",
  ),
  status: "active",
  icon: "cpu",
  color: "#8A5A10",
  grades: ls("Classes VI–X", "कक्षा VI–X"),
  duration: awaiting,
  questions: 0,
  registrationOpen: true,
  eligibility: [
    ls("Classes VI–X. Classes III, IV, and V are not eligible.", "कक्षा VI–X। कक्षा III, IV और V पात्र नहीं हैं।"),
    ls("The examination is offline at the participating school on 11 December 2026.", "परीक्षा 11 दिसंबर 2026 को भाग लेने वाले विद्यालय में ऑफ़लाइन होती है।"),
    ls("A computer is not required for the examination. It is an OMR examination, not a computer-based test.", "परीक्षा के लिए कंप्यूटर आवश्यक नहीं है। यह OMR परीक्षा है, कंप्यूटर-आधारित परीक्षा नहीं।"),
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
      question: ls("Can Class V enter Future Tech?", "क्या कक्षा V फ्यूचर टेक में आ सकती है?"),
      answer: ls("No. Future Tech is Classes VI–X. Class VI is eligible.", "नहीं। फ्यूचर टेक कक्षा VI–X के लिए है। कक्षा VI पात्र है।"),
    },
    {
      question: ls("When is the examination?", "परीक्षा कब है?"),
      answer: ls(
        "11 December 2026. Schools register from 3 November 2026 to 20 November 2026. The fee is ₹150 per student per stream. The school retains ₹30 and remits ₹120 to TEJAS.",
        "11 दिसंबर 2026। पंजीकरण 3 नवंबर 2026 से 20 नवंबर 2026 तक। शुल्क ₹150 प्रति विद्यार्थी प्रति स्ट्रीम। विद्यालय ₹30 रखता है और ₹120 TEJAS को भेजता है।",
      ),
    },
    {
      question: ls("Is the examination on a computer?", "क्या परीक्षा कंप्यूटर पर है?"),
      answer: ls("No. It is an offline OMR examination at the participating school.", "नहीं। यह भाग लेने वाले विद्यालय में ऑफ़लाइन OMR परीक्षा है।"),
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
    { label: ls("TEJAS Future Tech examination", "TEJAS फ्यूचर टेक परीक्षा"), date: "2026-12-11T12:00:00+05:30", status: "upcoming" },
  ],
  hallOfFameHighlights: [],
  skillsDeveloped: [],
  learningOutcomes: [],
  careerPathways: [],
  sampleQuestions: [],
};
