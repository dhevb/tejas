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
            DEFAULT: "#B65A28",
            soft: "#FAF8F2",
            dark: "#8C4318",
          },
          blue: {
            DEFAULT: "#172B67",
            dark: "#101D49",
          },
          ivory: "#FAF8F2",
          emerald: "#059669",
          gold: "#C99A2E",
          copper: "#B65A28",
          ink: "#1C1917",
          muted: "#57534E",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        hindi: ["var(--font-noto-devanagari)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tejas: "0 12px 40px rgba(30, 58, 95, 0.08)",
        "tejas-lg": "0 20px 60px rgba(30, 58, 95, 0.12)",
      },
      backgroundImage: {
        "mandala-accent":
          "radial-gradient(circle at 20% 20%, rgba(182, 90, 40, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(23, 43, 103, 0.06) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
