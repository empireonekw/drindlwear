import type { Config } from "tailwindcss";

/**
 * Brand palette from the Dirndl Wear brand guide. Use these names in new
 * code (bg-burgundy, text-taupe, …) instead of raw hex values.
 */
const brand = {
  burgundy: "#781d2d", // Heritage Burgundy: logo, primary buttons, key headings, selected links
  "burgundy-dark": "#5e1622", // hover/pressed state of burgundy
  ivory: "#fbf5f2", // Warm Ivory: primary background
  rose: "#d9b6b6", // Dusty Rose: subtle accents only, never small text on ivory
  taupe: "#786565", // Antique Taupe: labels and secondary text
  charcoal: "#211c1d", // Charcoal Black: body text
};

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ...brand, ink: brand.charcoal, cream: brand.ivory },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
      },
      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "hero-enter": {
          from: { opacity: "0", transform: "scale(1.025)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "announce-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "menu-backdrop-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "page-enter": "page-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "announce-in": "announce-in 420ms ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
