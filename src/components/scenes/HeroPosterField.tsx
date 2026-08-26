"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { movies } from "@/lib/mockData/movies";
import { usePointerParallax } from "@/components/motion/useParallax";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type Depth = 1 | 2 | 3;

interface Slot {
  movieId: string;
  top: string;
  left: string;
  size: "sm" | "md" | "lg";
  rotate: number;
  depth: Depth;
}

// An organic ring around a clean center, matching the taste-reference
// composition: bigger/sharper posters near the edges and corners,
// smaller/blurrier ones drifting toward the far background.
const SLOTS: Slot[] = [
  { movieId: "la-la-land", top: "3%", left: "2%", size: "lg", rotate: -6, depth: 1 },
  { movieId: "arrival", top: "1%", left: "21%", size: "md", rotate: 4, depth: 2 },
  { movieId: "up", top: "-4%", left: "36%", size: "sm", rotate: -3, depth: 3 },
  { movieId: "coco", top: "-4%", left: "58%", size: "sm", rotate: 5, depth: 3 },
  { movieId: "inception", top: "2%", left: "73%", size: "md", rotate: -4, depth: 2 },
  { movieId: "the-devil-wears-prada", top: "4%", left: "91%", size: "lg", rotate: 6, depth: 1 },
  { movieId: "knives-out", top: "32%", left: "-4%", size: "md", rotate: 8, depth: 2 },
  { movieId: "spider-verse", top: "30%", left: "95%", size: "lg", rotate: -7, depth: 1 },
  { movieId: "the-intern", top: "63%", left: "3%", size: "lg", rotate: 5, depth: 1 },
  { movieId: "zootopia", top: "70%", left: "23%", size: "sm", rotate: -5, depth: 3 },
  { movieId: "gone-girl", top: "72%", left: "43%", size: "sm", rotate: 3, depth: 3 },
  { movieId: "crazy-rich-asians", top: "72%", left: "57%", size: "sm", rotate: -4, depth: 3 },
  { movieId: "mad-max-fury-road", top: "66%", left: "75%", size: "md", rotate: 6, depth: 2 },
  { movieId: "paddington-2", top: "60%", left: "90%", size: "lg", rotate: -6, depth: 1 },
];

const sizePx: Record<Slot["size"], { w: number; h: number }> = {
  sm: { w: 96, h: 138 },
  md: { w: 132, h: 190 },
  lg: { w: 172, h: 248 },
};

const depthStyle: Record<Depth, { blur: number; opacity: number; parallax: number; drift: number }> = {
  1: { blur: 0, opacity: 0.62, parallax: 1.3, drift: 14 },
  2: { blur: 1.5, opacity: 0.42, parallax: 0.75, drift: 10 },
  3: { blur: 4, opacity: 0.26, parallax: 0.3, drift: 7 },
};

export function HeroPosterField() {
  const reduced = useReducedMotionSafe();
  const parallax = usePointerParallax(30);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {SLOTS.map((slot, i) => {
        const movie = movies.find((m) => m.id === slot.movieId);
        if (!movie) return null;
        const { w, h } = sizePx[slot.size];
        const d = depthStyle[slot.depth];

        return (
          <motion.div
            key={slot.movieId}
            className="absolute rounded-xl shadow-2xl shadow-black/60"
            style={{
              top: slot.top,
              left: slot.left,
              width: w,
              height: h,
              rotate: slot.rotate,
              filter: `blur(${d.blur}px)`,
              transform: reduced
                ? undefined
                : `translate3d(${parallax.x * d.parallax}px, ${parallax.y * d.parallax}px, 0)`,
              transition: "transform 0.5s ease-out",
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: d.opacity,
              y: reduced ? 0 : [0, -d.drift, 0],
            }}
            transition={{
              opacity: { duration: 2.2, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
              y: reduced
                ? { duration: 0 }
                : {
                    duration: 10 + slot.depth * 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  },
            }}
          >
            {slot.depth === 1 && (
              <div
                className="absolute -inset-6 -z-10 rounded-full opacity-40 blur-2xl"
                style={{ background: movie.palette[0] }}
              />
            )}
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <Image
                src={movie.posterUrl}
                alt=""
                fill
                sizes="200px"
                priority={i === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-midnight/25" />
            </div>
          </motion.div>
        );
      })}

      {/* darken toward the center so the wordmark stays the strongest read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_44%_at_50%_50%,rgba(5,6,12,0.88)_0%,rgba(5,6,12,0.55)_45%,transparent_75%)]" />
    </div>
  );
}
