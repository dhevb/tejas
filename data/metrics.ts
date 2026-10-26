import type { Metric } from "@/types";

/** Real metrics from 1st DHE English Olympiad + current TEJAS expansion */
export const impactMetrics: Metric[] = [
  { label: "Students (English 2025)", value: 10040, suffix: "+", icon: "users" },
  { label: "Schools (English 2025)", value: 25, suffix: "", icon: "school" },
  { label: "Regions (English 2025)", value: 3, icon: "map" },
  { label: "Active Olympiad Streams", value: 3, icon: "trophy" },
  { label: "2025 exam levels", value: 5, icon: "award" },
];
