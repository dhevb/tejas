import type { LocalizedString } from "./types";

/**
 * Approved facts for TEJAS Olympiad 2026–27.
 * Source: the invitation letter dated 31 October 2026 and the latest approved programme details.
 * Historical 2025 figures stay in `pastEnglishOlympiad2025` and must not be presented as this edition.
 * Do not add a date, fee, eligibility rule, award, contact, syllabus, or result that is not recorded here.
 */
export const programme = {
  name: "TEJAS Olympiad 2026–27",
  fullForm: "Talent Exploration for Junior Aspiring Scholars",
  tagline: "Find your spark...",
  organiser: "Department of Holistic Education (DHE)",
  affiliation: "Vidya Bharti Institute of Training & Research Trust (VBITR), Kurukshetra",
  email: "tejas@dhe.org.in",
  phones: [
    { display: "+91 99886 90588", tel: "+919988690588" },
    { display: "+91 79034 31900", tel: "+917903431900" },
  ],
  registrationOpens: "3 November 2026",
  registrationCloses: "20 November 2026",
  streams: [
    { id: "mathematics", name: "TEJAS Mathematics", classes: "Classes III–X", examDate: "9 December 2026" },
    { id: "english", name: "TEJAS English", classes: "Classes III–X", examDate: "10 December 2026" },
    { id: "technology", name: "TEJAS Future Tech", classes: "Classes VI–X", examDate: "11 December 2026" },
  ],
  registrationGross: 150,
  registrationSchoolShare: 30,
  registrationPayable: 120,
  bookGross: 170,
  bookSchoolShare: 34,
  bookPayable: 136,
  ebookInvitationPrice: 49,
  ebookSaleOpen: false,
  prizes: { first: 3100, second: 2100, third: 1500, consolation: 500, consolationCount: 10 },
  awards:
    "For each class in each of the three streams, the first prize is ₹3,100, the second prize is ₹2,100, the third prize is ₹1,500, and there are ten consolation prizes of ₹500 each. Participating schools with the highest participation receive recognition, and the Principal receives a Certificate of Appreciation.",
  results: "A results date has not been announced.",
  syllabus: "The syllabus, question count, duration, and section pattern will be announced officially.",
  examProcess: [
    "Examinations are conducted offline at participating schools.",
    "Question papers and OMR sheets are dispatched to schools in advance.",
    "Completed OMR sheets are couriered on the same day to the designated evaluation centre.",
    "The evaluation centre address is communicated through detailed instructions.",
  ],
} as const;

/** Current TEJAS Olympiad 2026–27, drawn from the approved programme record above. */
export const currentCycle = {
  editionSlug: "tejas-2026-27",
  editionName: {
    en: programme.name,
    hi: "TEJAS ओलंपियाड 2026–27",
  } satisfies LocalizedString,
  editionYear: 2026,
  independenceNote: {
    en: `${programme.name} is organised by the ${programme.organiser}, ${programme.affiliation}. The 1st DHE English Olympiad (2025) was a separate examination.`,
    hi: "TEJAS ओलंपियाड 2026–27 का आयोजन समग्र शिक्षा विभाग (DHE), विद्या भारती इंस्टिट्यूट ऑफ ट्रेनिंग एंड रिसर्च ट्रस्ट (VBITR), कुरुक्षेत्र करता है। प्रथम DHE अंग्रेज़ी ओलंपियाड (2025) एक अलग परीक्षा थी।",
  } satisfies LocalizedString,
  activeStreams: ["english", "mathematics", "technology"] as const,
  grades: {
    en: "TEJAS English and TEJAS Mathematics: Classes III–X. TEJAS Future Tech: Classes VI–X.",
    hi: "TEJAS अंग्रेज़ी और TEJAS गणित: कक्षा III–X। TEJAS फ्यूचर टेक: कक्षा VI–X।",
  } satisfies LocalizedString,
  registrationStatus: {
    en: `Registration opens on ${programme.registrationOpens} and closes on ${programme.registrationCloses}.`,
    hi: "पंजीकरण 3 नवंबर 2026 को खुलता है और 20 नवंबर 2026 को बंद होता है।",
  } satisfies LocalizedString,
  examDates: {
    en: "Mathematics 9 December 2026, English 10 December 2026, Future Tech 11 December 2026.",
    hi: "गणित 9 दिसंबर 2026, अंग्रेज़ी 10 दिसंबर 2026, फ्यूचर टेक 11 दिसंबर 2026।",
  } satisfies LocalizedString,
  fee: {
    en: "The registration fee is ₹150 per student per stream. The school retains ₹30 and remits ₹120 to TEJAS. Printed books are optional at ₹170 per copy; the school retains ₹34 and remits ₹136.",
    hi: "शुल्क ₹150 प्रति विद्यार्थी प्रति स्ट्रीम है। विद्यालय ₹30 रखता है और ₹120 TEJAS को भेजता है। मुद्रित पुस्तक ₹170 प्रति प्रति, वैकल्पिक; विद्यालय ₹34 रखता है और ₹136 भेजता है।",
  } satisfies LocalizedString,
  felicitation: {
    en: programme.awards,
    hi: "प्रत्येक स्ट्रीम की प्रत्येक कक्षा में प्रथम पुरस्कार ₹3,100, द्वितीय ₹2,100, तृतीय ₹1,500, और दस सांत्वना पुरस्कार ₹500 प्रत्येक। सर्वाधिक भागीदारी वाले विद्यालयों को मान्यता मिलती है और प्रधानाचार्य को प्रशस्ति पत्र मिलता है।",
  } satisfies LocalizedString,
  results: {
    en: programme.results,
    hi: "परिणाम की तिथि घोषित नहीं हुई है।",
  } satisfies LocalizedString,
  administeredBy: {
    en: `${programme.organiser}, ${programme.affiliation}`,
    hi: "समग्र शिक्षा विभाग (DHE), विद्या भारती इंस्टिट्यूट ऑफ ट्रेनिंग एंड रिसर्च ट्रस्ट (VBITR), कुरुक्षेत्र",
  } satisfies LocalizedString,
  phones: programme.phones,
  academicEnquiries: programme.email,
  olympiadEmail: programme.email,
  shikshaMahakumbhReference: "https://www.shikshamahakumbh.com",
  registrationHref: "/schools/register",
} as const;

/** Edition label used where a current-edition name is required. */
export const CURRENT_EDITION_LABEL = programme.name;

/** 1st DHE English Olympiad — past cycle. These figures are 2025 only. */
export const pastEnglishOlympiad2025 = {
  name: {
    en: "1st DHE English Olympiad",
    hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड",
  } satisfies LocalizedString,
  smkEdition: 5,
  underShikshaMahakumbh: {
    en: "Conducted under the aegis of Shiksha Mahakumbh 5th Edition",
    hi: "शिक्षा महाकुंभ के 5वें संस्करण के अंतर्गत आयोजित",
  } satisfies LocalizedString,
  examDates: {
    en: "13–16 October 2025",
    hi: "13–16 अक्टूबर 2025",
  } satisfies LocalizedString,
  regions: {
    en: "Punjab, Haryana & Chandigarh (Tricity)",
    hi: "पंजाब, हरियाणा और चंडीगढ़ (ट्राइसिटी)",
  } satisfies LocalizedString,
  totalStudents: 10040,
  totalSchools: 25,
  format: {
    en: "MCQ format using OMR sheets",
    hi: "OMR शीट पर MCQ प्रारूप",
  } satisfies LocalizedString,
  partner: {
    en: "English Connection — language enhancement platform",
    hi: "English Connection — भाषा विकास मंच",
  } satisfies LocalizedString,
  overallFelicitation: {
    en: "1 November 2025 at Shiksha Mahakumbh 5th Edition, NIPER Mohali",
    hi: "1 नवंबर 2025 — शिक्षा महाकुंभ 5वाँ संस्करण, NIPER मोहाली",
  } satisfies LocalizedString,
  schoolFelicitation: {
    en: "13 February 2026 at ISTC Auditorium, CSIR–CSIO, Chandigarh",
    hi: "13 फ़रवरी 2026 — ISTC Auditorium, CSIR–CSIO, चंडीगढ़",
  } satisfies LocalizedString,
  levels: [
    { level: "A", classes: { en: "Class I–II", hi: "कक्षा I–II" } },
    { level: "B", classes: { en: "Class III–IV", hi: "कक्षा III–IV" } },
    { level: "C", classes: { en: "Class V–VI", hi: "कक्षा V–VI" } },
    { level: "D", classes: { en: "Class VII–VIII", hi: "कक्षा VII–VIII" } },
    { level: "E", classes: { en: "Class IX–X", hi: "कक्षा IX–X" } },
  ],
} as const;
