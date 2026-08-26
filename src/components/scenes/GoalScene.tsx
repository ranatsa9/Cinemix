"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { goals } from "@/lib/mockData/goals";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GoalScene() {
  const setGoal = useExperienceStore((s) => s.setGoal);
  const goTo = useExperienceStore((s) => s.goTo);
  const [chosen, setChosen] = useState<Goal | null>(null);

  const handlePick = (goal: Goal) => {
    setChosen(goal);
    setGoal(goal);
  };

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-16">
      {/* Same cinematic poster background used in intro / level test */}
      <HeroPosterField />

      {/* Keep waveform, but change accent from cyan to gold */}

      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-3 text-sm uppercase tracking-[0.35em] text-porcelain-dim"
      >
        Now let&apos;s find the right challenge
      </motion.p>

      {/* Main title */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 text-center font-display text-3xl text-porcelain sm:text-5xl"
      >
        What do you want to improve?
      </motion.h2>

      {/* Single-select helper */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-8 mt-3 text-sm text-porcelain-dim"
      >
        Choose what you&apos;d like to focus on.
      </motion.p>

      {/* Goal cards */}
      <div className="relative z-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {goals.map((g, i) => {
          const isChosen = chosen === g.id;
          const isDimmed = chosen !== null && !isChosen;

          return (
            <motion.button
              key={g.id}
              onClick={() => handlePick(g.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: isDimmed ? 0.35 : 1,
                y: 0,
                scale: isChosen ? 1.02 : 1,
              }}
              transition={{
                duration: 0.5,
                delay: 0.15 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={
                chosen === null
                  ? {
                      y: -2,
                    }
                  : {}
              }
              className={cn(
                `
                group
                relative
                flex
                min-h-[125px]
                flex-col
                items-start
                justify-center
                gap-2
                rounded-2xl
                border
                px-6
                py-5
                text-left
                backdrop-blur-md
                transition-all
                duration-300
                `,
                `
                border-porcelain/12
                bg-porcelain/[0.035]
                `,
                chosen === null &&
                  `
                  hover:border-gold/40
                  hover:bg-porcelain/[0.06]
                  hover:shadow-[0_0_20px_-4px_rgba(242,200,121,0.35)]
                  `,
                isChosen &&
                  `
                  border-gold/60
                  bg-gold/[0.08]
                  shadow-[0_0_24px_-6px_rgba(242,200,121,0.45)]
                  `
              )}
            >
              {/* Selected check */}
              {isChosen && (
                <motion.span
                  initial={{
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-midnight"
                >
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              )}

              {/* Goal title */}
              <span className="font-display text-2xl text-porcelain sm:text-3xl">
                {g.label}
              </span>

              {/* Existing description from goals.ts */}
              <span className="max-w-[17rem] text-sm leading-relaxed text-porcelain-dim">
                {g.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Continue */}
      {chosen && (
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
            delay: 0.3,
            duration: 0.7,
          }}
          className="relative z-10 mt-8"
        >
          <MagneticButton onClick={() => goTo("tasteGenre")}>
            <span className="flex items-center gap-2">
              Continue
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </MagneticButton>
        </motion.div>
      )}
    </section>
  );
}