import type { LocalizedString } from "./types";

/** Current TEJAS Olympiad 2026–27, as printed in the approved brochure. */
export const currentCycle = {
  editionSlug: "tejas-2026-27",
  editionName: {
    en: "TEJAS Olympiad 2026–27",
    hi: "TEJAS ओलंपियाड 2026–27",
  } satisfies LocalizedString,
  editionYear: 2026,
  independenceNote: {
    en: "TEJAS Olympiad 2026–27 is conducted in the 6th Edition of Shiksha Mahakumbh. It is organised by the Department of Holistic Education (DHE), Vidya Bharti Institute of Training & Research Trust (VBITR), Kurukshetra.",
    hi: "TEJAS ओलंपियाड 2026–27 शिक्षा महाकुंभ के 6वें संस्करण में आयोजित है। आयोजक समग्र शिक्षा विभाग (DHE), विद्या भारती इंस्टिट्यूट ऑफ ट्रेनिंग एंड रिसर्च ट्रस्ट (VBITR), कुरुक्षेत्र है।",
  } satisfies LocalizedString,
  activeStreams: ["english", "mathematics", "technology"] as const,
  grades: {
    en: "Classes III–X",
    hi: "कक्षा III–X",
  } satisfies LocalizedString,
  registrationStatus: {
    en: "Registration opens on 3 November 2026 and closes on 20 November 2026.",
    hi: "पंजीकरण 3 नवंबर 2026 से 20 नवंबर 2026 तक खुला है।",
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
    en: "Results are placed in February 2027. A declaration date has not been fixed.",
    hi: "परिणाम फरवरी 2027 में रखे गए हैं। घोषणा की तारीख तय नहीं हुई है।",
  } satisfies LocalizedString,
  administeredBy: {
    en: "Department of Holistic Education (DHE), Vidya Bharti Institute of Training & Research Trust (VBITR), Kurukshetra",
    hi: "समग्र शिक्षा विभाग (DHE), विद्या भारती इंस्टिट्यूट ऑफ ट्रेनिंग एंड रिसर्च ट्रस्ट (VBITR), कुरुक्षेत्र",
  } satisfies LocalizedString,
  phones: [
    { display: "+91 99886 90588", tel: "+919988690588" },
    { display: "+91 79034 31900", tel: "+917903431900" },
  ],
  convener: {
    name: "Sonu Agnihotri Sharma",
    titles: ["Convener, TEJAS Olympiad", "President, Department of Holistic Education"],
    phoneDisplay: "+91 99886 90588",
    phoneTel: "+919988690588",
  },
  address: "E7, Orchid Towers, Sector-125, SAS Nagar, Punjab 140301",
  academicEnquiries: "tejas@dhe.org.in",
  olympiadEmail: "tejas@dhe.org.in",
  shikshaMahakumbhReference: "https://www.shikshamahakumbh.com",
  shikshaMahakumbhOlympiadReference: "https://www.shikshamahakumbh.com",
  registrationHref: "/schools/register",
} as const;

/** Edition label used in sample papers and calendars. */
export const CURRENT_EDITION_LABEL = "TEJAS Olympiad 2026–27";

/** 1st DHE English Olympiad — past cycle under Shiksha Mahakumbh (2025 report). */
export const pastEnglishOlympiad2025 = {
  name: {
    en: "1st DHE English Olympiad",
    hi: "प्रथम DHE अंग्रेज़ी ओलंपियाड",
  } satisfies LocalizedString,
  smkEdition: 5,
  underShikshaMahakumbh: {
    en: "Conducted under the aegis of Shiksha Mahakumbh 5th Edition",
    hi: "शिक्षा महाकुंभ 5th Edition की छत्रछाया में आयोजित",
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
    hi: "OMR शीट द्वारा MCQ प्रारूप",
  } satisfies LocalizedString,
  partner: {
    en: "English Connection — language enhancement platform",
    hi: "English Connection — भाषा विकास मंच",
  } satisfies LocalizedString,
  overallFelicitation: {
    en: "1 November 2025 at Shiksha Mahakumbh 5th Edition, NIPER Mohali",
    hi: "1 नवंबर 2025 — शिक्षा महाकुंभ 5th Edition, NIPER मोहाली",
  } satisfies LocalizedString,
  schoolFelicitation: {
    en: "13 February 2026 at ISTC Auditorium, CSIR–CSIO, Chandigarh",
    hi: "13 फ़रवरी 2026 — ISTC Auditorium, CSIR–CSIO, Chandigarh",
  } satisfies LocalizedString,
  levels: [
    { level: "A", classes: { en: "Class I–II", hi: "कक्षा I–II" } },
    { level: "B", classes: { en: "Class III–IV", hi: "कक्षा III–IV" } },
    { level: "C", classes: { en: "Class V–VI", hi: "कक्षा V–VI" } },
    { level: "D", classes: { en: "Class VII–VIII", hi: "कक्षा VII–VIII" } },
    { level: "E", classes: { en: "Class IX–X", hi: "कक्षा IX–X" } },
  ],
} as const;
