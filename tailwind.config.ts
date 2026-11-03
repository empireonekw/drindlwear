import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#26201e", cream: "#f8f5f0", rose: "#ad786e" },
      fontFamily: { serif: ["Georgia", "serif"] },
      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "hero-enter": {
          from: { opacity: "0", transform: "scale(1.025)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "menu-backdrop-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "page-enter": "page-enter 560ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
