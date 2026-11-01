/**
 * TEJAS Design System — Design Tokens
 * Phase 1 Premium Product Experience
 */

/**
 * Colours sampled from the official TEJAS seal (public/brand/tejas-logo.jpg).
 * Copper is darkened from the sampled flame average so white button text stays readable.
 * Gold is for navy surfaces. goldDark is for white icons and text on ivory.
 */
export const colors = {
  primary: "#1A2B5D",
  primarySoft: "#F4F6FB",
  primaryDark: "#101C40",
  secondary: "#A3531C",
  secondaryDark: "#7C3A12",
  accent: "#DE9A26",
  background: "#FBF8F3",
  surface: "#FFFFFF",
  success: "#047857",
  warning: "#B45309",
  error: "#B91C1C",
  info: "#1A2B5D",
  gold: "#DE9A26",
  goldDark: "#8A5A10",
  copper: "#A3531C",
  stone: "#78716C",
  text: "#1C1917",
  textMuted: "#57534E",
  border: "#E6E0D8",
} as const;

export const typography = {
  fontSans: "var(--font-jakarta)",
  fontHindi: "var(--font-noto-devanagari)",
  hero: "clamp(2.75rem, 6vw, 5rem)",
  h1: "clamp(2rem, 4vw, 3.25rem)",
  h2: "clamp(1.75rem, 3vw, 2.5rem)",
  h3: "1.5rem",
  body: "1rem",
  small: "0.875rem",
} as const;

export const spacing = {
  section: "6rem",
  sectionLg: "8rem",
  container: "1280px",
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export const motion = {
  durationFast: 0.2,
  durationNormal: 0.45,
  durationSlow: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

export const brand = {
  name: "TEJAS",
  nameHi: "तेजस",
  fullName: "Talent Exploration for Junior Aspiring Scholars",
  fullNameHi: "जूनियर आकांक्षी विद्यार्थियों के लिए प्रतिभा अन्वेषण",
  tagline: "Find your spark...",
  taglineHi: "Find your spark...",
  parentOrg: "Department of Holistic Education",
  parentOrgHi: "समग्र शिक्षा विभाग",
  parentOrgShort: "DHE",
  country: "Bharat",
  domain: "tejas.dhe.org.in",
  url: "https://tejas.dhe.org.in",
  movement:
    "Not Just an Examination, but a National Movement for Talent, Research, Innovation, and Nation Building",
} as const;
