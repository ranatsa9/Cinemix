"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { analyzeSpeaking } from "@/lib/services/speakingAnalysis";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";

const DIMENSIONS = ["Pronunciation", "Fluency", "Speaking Pace", "Answer Relevance"];

export function SpeakingAnalyzingScene() {
  const recordingSeconds = useExperienceStore((s) => s.recordingSeconds);
  const setSpeakingResult = useExperienceStore((s) => s.setSpeakingResult);
  const goTo = useExperienceStore((s) => s.goTo);
  const [activeDim, setActiveDim] = useState(0);

  useEffect(() => {
    const dimTimer = setInterval(() => {
      setActiveDim((d) => Math.min(DIMENSIONS.length - 1, d + 1));
    }, 550);

    let mounted = true;
    analyzeSpeaking(recordingSeconds).then((result) => {
      if (!mounted) return;
      setSpeakingResult(result);
      setTimeout(() => goTo("result"), 500);
    });

    return () => {
      mounted = false;
      clearInterval(dimTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center gap-12 px-6 text-center">
      <HeroPosterField />

      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 font-display text-3xl text-porcelain sm:text-4xl"
      >
        Analyzing your response...
      </motion.h2>

      <div className="relative z-10 flex flex-col gap-4">
        {DIMENSIONS.map((dim, i) => {
          const state = i < activeDim ? "done" : i === activeDim ? "active" : "pending";
          return (
            <motion.div
              key={dim}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: state === "pending" ? 0.3 : 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-porcelain/10 sm:w-56">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold via-gold/70 to-porcelain"
                  animate={{ width: state === "pending" ? "0%" : "100%" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="w-40 text-left text-sm uppercase tracking-wide text-porcelain-dim sm:w-56">
                {dim}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
