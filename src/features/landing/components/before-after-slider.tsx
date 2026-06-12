"use client";

import Image from "next/image";
import { useState } from "react";

const SLIDES = [
  {
    src: "/assets/before-after-4.png",
    alt: "Suzuki Swift customized with purple neon garage theme",
  },
  {
    src: "/assets/before-after-2.png",
    alt: "Nissan customized with purple neon garage theme",
  },
  {
    src: "/assets/before-after-3.png",
    alt: "Honda Civic customized with purple neon garage theme",
  },
];

export function BeforeAfterShowcase() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((i) => (i + 1) % SLIDES.length);

  return (
    <div className="relative">
      <div className="-inset-8 absolute rounded-[2.5rem] bg-violet-600/20 blur-3xl" />
      <div className="-top-10 -right-10 absolute hidden h-40 w-40 rounded-full bg-blue-500/20 blur-3xl lg:block" />

      <div className="relative aspect-[1063/794] overflow-hidden [perspective:1200px]">
        {SLIDES.map((slide, i) => {
          // Shortest signed distance from the active slide (handles wrap-around).
          let offset = i - current;
          if (offset > SLIDES.length / 2) offset -= SLIDES.length;
          if (offset < -SLIDES.length / 2) offset += SLIDES.length;

          const isActive = offset === 0;
          const abs = Math.abs(offset);

          return (
            <button
              type="button"
              key={slide.src}
              onClick={() => setCurrent(i)}
              aria-label={isActive ? slide.alt : `Show ${slide.alt}`}
              tabIndex={isActive ? -1 : 0}
              className="absolute top-1/2 left-1/2 w-[78%] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-950/50 transition-all duration-500 ease-out will-change-transform"
              style={{
                transform: `translate(calc(-50% + ${offset * 33}%), -50%) scale(${
                  isActive ? 1 : 0.78
                }) rotateY(${offset * -25}deg)`,
                opacity: abs > 1 ? 0 : isActive ? 1 : 0.5,
                zIndex: SLIDES.length - abs,
                pointerEvents: abs > 1 ? "none" : "auto",
                cursor: isActive ? "default" : "pointer",
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                width={1063}
                height={794}
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full"
              />
            </button>
          );
        })}
      </div>

      {/* Prev / Next buttons */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous"
        className="-translate-y-1/2 group absolute top-1/2 left-1 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-lg shadow-black/40 backdrop-blur-md transition hover:scale-105 hover:border-violet-400/50 hover:bg-violet-600/80 sm:left-3"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next"
        className="-translate-y-1/2 group absolute top-1/2 right-1 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-lg shadow-black/40 backdrop-blur-md transition hover:scale-105 hover:border-violet-400/50 hover:bg-violet-600/80 sm:right-3"
      >
        <ChevronRightIcon />
      </button>

      {/* Dot indicators */}
      <div className="-bottom-6 absolute left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((slide, i) => (
          <button
            type="button"
            key={slide.src}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 bg-violet-400"
                : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
