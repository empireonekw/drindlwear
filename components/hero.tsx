import Link from "next/link";
import { ArrowRight, Landmark, RotateCcw, Truck } from "lucide-react";

import { promiseText } from "@/lib/store-policy";

const promises = [
  { icon: Truck, text: promiseText.deliveryTime },
  { icon: RotateCcw, text: promiseText.exchange },
  { icon: Landmark, text: promiseText.bankTransfer },
];

/** Round seal with text running around the monogram (decorative). */
function QualitySeal() {
  return (
    <div
      aria-hidden="true"
      className="absolute -right-3 top-8 flex h-[118px] w-[118px] items-center justify-center rounded-full bg-ivory shadow-[0_14px_34px_rgb(74_20_32_/_16%)] sm:-right-6 lg:-right-8 lg:top-12 lg:h-[132px] lg:w-[132px]"
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full motion-safe:animate-[spin_28s_linear_infinite]">
        <defs>
          <path id="seal-ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        {/* textLength spreads the words evenly around the whole ring (2π × 44 ≈ 276). */}
        <text className="fill-burgundy text-[9px] font-semibold uppercase">
          <textPath href="#seal-ring" textLength="272" lengthAdjust="spacing">
            Quality since 50 years · Handcrafted ·
          </textPath>
        </text>
      </svg>
      <img src="/brand/dirndl-wear-monogram.png" alt="" className="h-9 w-auto lg:h-10" />
    </div>
  );
}

/**
 * Homepage banner: an editorial split. Headline and actions on the left,
 * a framed photo pair on the right. The first line of the headline is set
 * in the admin (Homepage); "Timeless Elegance." always follows it.
 */
export function Hero({ headline }: { headline: string }) {
  return (
    <section aria-label="Welcome" className="relative isolate overflow-hidden bg-ivory">
      {/* Soft rose wash behind the photos */}
      <div
        aria-hidden="true"
        className="absolute -right-[10%] top-[-20%] -z-10 h-[140%] w-[60%] rounded-full bg-[radial-gradient(closest-side,#f1dcd8,transparent)] max-lg:hidden"
      />

      <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 pb-14 pt-8 sm:px-8 lg:min-h-[clamp(600px,calc(100svh-110px),780px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-12 lg:py-14">
        {/* Words */}
        <div className="motion-safe:[&>*]:animate-page-enter motion-safe:[&>:nth-child(2)]:[animation-delay:30ms] motion-safe:[&>:nth-child(3)]:[animation-delay:60ms] motion-safe:[&>:nth-child(4)]:[animation-delay:90ms] motion-safe:[&>:nth-child(5)]:[animation-delay:120ms]">
          <p className="m-0 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[3px] text-burgundy">
            <span aria-hidden="true" className="h-px w-10 bg-burgundy" />
            Dirndl Wear · New collection
          </p>

          <h1 className="m-0 mt-4 font-serif text-[clamp(44px,5.6vw,86px)] font-medium leading-[1.02] tracking-[-1px] text-charcoal [text-wrap:balance]">
            {headline}
            <span className="block italic text-burgundy">Timeless Elegance.</span>
          </h1>

          <p className="m-0 mt-4 max-w-[470px] text-[16px] leading-[1.75] text-taupe">
            A modern expression of Alpine heritage: dirndls, blouses and lederhosen, crafted with care for life&apos;s
            special moments.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/collections/women"
              className="inline-flex min-h-[54px] items-center justify-center bg-burgundy px-8 text-[12px] font-semibold uppercase tracking-[1.8px] text-white shadow-[0_14px_30px_rgb(120_29_45_/_22%)] transition hover:-translate-y-0.5 hover:bg-burgundy-dark"
            >
              Explore the collection
            </Link>
            <Link
              href="/sets"
              className="group inline-flex items-center gap-2 border-b border-charcoal/40 pb-1 text-[12px] font-semibold uppercase tracking-[1.8px] text-charcoal transition-colors hover:border-burgundy hover:text-burgundy"
            >
              Shop outfit sets
              <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <ul className="m-0 mt-8 flex list-none flex-wrap gap-x-6 gap-y-3 border-t border-[#eadfdc] p-0 pt-5 text-[13px] text-charcoal">
            {promises.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon size={17} strokeWidth={1.6} aria-hidden="true" className="text-burgundy" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Photo: shown first on phones */}
        <div className="relative order-first mx-auto w-full max-w-[520px] lg:order-none lg:max-w-none lg:pl-16">
          <div className="relative overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-[#eadfdc] shadow-[0_30px_60px_rgb(74_20_32_/_14%)] motion-safe:[animation:hero-enter_500ms_cubic-bezier(0.2,0.7,0.2,1)_both]">
            <img
              src="/images/asset-06.webp"
              alt="Woman in a burgundy dirndl with a lace blouse"
              className="aspect-[6/7] w-full object-cover object-[50%_45%] sm:aspect-[4/5] lg:aspect-auto lg:h-[clamp(440px,calc(100svh-280px),600px)]"
              fetchPriority="high"
            />
          </div>

          <QualitySeal />
        </div>
      </div>
    </section>
  );
}
