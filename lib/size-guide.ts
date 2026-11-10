import type { Product } from "./data";

export type SizeChart = {
  title: string;
  columns: string[];
  rows: string[][];
};

/**
 * Typical EU women's body measurements (cm). These are a general guide only;
 * replace them with the measurements of your own patterns before launch.
 */
const womenChart: SizeChart = {
  title: "Women — dirndl, blouses & jackets",
  columns: ["Size (EU)", "Bust", "Waist", "Hips"],
  rows: [
    ["32", "76", "60", "84"],
    ["34", "80", "64", "88"],
    ["36", "84", "68", "92"],
    ["38", "88", "72", "96"],
    ["40", "92", "76", "100"],
    ["42", "96", "80", "104"],
    ["44", "100", "84", "108"],
  ],
};

/** Returns the chart for a product, or null when none has been set up yet. */
export function sizeChartFor(product: Product): SizeChart | null {
  return product.audience === "women" || product.audience === "unisex" ? womenChart : null;
}

export const measuringTips = [
  { label: "Bust", tip: "Around the fullest part of your chest, wearing the bra you'll wear with the dirndl." },
  { label: "Waist", tip: "Around the narrowest part of your waist, keeping the tape snug but not tight." },
  { label: "Hips", tip: "Around the widest part of your hips, with your feet together." },
  {
    label: "Dress length",
    tip: "Measured from the waist seam to the hem. Short 50–55 cm, midi 60–65 cm, long 70+ cm.",
  },
];
