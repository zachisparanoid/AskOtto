import type { Config } from "tailwindcss";

/**
 * GrillSearch design tokens (from the spec) wired as semantic Tailwind colors:
 *   bg-background / bg-surface / bg-elevated, text-primary / text-secondary,
 *   (color is named `background`, NOT `base` — `text-base` is a built-in
 *    font-size utility, so a `base` color would collide and tint text near-black).
 *   border-border, and accent-orange / accent-amber / accent-green / accent-red.
 *
 * Typography: Inter (body), Chakra Petch (display — instrument-cluster feel),
 * JetBrains Mono (URLs / OBD codes). Fonts are injected as CSS vars in layout.tsx.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0F",
        surface: "#161618",
        elevated: "#1F1F23",
        border: "#27272A",
        primary: "#F4F4F5",
        secondary: "#A1A1AA",
        accent: {
          orange: "#F97316",
          amber: "#FBBF24",
          green: "#22C55E",
          red: "#EF4444",
          blue: "#60A5FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-chakra)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        content: "64rem", // max-w-5xl-ish content column
      },
      boxShadow: {
        "glow-orange": "0 0 24px rgba(249,115,22,0.18)",
        "glow-amber": "0 0 12px rgba(251,191,36,0.15)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "spark": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        ticker: "ticker 40s linear infinite",
        spark: "spark 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
