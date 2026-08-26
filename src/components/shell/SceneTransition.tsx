"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { ReactNode } from "react";

const variants: Variants = {
  initial: { opacity: 0, scale: 1.03, filter: "blur(12px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(16px)",
    transition: { duration: 0.7, ease: [0.7, 0, 0.84, 0] },
  },
};

export function SceneTransition({
  sceneKey,
  children,
}: {
  sceneKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sceneKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative min-h-screen w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
