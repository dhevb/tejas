import type { OlympiadPortalContent, LocalizedString } from "@/content/types";

function ls(en: string, hi: string): LocalizedString {
  return { en, hi };
}

interface ComingSoonConfig {
  slug: string;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  whySubject: LocalizedString;
  icon: string;
  color: string;
  grades: LocalizedString;
}

export function createComingSoonOlympiad(config: ComingSoonConfig): OlympiadPortalContent {
  return {
    ...config,
    status: "coming-soon",
    duration: ls("Not published", "प्रकाशित नहीं"),
    questions: 0,
    registrationOpen: false,
    eligibility: [
      ls("This stream is not part of TEJAS Olympiad 2026–27.", "यह TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं है।"),
      ls("No class range has been published.", "कक्षा सीमा प्रकाशित नहीं हुई है।"),
    ],
    examPattern: [],
    syllabus: [],
    preparationRoadmap: [],
    books: [],
    mockTests: [],
    samplePapers: [],
    previousPapers: [],
    videoLectures: [],
    awards: [],
    faqs: [
      {
        question: ls(`When will the ${config.name.en} Olympiad launch?`, `${config.name.hi} ओलंपियाड कब लॉन्च होगा?`),
        answer: ls(
          "This stream is not part of TEJAS Olympiad 2026–27. No launch date has been published.",
          "यह TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं है। लॉन्च की तारीख प्रकाशित नहीं हुई है।"
        ),
      },
    ],
    teacherGuide: [],
    parentGuide: [],
    schoolGuide: [],
    calendar: [],
    hallOfFameHighlights: [],
    skillsDeveloped: [],
    learningOutcomes: [],
    careerPathways: [],
    sampleQuestions: [],
  };
}

export const scienceOlympiad = createComingSoonOlympiad({
  slug: "science",
  name: ls("Science", "विज्ञान"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "A Science Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "विज्ञान ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe a Science examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ विज्ञान परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "flask",
  color: "#047857",
  grades: ls("Not published", "प्रकाशित नहीं"),
});

export const hindiOlympiad = createComingSoonOlympiad({
  slug: "hindi",
  name: ls("Hindi", "हिंदी"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "A Hindi Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "हिंदी ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe a Hindi examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ हिंदी परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "languages",
  color: "#A3531C",
  grades: ls("Not published", "प्रकाशित नहीं"),
});

export const sanskritOlympiad = createComingSoonOlympiad({
  slug: "sanskrit",
  name: ls("Sanskrit", "संस्कृत"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "A Sanskrit Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "संस्कृत ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe a Sanskrit examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ संस्कृत परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "scroll",
  color: "#8A5A10",
  grades: ls("Not published", "प्रकाशित नहीं"),
});

export const generalKnowledgeOlympiad = createComingSoonOlympiad({
  slug: "general-knowledge",
  name: ls("General Knowledge", "सामान्य ज्ञान"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "A General Knowledge Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "सामान्य ज्ञान ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe a General Knowledge examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ सामान्य ज्ञान परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "globe",
  color: "#1A2B5D",
  grades: ls("Not published", "प्रकाशित नहीं"),
});

export const aiOlympiad = createComingSoonOlympiad({
  slug: "ai",
  name: ls("AI & Data Science", "कृत्रिम बुद्धिमत्ता"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "An AI and Data Science Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "कृत्रिम बुद्धिमत्ता ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe an AI examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ कृत्रिम बुद्धिमत्ता परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "brain",
  color: "#101C40",
  grades: ls("Not published", "प्रकाशित नहीं"),
});

export const codingOlympiad = createComingSoonOlympiad({
  slug: "coding",
  name: ls("Coding", "कोडिंग"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "A Coding Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "कोडिंग ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe a Coding examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ कोडिंग परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "code",
  color: "#7C3A12",
  grades: ls("Not published", "प्रकाशित नहीं"),
});

export const innovationOlympiad = createComingSoonOlympiad({
  slug: "innovation",
  name: ls("Innovation", "नवाचार"),
  tagline: ls("Not part of TEJAS Olympiad 2026–27", "TEJAS ओलंपियाड 2026–27 का हिस्सा नहीं"),
  description: ls(
    "An Innovation Olympiad has not been announced. No class range, syllabus, or examination date has been published.",
    "नवाचार ओलंपियाड की घोषणा नहीं हुई है। कक्षा सीमा, पाठ्यक्रम या परीक्षा तिथि प्रकाशित नहीं हुई है।"
  ),
  whySubject: ls(
    "This page does not describe an Innovation examination. The open streams are Mathematics, English, and Future Tech.",
    "यह पृष्ठ नवाचार परीक्षा का विवरण नहीं है। खुली स्ट्रीम अंग्रेज़ी, गणित और फ्यूचर टेक हैं।"
  ),
  icon: "lightbulb",
  color: "#5C3D12",
  grades: ls("Not published", "प्रकाशित नहीं"),
});
