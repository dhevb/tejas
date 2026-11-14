export interface Olympiad {
  slug: string;
  name: string;
  nameHi?: string;
  description: string;
  icon: string;
  color: string;
  grades: string;
  duration: string;
  questions: number;
  registrationOpen: boolean;
  examDate?: string;
  status?: "active" | "coming-soon" | "past";
}

export interface Edition {
  year: number;
  slug: string;
  name: string;
  subtitle: string;
  bio: string;
  theme: string;
  status: "current" | "upcoming" | "past";
  imageAccent: string;
}

export interface Metric {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface HallOfFameEntry {
  id: string;
  name: string;
  rank: number;
  category: "national" | "state" | "school" | "teacher" | "innovation" | "research" | "young-scientist" | "young-innovator" | "young-author" | "young-technologist" | "project";
  olympiad: string;
  state?: string;
  school?: string;
  year: number;
  achievement: string;
  level?: string;
}

export interface RankingRow {
  rank: number;
  name: string;
  school: string;
  state: string;
  score: number;
  percentile: number;
}

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "video" | "article" | "practice" | "book";
  subject: string;
  description: string;
  href: string;
}

export interface Scholarship {
  id: string;
  title: string;
  amount: string;
  eligibility: string;
  deadline: string;
  description: string;
}

export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  students: number;
  medals: number;
  tier: "platinum" | "gold" | "silver";
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
}

export interface PrepareCategory {
  id: string;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

export interface OlympiadDetail extends Olympiad {
  eligibility: string[];
  examPattern: { section: string; questions: number; marks: number }[];
  syllabus: string[];
  resources: Resource[];
  books: { title: string; author: string; publisher: string }[];
  awards: { level: string; description: string }[];
  faqs: FAQItem[];
}
