"use client";

import { motion } from "framer-motion";
import { Mic, PenLine } from "lucide-react";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { useExperienceStore } from "@/lib/store/useExperienceStore";

export function AfterMovieScene() {
  const goTo = useExperienceStore((s) => s.goTo);

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-20">
      <HeroPosterField />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-sm uppercase tracking-[0.35em] text-gold/70"
      >
        Finished the movie?
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-10 mt-3 text-center font-display text-3xl text-porcelain sm:text-5xl"
      >
        Let&apos;s see what you{" "}
        <span className="bg-gradient-to-r from-porcelain to-gold bg-clip-text text-transparent">
          picked up.
        </span>
      </motion.h2>

      <div className="relative z-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3 }}
          onClick={() => goTo("quiz")}
          className="group flex flex-col items-center gap-4 rounded-3xl border border-porcelain/12 bg-porcelain/[0.03] px-8 py-10 text-center backdrop-blur-sm transition-all duration-300 hover:border-gold/40 hover:bg-gold/[0.06] hover:shadow-[0_0_24px_-8px_rgba(242,200,121,0.35)]"
        >
          <PenLine
            className="text-gold/80 transition-colors duration-300 group-hover:text-gold"
            size={28}
          />
          <span className="font-display text-2xl text-porcelain sm:text-3xl">
            Quick Quiz
          </span>
          <span className="text-sm text-porcelain-dim">
            A short comprehension &amp; vocabulary check.
          </span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3 }}
          onClick={() => goTo("speaking")}
          className="group flex flex-col items-center gap-4 rounded-3xl border border-porcelain/12 bg-porcelain/[0.03] px-8 py-10 text-center backdrop-blur-sm transition-all duration-300 hover:border-gold/40 hover:bg-gold/[0.06] hover:shadow-[0_0_24px_-8px_rgba(242,200,121,0.35)]"
        >
          <Mic
            className="text-gold/80 transition-colors duration-300 group-hover:text-gold"
            size={28}
          />
          <span className="font-display text-2xl text-porcelain sm:text-3xl">
            Speak About It
          </span>
          <span className="text-sm text-porcelain-dim">
            Answer out loud, on camera — 20 to 30 seconds.
          </span>
        </motion.button>
      </div>
    </section>
  );
}
