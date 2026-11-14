export type PhaseStatus = "complete" | "current" | "planned";

export interface RoadmapPhase {
  phase: string;
  focus: string;
  status: PhaseStatus;
}

/** Public status of this website. These rows are not an internal delivery plan. */
export const tejasRoadmap: RoadmapPhase[] = [
  { phase: "School registration", focus: "Open on this website for TEJAS Olympiad 2026–27.", status: "complete" },
  { phase: "Student portal", focus: "Accounts, and Future Tech e-books with their mock tests after publication and a verified ₹49 payment.", status: "complete" },
  { phase: "Olympiad examination", focus: "Offline examinations on 9, 10 and 11 December 2026. This website is not the examination hall.", status: "current" },
  { phase: "2026–27 results", focus: "A declaration date has not been fixed.", status: "planned" },
  { phase: "Search, contact form, and mobile app", focus: "Not built. They are not offered as working features.", status: "planned" },
];
