"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, Volume2, VolumeX } from "lucide-react";

import { useI18n } from "./i18n";

type Film = {
  src: string;
  type: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  alt: string;
};

/**
 * Homepage films: two portrait videos in a staggered layout. Desktop: the
 * first film top left with its text beside it, the second lower right with
 * its text under the first film. Phones: film, text, film, text.
 *
 * Videos load only when they come near the screen, play muted on a loop while
 * visible and pause when scrolled away (no autoplay with reduced motion).
 */
const films: Film[] = [
  {
    src: "/videos/dirndl-film-1.mp4",
    type: "video/mp4",
    eyebrow: "Couples' look · In motion",
    title: "From everyday to festival look",
    text: "A white shirt, leather lederhosen and our burgundy dirndl with a crisp white apron: watch a couple turn into a perfectly matched pair for the Wiesn in seconds.",
    cta: { label: "Shop couples' looks", href: "/sets/couples" },
    alt: "A couple changes into a matching outfit: lederhosen with a white shirt and a burgundy dirndl",
  },
  {
    src: "/videos/dirndl-film-2.mp4",
    type: "video/mp4",
    eyebrow: "Styling tip · The right blouse",
    title: "One dirndl, many looks",
    text: "The blouse changes everything. Romantic lace sleeves or an elegant high collar: see how our burgundy dirndl takes on a new character with every blouse.",
    cta: { label: "Shop blouses", href: "/collections/blouses" },
    alt: "A woman presents the burgundy dirndl with different blouses",
  },
];

function FilmPlayer({ film }: { film: Film }) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const userPaused = useRef(false);

  // Load the file only when the film is about to scroll into view.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Play while on screen, pause when scrolled away.
  useEffect(() => {
    const element = box.current;
    const player = video.current;
    if (!element || !player || !near) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduced && !userPaused.current) player.play().catch(() => {});
      else if (!entry.isIntersecting) player.pause();
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);

  function togglePlay() {
    const player = video.current;
    if (!player) return;
    if (player.paused) {
      userPaused.current = false;
      player.play().catch(() => {});
    } else {
      userPaused.current = true;
      player.pause();
    }
  }

  function toggleSound() {
    const player = video.current;
    if (!player) return;
    player.muted = !player.muted;
    setMuted(player.muted);
    if (!player.muted && player.paused) player.play().catch(() => {});
  }

  const control =
    "grid h-10 w-10 place-items-center rounded-full bg-white/85 text-[#211c1d] shadow-[0_6px_16px_rgb(33_28_29_/_18%)] backdrop-blur transition hover:bg-white";

  return (
    <div
      ref={box}
      className="group relative aspect-[9/16] w-full overflow-hidden rounded-[22px] bg-[#e9dcd8] shadow-[0_24px_50px_rgb(74_20_32_/_16%)]"
    >
      {near && (
        <video
          ref={video}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={t(film.alt)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={film.src} type={film.type} />
        </video>
      )}
      {/* Bottom left, so the floating chat button never covers them on phones. */}
      <div className="absolute bottom-3 left-3 flex gap-2">
        <button type="button" onClick={togglePlay} aria-label={playing ? t("Pause video") : t("Play video")} className={control}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" className="translate-x-px" />}
        </button>
        <button type="button" onClick={toggleSound} aria-label={muted ? t("Turn sound on") : t("Turn sound off")} className={control}>
          {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function FilmText({ film, number }: { film: Film; number: string }) {
  const { t } = useI18n();
  return (
    <div className="max-w-[400px]">
      <p className="m-0 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[2.5px] text-[#781d2d]">
        <span className="font-serif text-[22px] font-normal tracking-normal text-[#d2a9a9]">{number}</span>
        <span aria-hidden="true" className="h-px w-8 bg-[#781d2d]" />
        {t(film.eyebrow)}
      </p>
      <h3 className="m-0 mt-3 font-serif text-[clamp(30px,3vw,40px)] font-medium leading-[1.1] text-[#211c1d]">{t(film.title)}</h3>
      <p className="m-0 mt-4 text-[15px] leading-[1.8] text-[#786565]">{t(film.text)}</p>
      <Link
        href={film.cta.href}
        className="group mt-6 inline-flex items-center gap-2 border-b border-[#211c1d]/40 pb-1 text-[12px] font-semibold uppercase tracking-[1.8px] text-[#211c1d] transition-colors hover:border-[#781d2d] hover:text-[#781d2d]"
      >
        {t(film.cta.label)}
        <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

/**
 * A film with a burgundy outline frame shifted behind it (idea B, editorial
 * look). Film 1's frame sits down-left, film 2's up-right, so the pair mirrors
 * the stagger. On large screens a long burgundy rule runs out from each frame:
 * to the left along film 1's lower edge, to the right along film 2's top.
 * When the film first scrolls into view the frame slides out from behind it
 * and the rule draws outward (no movement with reduced motion).
 */
function FramedFilm({ film, direction, rule = false }: { film: Film; direction: "down-left" | "up-right"; rule?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const downLeft = direction === "down-left";
  const offset = downLeft
    ? "-translate-x-3 translate-y-3 md:-translate-x-5 md:translate-y-5"
    : "translate-x-3 -translate-y-3 md:translate-x-5 md:-translate-y-5";
  const motion = "motion-safe:transition-transform motion-safe:duration-[1000ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <div ref={box} className="relative">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-[22px] border-2 border-[#781d2d] ${motion} ${shown ? offset : ""}`}
      />
      {rule && (
        <span
          aria-hidden="true"
          className={
            `pointer-events-none absolute hidden h-[2px] w-[clamp(90px,16vw,240px)] bg-[#781d2d] md:block ` +
            `motion-safe:transition-transform motion-safe:delay-300 motion-safe:duration-[900ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ` +
            (downLeft ? "right-full top-[88%] mr-[18px] origin-right " : "left-full top-[9%] ml-[18px] origin-left ") +
            (shown ? "scale-x-100" : "scale-x-0")
          }
        />
      )}
      <div className="relative">
        <FilmPlayer film={film} />
      </div>
    </div>
  );
}

export function VideoShowcase() {
  const { t } = useI18n();
  const [first, second] = films;

  return (
    // Full width with clipping, so the long rules can run towards the page edges without a sideways scroll.
    <div className="overflow-x-clip">
    <section aria-labelledby="films-title" className="relative mx-auto max-w-[1100px] px-8 pb-24 pt-[70px] max-[520px]:px-[17px] max-[520px]:pb-16 max-[520px]:pt-[45px]">
      <h2 id="films-title" className="m-0 mb-[14px] text-center font-serif text-[34px] font-medium tracking-[1px] text-[#781d2d] max-[520px]:text-[29px]">
        {t("Dirndl Wear in motion")}
      </h2>
      <p className="mb-12 text-center text-[13px] tracking-[1px] text-[#786565]">{t("SEE OUR LOOKS COME ALIVE")}</p>

      {/* Phones and tablets: film, text, film, text */}
      <div className="grid gap-10 md:hidden">
        {[first, second].map((film, index) => (
          <div key={film.src} className="grid gap-6">
            <div className="mx-auto w-full max-w-[340px]">
              <FramedFilm film={film} direction={index === 0 ? "down-left" : "up-right"} />
            </div>
            <div className="mx-auto w-full max-w-[340px]">
              <FilmText film={film} number={`0${index + 1}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: two columns, staggered. Left: film 1, then its partner text right
          under it. Right: text 1, then film 2 starting lower. */}
      <div className="hidden grid-cols-2 items-start gap-x-[clamp(32px,6vw,96px)] md:grid">
        <div className="flex flex-col items-end">
          <div className="w-full max-w-[360px]">
            <FramedFilm film={first} direction="down-left" rule />
          </div>
          <div className="mt-12 w-full max-w-[400px]">
            <FilmText film={second} number="02" />
          </div>
        </div>
        <div className="flex flex-col items-start">
          <div className="flex min-h-[clamp(220px,24vw,300px)] items-center pb-10">
            <FilmText film={first} number="01" />
          </div>
          <div className="w-full max-w-[360px]">
            <FramedFilm film={second} direction="up-right" rule />
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
