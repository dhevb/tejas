import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tejas: {
          saffron: {
            DEFAULT: "#A3531C",
            soft: "#FBF6F1",
            dark: "#7C3A12",
          },
          blue: {
            DEFAULT: "#1A2B5D",
            dark: "#101C40",
          },
          ivory: "#FBF8F3",
          emerald: "#047857",
          gold: {
            DEFAULT: "#DE9A26",
            dark: "#8A5A10",
          },
          copper: "#A3531C",
          ink: "#1C1917",
          muted: "#57534E",
          border: "#E6E0D8",
          surface: "#FFFFFF",
          warning: "#B45309",
          error: "#B91C1C",
          info: "#1A2B5D",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        hindi: ["var(--font-noto-devanagari)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tejas: "0 12px 40px rgba(26, 43, 93, 0.08)",
        "tejas-lg": "0 20px 60px rgba(26, 43, 93, 0.12)",
      },
      backgroundImage: {
        "mandala-accent":
          "radial-gradient(circle at 20% 20%, rgba(163, 83, 28, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(222, 154, 38, 0.10) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
