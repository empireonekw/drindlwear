"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "./i18n";

const arrowClass =
  "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#211c1d] shadow transition hover:bg-white";

export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: string;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const count = images.length;
  const go = (index: number) => setActive((index + count) % count);

  return (
    <div
      // The thumbnail column exists only when there is more than one image; with a
      // single image the main photo gets the full width. self-start keeps the gallery
      // from stretching to the height of the details column; on desktop it stays in
      // view while the details scroll.
      className={
        "grid gap-3 self-start min-[851px]:sticky min-[851px]:top-[100px] min-[851px]:gap-4" +
        (count > 1 ? " min-[851px]:grid-cols-[84px_minmax(0,1fr)]" : "")
      }
      onKeyDown={(event) => {
        if (count < 2) return;
        if (event.key === "ArrowRight") go(active + 1);
        if (event.key === "ArrowLeft") go(active - 1);
      }}
    >
      {/* Main image */}
      <div className="relative overflow-hidden bg-[#eadfdc] min-[851px]:order-2">
        <img
          src={images[active]}
          alt={count > 1 ? t("{name}, image {number} of {count}", { name, number: active + 1, count }) : name}
          className="aspect-[3/4] w-full object-cover min-[851px]:max-h-[760px]"
        />
        {badge && (
          <span className="absolute left-3 top-3 bg-[#781d2d] px-3 py-1.5 text-[11px] font-semibold tracking-[1px] text-white">
            {badge}
          </span>
        )}
        {count > 1 && (
          <>
            <button type="button" aria-label="Previous image" onClick={() => go(active - 1)} className={`${arrowClass} left-3`}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next image" onClick={() => go(active + 1)} className={`${arrowClass} right-3`}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 bg-white/90 px-2.5 py-1 text-xs" aria-hidden="true">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails: a column on desktop, a row under the image on mobile */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto min-[851px]:order-1 min-[851px]:flex-col min-[851px]:overflow-visible">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={t("Show image {number} of {count}", { number: index + 1, count })}
              aria-current={index === active}
              onClick={() => setActive(index)}
              className={
                "w-[72px] shrink-0 border-2 p-0 min-[851px]:w-full " +
                (index === active ? "border-[#211c1d]" : "border-transparent opacity-80 hover:opacity-100")
              }
            >
              <img src={image} alt="" className="aspect-[3/4] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
