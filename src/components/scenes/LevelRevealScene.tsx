"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import {
  areaLabel,
  buildAreaBreakdown,
  cefrCopy,
  estimateLevel,
  levelCopy,
  overallCefr,
} from "@/lib/services/levelAssessment";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { Level } from "@/lib/types";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";

type Phase = "analyzing" | "prereveal" | "reveal";

export function LevelRevealScene() {
  const answers = useExperienceStore((s) => s.levelAnswers);
  const setLevel = useExperienceStore((s) => s.setLevel);
  const goTo = useExperienceStore((s) => s.goTo);

  const [phase, setPhase] = useState<Phase>("analyzing");
  const [level, setLocalLevel] = useState<Level | null>(null);

  useEffect(() => {
    let mounted = true;

    estimateLevel(answers).then((result) => {
      if (!mounted) return;

      setLocalLevel(result);
      setLevel(result);
      setPhase("prereveal");

      setTimeout(() => setPhase("reveal"), 2800);
    });

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
      {phase === "analyzing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-lavender"
                animate={{
                  opacity: [0.2, 1, 0.2],
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <p className="text-sm uppercase tracking-[0.35em] text-porcelain-dim">
            Reading your answers
          </p>
        </motion.div>
      )}

      {phase === "prereveal" && (
        <>
          <HeroPosterField />

          <motion.h2
            initial={{
              opacity: 0,
              y: 16,
              filter: "blur(8px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1,
            }}
            className="relative z-10 font-display text-4xl leading-tight text-porcelain sm:text-6xl"
          >
            We think we&apos;ve{" "}
            <span className="text-gold">
              got you.
            </span>
          </motion.h2>
        </>
      )}
      {phase === "reveal" && level && (
        <>
          <HeroPosterField />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-sm uppercase tracking-[0.35em] text-gold/70">
                Your English level
              </p>
              <span className="h-px w-10 bg-gold/40" />
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                scale: 0.85,
                filter: "blur(20px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 1.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-display bg-gradient-to-r from-porcelain to-gold bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-8xl"
            >
              {levelCopy[level].headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="-mt-4 text-sm uppercase tracking-[0.45em] text-gold"
            >
              CEFR {overallCefr(answers)}
            </motion.p>

            <motion.p
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.6,
                duration: 0.9,
              }}
              className="max-w-lg text-balance text-lg text-porcelain/70"
            >
              {levelCopy[level].description}
            </motion.p>

            {/* =========================================
                FOUR-AREA BREAKDOWN

                The level is no longer a single number from a
                reading test. Each area is shown separately so
                the learner can see which skill is holding
                them back.
            ========================================= */}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.9 }}
              className="w-full max-w-lg"
            >
              <p className="mb-5 text-[10px] uppercase tracking-[0.45em] text-porcelain-dim">
                Across all four skills
              </p>

              <div className="flex flex-col gap-3.5">
                {buildAreaBreakdown(answers).map((entry, i) => (
                  <motion.div
                    key={entry.area}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 1.0 + i * 0.12,
                      duration: 0.6,
                    }}
                    className="flex items-center gap-4"
                  >
                    <span className="w-24 shrink-0 text-left text-[11px] uppercase tracking-[0.2em] text-porcelain-dim">
                      {areaLabel[entry.area]}
                    </span>

                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-porcelain/10">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{
                          width: `${entry.attempted ? entry.score : 0}%`,
                        }}
                        transition={{
                          delay: 1.15 + i * 0.12,
                          duration: 0.9,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold/60 to-gold"
                      />
                    </span>

                    <span className="w-9 shrink-0 text-right text-[11px] tracking-[0.15em] text-gold">
                      {entry.attempted ? entry.cefr : "--"}
                    </span>
                  </motion.div>
                ))}
              </div>

              <p className="mt-5 text-left text-[12px] leading-relaxed text-porcelain/50">
                {cefrCopy[overallCefr(answers)]}
              </p>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 1.6,
                duration: 0.9,
              }}
            >
              <MagneticButton onClick={() => goTo("goal")}>
                Keep Going
              </MagneticButton>
            </motion.div>
          </div>
        </>
      )}

    </section>
  );
}