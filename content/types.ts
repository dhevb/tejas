import type { Locale } from "@/lib/i18n/context";

export type LocalizedString = Record<Locale, string>;

export type OlympiadStatus = "active" | "coming-soon" | "past";

export interface SyllabusLevel {
  level: LocalizedString;
  classes: LocalizedString;
  topics: LocalizedString[];
}

export interface ExamPatternSection {
  section: LocalizedString;
  questions: number;
  marks: number;
  duration?: string;
}

export interface CalendarEvent {
  label: LocalizedString;
  date: string;
  status: "completed" | "upcoming" | "tba";
}

export interface BookItem {
  title: LocalizedString;
  author: LocalizedString;
  publisher: LocalizedString;
  description?: LocalizedString;
}

export interface AwardLevel {
  level: LocalizedString;
  description: LocalizedString;
}

export interface MockTestPreview {
  id: string;
  title: LocalizedString;
  questions: number;
  duration: string;
  level: LocalizedString;
}

export interface PreviousPaper {
  id: string;
  title: LocalizedString;
  year: number;
  level: LocalizedString;
  edition: string;
}

export interface VideoLecture {
  id: string;
  title: LocalizedString;
  duration: string;
  speaker: LocalizedString;
}

export interface GuideSection {
  title: LocalizedString;
  points: LocalizedString[];
}

export interface OlympiadPortalContent {
  slug: string;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  whySubject: LocalizedString;
  status: OlympiadStatus;
  icon: string;
  color: string;
  grades: LocalizedString;
  duration: LocalizedString;
  questions: number;
  registrationOpen: boolean;
  examDate?: string;
  partner?: LocalizedString;
  eligibility: LocalizedString[];
  examPattern: ExamPatternSection[];
  syllabus: SyllabusLevel[];
  preparationRoadmap: { phase: LocalizedString; description: LocalizedString }[];
  books: BookItem[];
  mockTests: MockTestPreview[];
  samplePapers: PreviousPaper[];
  previousPapers: PreviousPaper[];
  videoLectures: VideoLecture[];
  awards: AwardLevel[];
  faqs: { question: LocalizedString; answer: LocalizedString }[];
  teacherGuide: GuideSection[];
  parentGuide: GuideSection[];
  schoolGuide: GuideSection[];
  calendar: CalendarEvent[];
  hallOfFameHighlights: { name: string; school: string; level: LocalizedString; year: number }[];
  skillsDeveloped: LocalizedString[];
  learningOutcomes: LocalizedString[];
  careerPathways: LocalizedString[];
  sampleQuestions: { question: LocalizedString; hint?: LocalizedString }[];
}

export interface EditionTimelineEvent {
  year: number;
  title: LocalizedString;
  description: LocalizedString;
}

export interface EditionQuote {
  text: LocalizedString;
  attribution: LocalizedString;
}

export interface EditionFullContent {
  slug: string;
  year: number;
  name: LocalizedString;
  subtitle: LocalizedString;
  bio: LocalizedString;
  theme: LocalizedString;
  status: "current" | "upcoming" | "past";
  imageAccent: string;
  smkEdition?: number;
  vision: LocalizedString;
  whyThisEdition: LocalizedString;
  learningValues: LocalizedString[];
  timeline: EditionTimelineEvent[];
  quotes: EditionQuote[];
  majorContributions: LocalizedString[];
  olympiadStreams: LocalizedString[];
  stats?: { label: LocalizedString; value: string }[];
  felicitation?: LocalizedString;
  examDates?: LocalizedString;
  participatingRegions?: LocalizedString;
  faqs: { question: LocalizedString; answer: LocalizedString }[];
  downloads: { title: LocalizedString; description: LocalizedString; type: string }[];
  galleryCaptions: LocalizedString[];
}

export type HallOfFameCategory =
  | "national"
  | "state"
  | "school"
  | "teacher"
  | "innovation"
  | "research"
  | "young-scientist"
  | "young-innovator"
  | "young-author"
  | "young-technologist"
  | "project";

export interface HallOfFameFullEntry {
  id: string;
  name: string;
  rank: number;
  category: HallOfFameCategory;
  olympiad: LocalizedString;
  state?: string;
  school?: string;
  class?: string;
  year: number;
  achievement: LocalizedString;
  level?: LocalizedString;
}

export type ResourceCategory =
  | "books"
  | "question-bank"
  | "practice"
  | "videos"
  | "blogs"
  | "articles"
  | "teacher"
  | "parent"
  | "school"
  | "downloads";

export interface ResourceItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  category: ResourceCategory;
  subject?: string;
  type: "pdf" | "video" | "article" | "practice" | "book";
  href: string;
}
