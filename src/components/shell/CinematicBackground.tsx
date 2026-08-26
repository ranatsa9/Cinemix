"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";

import { chapterThemes } from "@/lib/motion/chapterThemes";
import { movies } from "@/lib/mockData/movies";
import { SceneId } from "@/lib/types";

import { usePointerParallax } from "@/components/motion/useParallax";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

interface CinematicBackgroundProps {
  scene: SceneId;
  backdropUrl?: string;
  backdropTint?: [string, string];
}

const SILHOUETTE_CONFIG: Partial<
  Record<SceneId, { opacity: number }>
> = {
  goal: { opacity: 0.08 },
  afterMovie: { opacity: 0.08 },
  quiz: { opacity: 0.09 },
  speaking: { opacity: 0.07 },
  speakingAnalyzing: { opacity: 0.09 },
  result: { opacity: 0.09 },
};

export function CinematicBackground({
  scene,
  backdropUrl,
  backdropTint,
}: CinematicBackgroundProps) {
  // If a new scene does not have its own theme yet,
  // safely use the Intro theme.
  const theme =
    chapterThemes[scene] ??
    chapterThemes.intro;

  const reduced =
    useReducedMotionSafe();

  const parallax =
    usePointerParallax(20);

  const silhouetteCfg =
    backdropUrl
      ? undefined
      : SILHOUETTE_CONFIG[scene];

  const silhouettes = useMemo(
    () =>
      movies
        .slice(0, 8)
        .map((m, i) => ({
          ...m,

          top:
            (i * 37) % 90,

          left:
            (i * 53) % 100,

          scale:
            0.6 +
            ((i * 13) % 5) / 10,

          depth:
            (i % 3) + 1,
        })),
    []
  );

  const tint = backdropTint
    ? {
        a: backdropTint[0],
        b: backdropTint[1],
        accent: backdropTint[0],
      }
    : theme;

  return (
    <div className="fixed inset-0 overflow-hidden bg-midnight">

      {/* =========================================
          MOVIE BACKDROP
      ========================================= */}

      {backdropUrl && (
        <>
          <motion.div
            key={backdropUrl}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 0.48,
            }}
            transition={{
              duration: 1.4,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}
            className="absolute -inset-6 scale-110"
            style={{
              backgroundImage:
                `url(${backdropUrl})`,

              backgroundSize:
                "cover",

              backgroundPosition:
                "center center",

              backgroundRepeat:
                "no-repeat",

              filter:
                "blur(10px) brightness(0.58) saturate(0.8)",
            }}
          />

          {/* Dark overlay */}

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(5,6,13,0.72) 0%, rgba(5,6,13,0.64) 35%, rgba(5,6,13,0.78) 72%, rgba(5,6,13,0.96) 100%)",
            }}
          />

          {/* Center readability */}

          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(5,6,13,0.22) 0%, rgba(5,6,13,0.52) 55%, rgba(5,6,13,0.78) 100%)",
            }}
          />

          {/* Side vignette */}

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(5,6,13,0.58) 0%, transparent 25%, transparent 75%, rgba(5,6,13,0.62) 100%)",
            }}
          />

          {/* Bottom fade */}

          <div
            className="absolute inset-x-0 bottom-0 h-[42%]"
            style={{
              background:
                "linear-gradient(to top, rgba(5,6,13,0.95) 0%, rgba(5,6,13,0.58) 55%, transparent 100%)",
            }}
          />
        </>
      )}


      {/* =========================================
          QUIET SCENE POSTER SILHOUETTES
      ========================================= */}

      {silhouetteCfg && (
        <div
          className="absolute inset-0"
          style={{
            opacity:
              silhouetteCfg.opacity,
          }}
        >

          {silhouettes.map((m) => (

            <div
              key={m.id}
              className="absolute h-[26vh] w-[16vh] overflow-hidden rounded-xl"

              style={{
                top:
                  `${m.top}%`,

                left:
                  `${m.left}%`,

                transform:
                  `translate(${
                    reduced
                      ? 0
                      : parallax.x *
                        m.depth *
                        0.4
                  }px, ${
                    reduced
                      ? 0
                      : parallax.y *
                        m.depth *
                        0.4
                  }px) scale(${m.scale})`,

                transition:
                  "transform 0.5s ease-out",
              }}
            >

              <Image
                src={`/movies/ambient/${m.id}.jpg`}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />

            </div>

          ))}

        </div>
      )}


      {/* =========================================
          CHAPTER COLORED GLOW — TOP
      ========================================= */}

      <motion.div
        className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full blur-[120px]"

        animate={{
          backgroundColor:
            tint.a,

          opacity:
            backdropUrl
              ? [
                  0.12,
                  0.2,
                  0.12,
                ]
              : [
                  0.35,
                  0.5,
                  0.35,
                ],
        }}

        transition={{
          backgroundColor: {
            duration:
              1.2,

            ease:
              "easeInOut",
          },

          opacity: {
            duration:
              6,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          },
        }}
      />


      {/* =========================================
          CHAPTER COLORED GLOW — BOTTOM
      ========================================= */}

      <motion.div
        className="absolute -bottom-[25%] -right-[10%] h-[75vh] w-[75vh] rounded-full blur-[140px]"

        animate={{
          backgroundColor:
            tint.b,

          opacity:
            backdropUrl
              ? [
                  0.1,
                  0.17,
                  0.1,
                ]
              : [
                  0.3,
                  0.45,
                  0.3,
                ],
        }}

        transition={{
          backgroundColor: {
            duration:
              1.2,

            ease:
              "easeInOut",
          },

          opacity: {
            duration:
              7,

            repeat:
              Infinity,

            ease:
              "easeInOut",

            delay:
              0.5,
          },
        }}
      />


      {/* =========================================
          LEVEL REVEAL PROJECTOR
      ========================================= */}

      {scene === "levelReveal" && (
        <motion.div
          className="absolute inset-0"

          initial={{
            opacity: 0,
          }}

          animate={{
            opacity: 1,
          }}

          transition={{
            duration: 1.6,
          }}
        >

          <div
            className="absolute left-1/2 top-0 h-[140%] w-[60vw] -translate-x-1/2 opacity-[0.14]"

            style={{
              background:
                `conic-gradient(
                  from 180deg at 50% 0%,
                  transparent 40%,
                  ${theme.accent} 50%,
                  transparent 60%
                )`,

              filter:
                "blur(40px)",
            }}
          />

        </motion.div>
      )}


      {/* =========================================
          DEFAULT SCRIM
      ========================================= */}

      {!backdropUrl && (
        <div
          className="absolute inset-0"

          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(5,6,13,0.7) 0%, rgba(5,6,13,0.4) 50%, rgba(5,6,13,0.85) 100%)",
          }}
        />
      )}

    </div>
  );
}