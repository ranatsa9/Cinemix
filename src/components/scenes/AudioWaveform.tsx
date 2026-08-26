"use client";

import { motion } from "framer-motion";

interface AudioWaveformProps {
  levels: number[];
  active: boolean;
  color?: string;
}

export function AudioWaveform({ levels, active, color = "var(--color-pink)" }: AudioWaveformProps) {
  return (
    <div className="flex h-12 items-center gap-[3px]" aria-hidden>
      {levels.map((level, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: active ? `${Math.max(8, level * 100)}%` : "12%",
            opacity: active ? 0.6 + level * 0.4 : 0.3,
          }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
