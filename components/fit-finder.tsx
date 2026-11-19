"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Ruler } from "lucide-react";

import type { Product } from "@/lib/data";
import type { SizeChart } from "@/lib/size-guide";
import {
  chartRows,
  fromCm,
  type HemPosition,
  type LimitingMeasurement,
  measurementErrors,
  type MeasurementKey,
  type Measurements,
  recommendSize,
  roundForUnit,
  type SizeRecommendation,
  toCm,
  type Unit,
} from "@/lib/size-recommendation";

import { useI18n } from "./i18n";

/** Measurements as typed, per field, in the current unit. */
type Inputs = Record<MeasurementKey, string>;

/** What this browser remembers between product pages (values in cm). */
type Saved = { unit: Unit; cm: Partial<Record<MeasurementKey, number>> };

const STORAGE_KEY = "dw-fit-measurements";
const FIELDS: { key: MeasurementKey; label: string; required: boolean }[] = [
  { key: "height", label: "Height", required: true },
  { key: "waist", label: "Waist", required: true },
  { key: "bust", label: "Bust", required: false },
  { key: "hips", label: "Hips", required: false },
];
const EMPTY: Inputs = { height: "", waist: "", bust: "", hips: "" };

const HEM_TEXT: Record<HemPosition, string> = {
  "above-knee": "above the knee",
  "at-knee": "at the knee",
  "below-knee": "just below the knee",
  "mid-calf": "at mid-calf",
  ankle: "at the ankle",
};
const MEASUREMENT_NAME: Record<LimitingMeasurement, string> = { bust: "bust", waist: "waist", hips: "hips" };

/** Digits and one decimal point (a comma counts as one); no scroll-wheel number boxes. */
const keepNumber = (value: string) => {
  const [whole, ...decimals] = value.replace(/,/g, ".").replace(/[^\d.]/g, "").split(".");
  return (decimals.length ? `${whole}.${decimals.join("").slice(0, 1)}` : whole).slice(0, 5);
};

function readSaved(): Saved | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const saved = value as Partial<Saved>;
    return saved.unit === "cm" || saved.unit === "in" ? { unit: saved.unit, cm: saved.cm ?? {} } : null;
  } catch {
    return null;
  }
}

function writeSaved(saved: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Private mode or blocked storage: the finder still works, it just won't remember.
  }
}

/** Typed inputs → values in cm (empty fields left out). */
function inputsToCm(inputs: Inputs, unit: Unit): Partial<Record<MeasurementKey, number>> {
  const cm: Partial<Record<MeasurementKey, number>> = {};
  for (const key of Object.keys(inputs) as MeasurementKey[]) {
    const number = Number(inputs[key]);
    if (inputs[key].trim() !== "" && Number.isFinite(number) && number > 0) cm[key] = toCm(number, unit);
  }
  return cm;
}

function cmToInputs(cm: Partial<Record<MeasurementKey, number>>, unit: Unit): Inputs {
  const inputs = { ...EMPTY };
  for (const key of Object.keys(cm) as MeasurementKey[]) {
    const value = cm[key];
    if (value !== undefined) inputs[key] = String(roundForUnit(fromCm(value, unit), unit));
  }
  return inputs;
}

/**
 * Fit & size recommendation on the product page, under the EU size buttons.
 * Suggests the best size from the product's size chart and the shopper's
 * measurements (sold-out sizes are taken into account) and selects it with
 * one click through `onSelect`, the same path as tapping a size button.
 */
export function FitFinder({
  product,
  chart,
  selectedSize,
  onSelect,
  onOpenGuide,
}: {
  product: Product;
  chart: SizeChart;
  selectedSize: string;
  onSelect: (size: string) => void;
  onOpenGuide: () => void;
}) {
  const { t } = useI18n();
  const panelId = useId();
  const rows = useMemo(() => chartRows(chart), [chart]);
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<Unit>("cm");
  const [inputs, setInputs] = useState<Inputs>(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof measurementErrors>>({});
  const [result, setResult] = useState<{ recommendation: SizeRecommendation; measurements: Measurements } | null>(null);

  // Measurements entered on an earlier product page: fill them in and show the result at once.
  useEffect(() => {
    const saved = readSaved();
    if (!saved) return;
    setUnit(saved.unit);
    setInputs(cmToInputs(saved.cm, saved.unit));
    if (!Object.keys(measurementErrors(saved.cm)).length) {
      const measurements = saved.cm as Measurements;
      const recommendation = recommendSize(rows, measurements, product);
      if (recommendation) setResult({ recommendation, measurements });
    }
  }, [rows, product]);

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setInputs(cmToInputs(inputsToCm(inputs, unit), next));
    setUnit(next);
  }

  function suggest() {
    const cm = inputsToCm(inputs, unit);
    const found = measurementErrors(cm);
    setErrors(found);
    if (Object.keys(found).length) {
      setResult(null);
      return;
    }
    const measurements = cm as Measurements;
    const recommendation = recommendSize(rows, measurements, product);
    setResult(recommendation ? { recommendation, measurements } : null);
    writeSaved({ unit, cm });
  }

  const show = (cm: number) => `${roundForUnit(fromCm(cm, unit), unit)} ${unit === "cm" ? "cm" : "in"}`;
  const nextSize = (size: string) => rows[rows.findIndex((row) => row.size === size) + 1]?.size;

  return (
    <div className="mt-4 border border-[#eadfdc] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <Ruler size={18} aria-hidden="true" className="flex-none text-[#781d2d]" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold uppercase tracking-[1.2px] text-[#211c1d]">{t("Find my size")}</span>
          <span className="block text-[13px] text-[#786565]">
            {result?.recommendation.kind === "size"
              ? t("Your size: EU {size}", { size: result.recommendation.size })
              : t("Enter your measurements for a size suggestion.")}
          </span>
        </span>
        <ChevronDown size={18} aria-hidden="true" className={"flex-none text-[#786565] transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div id={panelId} className="border-t border-[#eadfdc] px-4 pb-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-[13px] text-[#786565]">{t("Body measurements, not garment measurements.")}</p>
            <div role="group" aria-label={t("Unit")} className="inline-flex border border-[#cfc3bf]">
              {(["cm", "in"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => switchUnit(option)}
                  className={
                    "h-8 min-w-12 px-3 text-[13px] transition-colors " +
                    (unit === option ? "bg-[#781d2d] text-white" : "bg-white text-[#211c1d] hover:bg-[#fbf5f2]")
                  }
                >
                  {option === "cm" ? "cm" : t("inches")}
                </button>
              ))}
            </div>
          </div>

          <form
            className="mt-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              suggest();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(({ key, label, required }) => {
                const id = `${panelId}-${key}`;
                const error = errors[key];
                return (
                  <div key={key}>
                    <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-[#211c1d]">
                      <span>
                        {t(label)} ({unit === "cm" ? "cm" : "in"})
                      </span>
                      {!required && <span className="text-[12px] font-normal text-[#a99594]">{t("Optional")}</span>}
                    </label>
                    <input
                      id={id}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={inputs[key]}
                      onChange={(event) => {
                        setInputs((current) => ({ ...current, [key]: keepNumber(event.target.value) }));
                        if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${id}-error` : undefined}
                      className={
                        "h-11 w-full border bg-white px-3 text-[15px] outline-none focus:border-[#781d2d] " +
                        (error ? "border-[#781d2d]" : "border-[#cfc3bf]")
                      }
                    />
                    {error && (
                      <p id={`${id}-error`} className="m-0 mt-1 text-[12px] text-[#781d2d]">
                        {error === "required" ? t("Required for a suggestion.") : t("Please check this measurement.")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center bg-[#211c1d] px-5 text-[12px] font-medium uppercase tracking-[1.4px] text-white transition-colors hover:bg-[#781d2d]"
              >
                {t("Suggest my size")}
              </button>
              <button type="button" onClick={onOpenGuide} className="text-[13px] underline underline-offset-4 hover:text-[#781d2d]">
                {t("How to measure")}
              </button>
            </div>
          </form>

          {result && (
            <div role="status" className="mt-4 border-l-2 border-[#781d2d] bg-[#fbf5f2] px-4 py-3 text-[14px] leading-relaxed text-[#211c1d]">
              <Result
                recommendation={result.recommendation}
                measurements={result.measurements}
                selectedSize={selectedSize}
                nextSize={nextSize}
                show={show}
                onSelect={onSelect}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Result({
  recommendation,
  measurements,
  selectedSize,
  nextSize,
  show,
  onSelect,
}: {
  recommendation: SizeRecommendation;
  measurements: Measurements;
  selectedSize: string;
  nextSize: (size: string) => string | undefined;
  show: (cm: number) => string;
  onSelect: (size: string) => void;
}) {
  const { t } = useI18n();

  if (recommendation.kind === "too-large") {
    return (
      <p className="m-0">
        {t("Your measurements are above our largest size, EU {size}.", { size: recommendation.largest })}{" "}
        <Link href="/pages/contact" className="underline underline-offset-4">{t("Contact us")}</Link>{" "}
        {t("and we'll help you find the right fit.")}
      </p>
    );
  }
  if (recommendation.kind === "too-small") {
    return (
      <p className="m-0">
        {t("Your measurements are below our smallest size, so EU {size} will fit loosely.", { size: recommendation.smallest })}{" "}
        <Link href="/pages/contact" className="underline underline-offset-4">{t("Contact us")}</Link>{" "}
        {t("and we'll help you find the right fit.")}
      </p>
    );
  }

  const { size, limitedBy, betweenSizes, inStock, alternative, hem } = recommendation;
  const roomier = nextSize(size);
  const selectButton = (target: string) =>
    selectedSize === target ? (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1f6b44]">
        <Check size={15} aria-hidden="true" /> {t("Size {size} selected", { size: target })}
      </span>
    ) : (
      <button
        type="button"
        onClick={() => onSelect(target)}
        className="inline-flex h-10 items-center justify-center bg-[#781d2d] px-4 text-[12px] font-medium uppercase tracking-[1.2px] text-white transition-colors hover:bg-[#5e1622]"
      >
        {t("Select size {size}", { size: target })}
      </button>
    );

  return (
    <>
      <p className="m-0 font-serif text-[22px] leading-tight text-[#781d2d]">{t("We recommend EU {size}", { size })}</p>
      <p className="m-0 mt-1.5">
        {betweenSizes && roomier
          ? t("Your {measurement} is close to the next size, so the bodice will sit snug. For a more relaxed fit, choose EU {next}.", {
              measurement: t(MEASUREMENT_NAME[limitedBy]),
              next: roomier,
            })
          : t("Based on your {measurement}, this size fits with comfortable room.", { measurement: t(MEASUREMENT_NAME[limitedBy]) })}
      </p>
      {hem && (
        <p className="m-0 mt-1.5 text-[#786565]">
          {t("At your height of {height}, this {length} skirt ends {position}.", {
            height: show(measurements.height),
            length: show(hem.lengthCm),
            position: t(HEM_TEXT[hem.position]),
          })}
        </p>
      )}

      <div className="mt-3">
        {inStock ? (
          selectButton(size)
        ) : alternative ? (
          <>
            <p className="m-0 mb-2 text-[#781d2d]">
              {t("EU {size} is sold out right now. EU {alternative} is available and fits a little roomier.", { size, alternative })}
            </p>
            {selectButton(alternative)}
          </>
        ) : (
          <p className="m-0 text-[#781d2d]">
            {t("EU {size} is sold out right now.", { size })}{" "}
            <Link href="/pages/contact" className="underline underline-offset-4">{t("Contact us")}</Link>{" "}
            {t("and we'll tell you when it's back.")}
          </p>
        )}
      </div>
    </>
  );
}
