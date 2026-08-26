"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { estimateLevel, levelCopy } from "@/lib/services/levelAssessment";
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
                delay: 1.1,
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