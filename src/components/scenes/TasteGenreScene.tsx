"use client";

import { motion } from "framer-motion";
import { genres } from "@/lib/mockData/genres";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { cn } from "@/lib/utils";

export function TasteGenreScene() {
  const genreIds = useExperienceStore((s) => s.genreIds);
  const toggleGenre = useExperienceStore((s) => s.toggleGenre);
  const goTo = useExperienceStore((s) => s.goTo);

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-20">
      <HeroPosterField />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-3 text-sm uppercase tracking-[0.35em] text-porcelain-dim"
      >
        Movie taste
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 text-center font-display text-3xl text-porcelain sm:text-5xl"
      >
        What do you{" "}
        <span className="bg-gradient-to-r from-porcelain to-gold bg-clip-text text-transparent">
          love
        </span>{" "}
        watching?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-10 mt-3 text-sm text-porcelain-dim"
      >
        Pick the genres you enjoy most.
      </motion.p>

      <div className="relative z-10 flex max-w-2xl flex-wrap items-center justify-center gap-3">
        {genres.map((g, i) => {
          const active = genreIds.includes(g.id);
          return (
            <motion.button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, scale: active ? 1.04 : 1 }}
              transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm backdrop-blur-sm transition-all duration-300 sm:text-base",
                active
                  ? "border-gold/60 bg-gold/[0.1] text-porcelain shadow-[0_0_18px_-4px_rgba(242,200,121,0.45)]"
                  : "border-porcelain/15 bg-porcelain/[0.03] text-porcelain/70 hover:border-gold/40 hover:bg-porcelain/[0.06] hover:text-porcelain"
              )}
            >
              {g.label}
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: genreIds.length > 0 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mt-10"
      >
        <MagneticButton
          onClick={() => goTo("tasteMovies")}
          disabled={genreIds.length === 0}
        >
          Continue
        </MagneticButton>
      </motion.div>
    </section>
  );
}
