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
    duration: ls("60 minutes", "60 मिनट"),
    questions: 50,
    registrationOpen: false,
    eligibility: [
      ls("Students in recognised schools across Bharat", "भारत भर के मान्यता प्राप्त विद्यालयों के छात्र"),
      ls(`Grade range: ${config.grades.en}`, `कक्षा सीमा: ${config.grades.hi}`),
      ls("Launch planned under future TEJAS editions", "भविष्य TEJAS संस्करणों के तहत लॉन्च"),
    ],
    examPattern: [
      { section: ls("Objective MCQs", "वस्तुनिष्ठ MCQ"), questions: 40, marks: 40 },
      { section: ls("Application & Analysis", "अनुप्रयोग एवं विश्लेषण"), questions: 10, marks: 10 },
    ],
    syllabus: [
      {
        level: ls("Grade-appropriate", "कक्षा-अनुकूल"),
        classes: config.grades,
        topics: [
          ls("NCERT-aligned curriculum topics", "NCERT-अनुरूप पाठ्यक्रम"),
          ls("Higher-order thinking questions", "उच्च स्तरीय सोच प्रश्न"),
          ls("Detailed syllabus to be published before launch", "लॉन्च से पहले विस्तृत पाठ्यक्रम"),
        ],
      },
    ],
    preparationRoadmap: [
      {
        phase: ls("Foundation", "नींव"),
        description: ls("Build strong fundamentals in the subject through NCERT and school curriculum.", "NCERT और school curriculum से मजबूत नींव।"),
      },
    ],
    books: [],
    mockTests: [],
    samplePapers: [],
    previousPapers: [],
    videoLectures: [],
    awards: [
      {
        level: ls("National Recognition", "राष्ट्रीय मान्यता"),
        description: ls("Medals, certificates, and Shiksha Mahakumbh felicitation", "पदक, प्रमाणपत्र और SMK सम्मान"),
      },
    ],
    faqs: [
      {
        question: ls(`When will the ${config.name.en} Olympiad launch?`, `${config.name.hi} ओलंपियाड कब लॉन्च होगा?`),
        answer: ls(
          "This stream is part of TEJAS expansion roadmap. DHE Sanskriti Olympiad and additional subjects are planned after the current core streams (English, Maths, Technology).",
          "यह TEJAS विस्तार roadmap का हिस्सा है। वर्तमान core streams के बाद अतिरिक्त विषय।"
        ),
      },
    ],
    teacherGuide: [],
    parentGuide: [],
    schoolGuide: [],
    calendar: [],
    hallOfFameHighlights: [],
    skillsDeveloped: [
      ls("Analytical thinking", "विश्लेषणात्मक सोच"),
      ls("Problem-solving", "समस्या समाधान"),
    ],
    learningOutcomes: [
      ls("Grade-appropriate competency mastery", "कक्षा-अनुकूल दक्षता"),
    ],
    careerPathways: [
      ls("Details published before launch", "लॉन्च से पहले विवरण"),
    ],
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
