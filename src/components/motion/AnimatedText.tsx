"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  /** stagger delay per word, seconds */
  stagger?: number;
  delay?: number;
  splitBy?: "word" | "char";
}

const container = (stagger: number, delay: number) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const wordVariants = {
  hidden: { y: "110%", opacity: 0 },
  show: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function AnimatedText({
  children,
  as = "p",
  className,
  stagger = 0.06,
  delay = 0,
  splitBy = "word",
}: AnimatedTextProps) {
  const Tag = motion[as];
  const units = splitBy === "word" ? children.split(" ") : children.split("");

  return (
    <Tag
      className={className}
      variants={container(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      aria-label={children}
    >
      {units.map((unit, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pr-[0.28em] last:pr-0">
          <motion.span
            variants={wordVariants}
            className="inline-block will-change-transform"
            aria-hidden
          >
            {unit === "" ? " " : unit}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.9,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
