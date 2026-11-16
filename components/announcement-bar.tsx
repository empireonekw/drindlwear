"use client";

import { useEffect, useState } from "react";

/** The three lines shown in the bar. */
const promises = ["Delivery in 2–5 business days", "Easy returns", "Quality since more than 50 years"];

/**
 * Bar above the header. Desktop shows all three promises with dividers;
 * phones show one at a time and rotate (no rotation with reduced motion).
 */
export function AnnouncementBar({ hidden }: { hidden?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % promises.length), 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      aria-label="Store promises"
      aria-hidden={hidden}
      className={
        "bg-burgundy text-white" + (hidden ? " max-[850px]:hidden" : "")
      }
    >
      {/* Desktop and tablet: all three, separated by thin rules */}
      <ul className="m-0 hidden h-[30px] list-none items-center justify-center p-0 min-[851px]:flex">
        {promises.map((text, i) => (
          <li key={text} className="flex items-center">
            {i > 0 && <span aria-hidden="true" className="mx-7 h-[11px] w-px bg-white/45" />}
            <span className="text-[11.5px] font-medium uppercase tracking-[0.8px]">{text}</span>
          </li>
        ))}
      </ul>

      {/* Phones: one promise at a time */}
      <p className="m-0 flex h-[28px] items-center justify-center overflow-hidden px-4 min-[851px]:hidden">
        <span
          key={index}
          className="truncate text-[10.5px] font-medium uppercase tracking-[0.7px] motion-safe:animate-announce-in"
        >
          {promises[index]}
        </span>
      </p>
    </div>
  );
}
