import { availableStock, productSizes, type Product } from "./data";
import type { SizeChart } from "./size-guide";

/**
 * Fit & size recommendation for the product page: turns a shopper's body
 * measurements into the best EU size from the product's size chart, taking
 * current stock into account, plus a plain-language note on fit and (for
 * dresses) where the hem will fall for their height.
 *
 * Pure functions with no browser APIs, so they can run anywhere and be tested.
 */

export type Unit = "cm" | "in";

/** One body measurement the shopper can enter. */
export type MeasurementKey = "height" | "waist" | "bust" | "hips";

/** Body measurements in centimetres. Height and waist are required; bust and hips refine the result. */
export type Measurements = {
  height: number;
  waist: number;
  bust?: number;
  hips?: number;
};

/** The size chart reduced to numbers: body measurements in cm per EU size. */
export type SizeChartRow = {
  size: string;
  bust: number;
  waist: number;
  hips: number;
};

/** Which measurement decided the size (the tightest one). */
export type LimitingMeasurement = "bust" | "waist" | "hips";

export type HemPosition = "above-knee" | "at-knee" | "below-knee" | "mid-calf" | "ankle";

export type SizeRecommendation =
  | {
      kind: "size";
      /** Best size for the measurements. */
      size: string;
      /** The measurement that set the size. */
      limitedBy: LimitingMeasurement;
      /** The measurement sits close to the next size up: the bodice will be snug. */
      betweenSizes: boolean;
      /** False when `size` is sold out right now. */
      inStock: boolean;
      /** Next size up that is in stock, when `size` is sold out (roomier fit). */
      alternative: string | null;
      /** Where the hem falls for this height, when the product has a length. */
      hem: { position: HemPosition; lengthCm: number } | null;
    }
  | { kind: "too-large"; largest: string }
  | { kind: "too-small"; smallest: string };

export const CM_PER_INCH = 2.54;

/** Accepted range per measurement, in cm (anything outside is almost certainly a typo). */
export const MEASUREMENT_LIMITS: Record<MeasurementKey, { min: number; max: number }> = {
  height: { min: 120, max: 210 },
  waist: { min: 45, max: 140 },
  bust: { min: 60, max: 160 },
  hips: { min: 65, max: 170 },
};

/** How far (cm) a measurement may exceed a size's chart value and still count as that size. */
const EASE_CM = 1;
/** Within this many cm of a size's chart value, the fit is called snug ("between sizes"). */
const SNUG_CM = 1.5;

export const toCm = (value: number, unit: Unit) => (unit === "cm" ? value : value * CM_PER_INCH);
export const fromCm = (value: number, unit: Unit) => (unit === "cm" ? value : value / CM_PER_INCH);

/** Rounds a value for display in its unit: whole cm, half inches. */
export const roundForUnit = (value: number, unit: Unit) => (unit === "cm" ? Math.round(value) : Math.round(value * 2) / 2);

/**
 * Reads the product page's size chart ("Size (EU)", "Bust", "Waist", "Hips")
 * into numbers. Rows that aren't sizes the shop sells are skipped.
 */
export function chartRows(chart: SizeChart): SizeChartRow[] {
  const column = (name: string) => chart.columns.findIndex((entry) => entry.toLowerCase().startsWith(name));
  const sizeAt = column("size");
  const bustAt = column("bust");
  const waistAt = column("waist");
  const hipsAt = column("hips");
  if ([sizeAt, bustAt, waistAt, hipsAt].includes(-1)) return [];
  return chart.rows
    .map((row) => ({
      size: row[sizeAt],
      bust: Number(row[bustAt]),
      waist: Number(row[waistAt]),
      hips: Number(row[hipsAt]),
    }))
    .filter((row) => productSizes.includes(row.size) && [row.bust, row.waist, row.hips].every(Number.isFinite))
    .sort((a, b) => productSizes.indexOf(a.size) - productSizes.indexOf(b.size));
}

/**
 * Where a skirt of `lengthCm` (waist seam to hem) ends on someone `heightCm`
 * tall, using standard body proportions: waist to knee is about 31.5 % of
 * height, waist to ankle about 54 %.
 */
export function hemPosition(heightCm: number, lengthCm: number): HemPosition {
  const toKnee = heightCm * 0.315;
  const toAnkle = heightCm * 0.54;
  const belowKnee = lengthCm - toKnee;
  if (belowKnee < -4) return "above-knee";
  if (belowKnee <= 4) return "at-knee";
  if (lengthCm >= toAnkle - 6) return "ankle";
  if (belowKnee <= 12) return "below-knee";
  return "mid-calf";
}

/**
 * The best size for `measurements`: the smallest size whose chart values fit
 * every given measurement (a fitted bodice must close at bust and waist; the
 * skirt must pass the hips). If that size is sold out, the next size up that
 * is in stock is offered as an alternative. Never suggests a smaller size than
 * fits, because a too-small bodice can't be worn.
 */
export function recommendSize(rows: SizeChartRow[], measurements: Measurements, product: Product): SizeRecommendation | null {
  if (!rows.length) return null;
  const given = (["bust", "waist", "hips"] as const).filter((key) => measurements[key] !== undefined);

  const fitsIndex = rows.findIndex((row) => given.every((key) => (measurements[key] as number) <= row[key] + EASE_CM));
  if (fitsIndex === -1) return { kind: "too-large", largest: rows[rows.length - 1].size };

  // Measurements far below the smallest size: the smallest size will be loose.
  const smallest = rows[0];
  if (fitsIndex === 0 && given.every((key) => (measurements[key] as number) < smallest[key] - 6)) {
    return { kind: "too-small", smallest: smallest.size };
  }

  const row = rows[fitsIndex];
  // The measurement with the least room in this size decides it.
  const limitedBy = given.reduce<LimitingMeasurement>(
    (tightest, key) => (row[key] - (measurements[key] as number) < row[tightest] - (measurements[tightest] as number) ? key : tightest),
    given[0] as LimitingMeasurement,
  );
  const room = row[limitedBy] - (measurements[limitedBy] as number);
  const betweenSizes = room < SNUG_CM && fitsIndex < rows.length - 1;

  const inStock = availableStock(product, row.size) > 0;
  const alternative = inStock
    ? null
    : (rows.slice(fitsIndex + 1, fitsIndex + 2).find((next) => availableStock(product, next.size) > 0)?.size ?? null);

  return {
    kind: "size",
    size: row.size,
    limitedBy,
    betweenSizes,
    inStock,
    alternative,
    hem: product.lengthCm ? { position: hemPosition(measurements.height, product.lengthCm), lengthCm: product.lengthCm } : null,
  };
}

/** Problems with the entered values (in cm), per field. Empty when valid. */
export function measurementErrors(values: Partial<Record<MeasurementKey, number>>): Partial<Record<MeasurementKey, "required" | "range">> {
  const errors: Partial<Record<MeasurementKey, "required" | "range">> = {};
  for (const key of Object.keys(MEASUREMENT_LIMITS) as MeasurementKey[]) {
    const value = values[key];
    const required = key === "height" || key === "waist";
    if (value === undefined) {
      if (required) errors[key] = "required";
      continue;
    }
    const { min, max } = MEASUREMENT_LIMITS[key];
    if (value < min || value > max) errors[key] = "range";
  }
  return errors;
}
