"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { MagneticButton } from "@/components/motion/MagneticButton";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { useExperienceStore } from "@/lib/store/useExperienceStore";

export function MatchScene() {
  const recommendation = useExperienceStore(
    (s) => s.recommendation
  );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );

  if (!recommendation) return null;

  const {
    movie,
    matchPercent,
    traits,
    reason,
  } = recommendation;

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-28">
      <HeroPosterField />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 text-center">

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative h-[38vh] w-[25vh] min-h-[260px] min-w-[170px] overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
        >
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} movie poster`}
            fill
            sizes="300px"
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </motion.div>

        <div>
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.4,
            }}
            className="mb-3 text-sm uppercase tracking-[0.35em] text-porcelain-dim"
          >
            Your movie match
          </motion.p>

          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.5,
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="font-display text-4xl font-semibold uppercase tracking-tight text-porcelain sm:text-6xl"
          >
            {movie.title}
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              scale: 0.85,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.9,
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-5 font-display text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber via-gold to-violet sm:text-4xl"
          >
            {matchPercent}% MATCH
          </motion.p>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.2,
            duration: 0.7,
          }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {traits.map((trait) => (
            <span
              key={trait.label}
              className="rounded-full border border-porcelain/15 bg-porcelain/[0.04] px-4 py-2 text-xs uppercase tracking-wide text-porcelain-dim"
            >
              {trait.label}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.5,
            duration: 0.7,
          }}
          className="max-w-xl"
        >
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-porcelain-dim">
            Why this movie?
          </p>

          <p className="text-balance font-display text-xl text-porcelain sm:text-2xl">
            &ldquo;{reason}&rdquo;
          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.9,
            duration: 0.7,
          }}
        >
          <MagneticButton
            onClick={() => goTo("beforeWatch")}
          >
            Prepare Me For The Movie
          </MagneticButton>
        </motion.div>

      </div>
    </section>
  );
}