import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171C",
        paper: "#FAFAF8",
        line: "#E4E2DC",
        moss: "#2F5D50",
        clay: "#B5533C",
        sand: "#F1EEE6",
        slate: "#5B6470"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,23,28,0.06)"
      },
      borderRadius: {
        card: "10px"
      }
    }
  },
  plugins: []
};
export default config;
