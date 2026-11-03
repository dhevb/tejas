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
    grades: ls("Not announced", "घोषित नहीं"),
    duration: ls("Not announced", "घोषित नहीं"),
    questions: 0,
    registrationOpen: false,
    description: ls(
      "This subject is not part of TEJAS Olympiad 2026–27. No date, eligibility, fee, or syllabus has been announced for it.",
      "यह विषय TEJAS ओलंपियाड 2026–27 का भाग नहीं है। इसकी तिथि, पात्रता, शुल्क या पाठ्यक्रम घोषित नहीं हुआ है।",
    ),
    whySubject: ls(
      "The active streams are TEJAS English, TEJAS Mathematics, and TEJAS Future Tech.",
      "सक्रिय स्ट्रीम TEJAS अंग्रेज़ी, TEJAS गणित और TEJAS फ्यूचर टेक हैं।",
    ),
    tagline: ls("Not part of TEJAS Olympiad 2026–27.", "TEJAS ओलंपियाड 2026–27 का भाग नहीं।"),
    eligibility: [
      ls("Not part of TEJAS Olympiad 2026–27.", "TEJAS ओलंपियाड 2026–27 का भाग नहीं।"),
      ls("Eligibility will be announced officially if this subject is approved for a later edition.", "यदि यह विषय बाद के संस्करण के लिए स्वीकृत होता है, तो पात्रता आधिकारिक रूप से घोषित होगी।"),
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
        question: ls(`Is ${config.name.en} part of TEJAS Olympiad 2026–27?`, `क्या ${config.name.hi} TEJAS ओलंपियाड 2026–27 का भाग है?`),
        answer: ls(
          "No. The active streams are TEJAS English, TEJAS Mathematics, and TEJAS Future Tech. A later subject will be announced officially if it is approved.",
          "नहीं। सक्रिय स्ट्रीम TEJAS अंग्रेज़ी, TEJAS गणित और TEJAS फ्यूचर टेक हैं। बाद का विषय स्वीकृत होने पर आधिकारिक रूप से घोषित होगा।",
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
  tagline: ls("Physics, chemistry, biology, and scientific inquiry", "भौतिकी, रसायन, जीव विज्ञान और वैज्ञानिक जिज्ञासा"),
  description: ls(
    "Explore the wonders of science through objective assessment aligned with NCERT curriculum and NEP 2020 competencies.",
    "NCERT पाठ्यक्रम और NEP 2020 competencies के अनुरूप वैज्ञानिक मूल्यांकन।"
  ),
  whySubject: ls(
    "Science drives innovation and national progress. From CV Raman to ISRO, Bharat's scientific heritage inspires the next generation of researchers.",
    "विज्ञान नवाचार और राष्ट्रीय प्रगति को आगे बढ़ाता है।"
  ),
  icon: "flask",
  color: "#047857",
  grades: ls("Classes I–XII", "कक्षा I–XII"),
});

export const hindiOlympiad = createComingSoonOlympiad({
  slug: "hindi",
  name: ls("Hindi", "हिंदी"),
  tagline: ls("Language proficiency, literature, and cultural expression", "भाषा दक्षता, साहित्य और सांस्कृतिक अभिव्यक्ति"),
  description: ls(
    "Celebrate Bharat's national language through grammar, comprehension, and literary appreciation.",
    "व्याकरण, बोध और साहित्यिक appreciation के माध्यम से राष्ट्रभाषा का उत्सव।"
  ),
  whySubject: ls(
    "Hindi connects students to Bharat's rich literary heritage and enables expression in our national language.",
    "हिंदी छात्रों को भारत की साहित्यिक विरासत से जोड़ती है।"
  ),
  icon: "languages",
  color: "#A3531C",
  grades: ls("Classes I–XII", "कक्षा I–XII"),
});

export const sanskritOlympiad = createComingSoonOlympiad({
  slug: "sanskrit",
  name: ls("Sanskrit", "संस्कृत"),
  tagline: ls("Classical language and Bharatiya knowledge traditions", "शास्त्रीय भाषा और भारतीय ज्ञान परंपराएँ"),
  description: ls(
    "DHE Sanskriti Olympiad — connecting students to Sanskrit grammar, shlokas, and Indian Knowledge Systems.",
    "DHE Sanskriti Olympiad — संस्कृत व्याकरण, श्लोक और IKS से जुड़ाव।"
  ),
  whySubject: ls(
    "Sanskrit is the gateway to Bharat's ancient wisdom. DHE plans Sanskriti Olympiad as part of TEJAS expansion.",
    "संस्कृत प्राचीन ज्ञान का द्वार है। DHE Sanskriti Olympiad की योजना।"
  ),
  icon: "scroll",
  color: "#8A5A10",
  grades: ls("Classes V–XII", "कक्षा V–XII"),
});

export const generalKnowledgeOlympiad = createComingSoonOlympiad({
  slug: "general-knowledge",
  name: ls("General Knowledge", "सामान्य ज्ञान"),
  tagline: ls("Current affairs, geography, history, and civic awareness", "समसामयिक, भूगोल, इतिहास और नागरिक जागरूकता"),
  description: ls(
    "Assess awareness of Bharat, the world, and responsible citizenship.",
    "भारत, विश्व और जिम्मेदार नागरिकता की जागरूकता का मूल्यांकन।"
  ),
  whySubject: ls(
    "Well-rounded citizens need awareness beyond textbooks — GK builds informed, engaged learners.",
    "सुसज्जित नागरिकों को पाठ्यपुस्तकों से परे जागरूकता चाहिए।"
  ),
  icon: "globe",
  color: "#1A2B5D",
  grades: ls("Classes III–XII", "कक्षा III–XII"),
});

export const aiOlympiad = createComingSoonOlympiad({
  slug: "ai",
  name: ls("AI & Data Science", "कृत्रिम बुद्धिमत्ता"),
  tagline: ls("Foundations of AI, ethics, and data-driven thinking", "AI की नींव, नैतिकता और डेटा-संचालित सोच"),
  description: ls(
    "Responsible AI foundations for young learners — from data literacy to ethical technology use.",
    "युवा शिक्षार्थियों के लिए जिम्मेदार AI नींव।"
  ),
  whySubject: ls(
    "AI is reshaping every field. TEJAS will prepare students to be creators, not just consumers, of intelligent technology.",
    "AI हर क्षेत्र को बदल रही है। TEJAS छात्रों को intelligent technology के creator बनाएगा।"
  ),
  icon: "brain",
  color: "#101C40",
  grades: ls("Classes VIII–XII", "कक्षा VIII–XII"),
});

export const codingOlympiad = createComingSoonOlympiad({
  slug: "coding",
  name: ls("Coding", "कोडिंग"),
  tagline: ls("Computational thinking, algorithms, and programming logic", "Computational thinking, algorithms और programming logic"),
  description: ls(
    "Build algorithmic thinking and programming foundations through Olympiad-style assessment.",
    "Olympiad-शैली मूल्यांकन से algorithmic thinking।"
  ),
  whySubject: ls(
    "Coding literacy is essential for Viksit Bharat 2047. TEJAS Coding Olympiad will identify young computational thinkers.",
    "Viksit Bharat 2047 के लिए coding literacy आवश्यक।"
  ),
  icon: "code",
  color: "#7C3A12",
  grades: ls("Classes VI–XII", "कक्षा VI–XII"),
});

export const innovationOlympiad = createComingSoonOlympiad({
  slug: "innovation",
  name: ls("Innovation", "नवाचार"),
  tagline: ls("Design thinking, entrepreneurship, and creative problem-solving", "Design thinking, उद्यमिता और रचनात्मक समस्या समाधान"),
  description: ls(
    "Assess creative problem-solving, design thinking, and entrepreneurial mindset.",
    "रचनात्मक समस्या समाधान, design thinking और entrepreneurial mindset का मूल्यांकन।"
  ),
  whySubject: ls(
    "Innovation drives Atmanirbhar Bharat. TEJAS Innovation Olympiad will nurture young entrepreneurs and inventors.",
    "नवाचार आत्मनिर्भर भारत को आगे बढ़ाता है।"
  ),
  icon: "lightbulb",
  color: "#5C3D12",
  grades: ls("Classes IX–XII", "कक्षा IX–XII"),
});
