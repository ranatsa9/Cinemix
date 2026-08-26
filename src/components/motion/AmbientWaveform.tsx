"use client";

import { motion } from "framer-motion";

// Purely decorative — a faint, slow-breathing waveform line used to
// give language/sound-themed scenes (goal picker, speaking chapters)
// a bit of atmosphere without competing with foreground content.
export function AmbientWaveform({ color = "var(--color-violet)" }: { color?: string }) {
  const bars = Array.from({ length: 60 }, (_, i) => {
    const wave = Math.sin(i * 0.35) * 0.5 + 0.5;
    return 0.15 + wave * 0.85;
  });

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[22vh] items-end justify-center gap-[3px] opacity-[0.08]"
      aria-hidden
    >
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[4px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{ height: [`${h * 40}%`, `${h * 70}%`, `${h * 40}%`] }}
          transition={{
            duration: 6 + (i % 5),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}
