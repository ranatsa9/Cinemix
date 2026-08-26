"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Check } from "lucide-react";
import { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MoviePosterProps {
  movie: Movie;
  selected?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  priority?: boolean;
}

const sizes = {
  sm: "h-[16vh] w-[10.5vh] min-h-[110px] min-w-[74px]",
  md: "h-[24vh] w-[16vh] min-h-[160px] min-w-[106px]",
  lg: "h-[44vh] w-[29vh] min-h-[300px] min-w-[200px]",
};

const imageSizes = {
  sm: "110px",
  md: "160px",
  lg: "300px",
};

export function MoviePoster({
  movie,
  selected = false,
  dimmed = false,
  disabled = false,
  size = "md",
  onClick,
  priority = false,
}: MoviePosterProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${movie.title} (${movie.year})${selected ? ", selected" : ""}`}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg text-left shadow-lg shadow-black/40 outline-none",
        sizes[size],
        disabled && !selected && "cursor-default"
      )}
      animate={{
        opacity: dimmed ? 0.25 : 1,
        scale: selected ? 1.05 : 1,
      }}
      whileHover={!disabled || selected ? { scale: 1.08, zIndex: 20 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ zIndex: selected ? 10 : undefined }}
    >
      {/* color-matched fallback shown beneath the image while it loads */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(155deg, ${movie.palette[0]}, ${movie.palette[1]})`,
        }}
      />

      <Image
        src={movie.posterUrl}
        alt={`${movie.title} movie poster`}
        fill
        sizes={imageSizes[size]}
        priority={priority}
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/10 opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="font-display text-[0.8rem] leading-tight text-porcelain drop-shadow sm:text-sm">
          {movie.title}
        </p>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-midnight"
        >
          <Check size={14} strokeWidth={3} />
        </motion.div>
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset transition-all duration-300",
          selected ? "ring-gold" : "ring-transparent group-hover:ring-porcelain/30"
        )}
      />
    </motion.button>
  );
}
