"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";

type Beat = "loading" | "line1" | "line2" | "brand";

export function IntroScene() {
  const goTo = useExperienceStore((s) => s.goTo);
  const [beat, setBeat] = useState<Beat>("loading");

  useEffect(() => {
    const t1 = setTimeout(() => setBeat("line1"), 500);
    const t2 = setTimeout(() => setBeat("line2"), 3100);
    const t3 = setTimeout(() => setBeat("brand"), 5900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
      {/* floating poster field, quiet and slow */}
      <HeroPosterField />

      <div className="relative z-10 max-w-4xl">
        {beat === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-violet" />
            <span className="cinemix-mini-wordmark text-xs uppercase tracking-[0.4em]">
              CINEMIX
            </span>
          </motion.div>
        )}

       {beat === "line1" && (
  <motion.h1
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
    className="intro-statement"
  >
    You already love <span className="text-gold">movies.</span>
  </motion.h1>
)}


        {beat === "line2" && (
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="intro-statement"
          >
            What if they could improve{" "}
            <span className="intro-statement-accent">your English too?</span>
          </motion.h1>
        )}

        {beat === "brand" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center gap-8"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              className="cinemix-wordmark text-5xl sm:text-7xl md:text-8xl"
            >
              <span className="cinemix-wordmark-name">CINEMIX</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-sm uppercase tracking-[0.35em] text-porcelain-dim"
            >
              Level Up Your English, One Scene at a Time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.9 }}
            >
              <MagneticButton onClick={() => goTo("levelTest")}>
                Begin the Experience
              </MagneticButton>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
