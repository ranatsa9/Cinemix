"use client";

import { useMemo, useState } from "react";
import { Movie } from "@/lib/types";
import { MoviePoster } from "@/components/scenes/MoviePoster";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

interface PosterUniverseProps {
  movies: Movie[];
  selectedIds: string[];
  onToggle: (movieId: string) => void;
  /** when true, everything slows and non-selected posters dim */
  settled?: boolean;
  maxReached: boolean;
}

interface RowConfig {
  movies: Movie[];
  direction: "left" | "right";
  duration: number;
}

export function PosterUniverse({
  movies,
  selectedIds,
  onToggle,
  settled = false,
  maxReached,
}: PosterUniverseProps) {
  const reduced = useReducedMotionSafe();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const rows = useMemo<RowConfig[]>(() => {
    const rowCount = 3;
    const buckets: Movie[][] = Array.from({ length: rowCount }, () => []);
    movies.forEach((m, i) => buckets[i % rowCount].push(m));

    return buckets.map((list, i) => ({
      movies: list,
      direction: i % 2 === 0 ? "left" : "right",
      duration: 46 + i * 14,
    }));
  }, [movies]);

  return (
    <div className="flex w-full flex-col gap-5 py-4 sm:gap-7">
      {rows.map((row, i) => {
        const tripled = [...row.movies, ...row.movies, ...row.movies];
        const paused = reduced || settled || hoveredRow === i;

        return (
          <div
            key={i}
            className="overflow-hidden"
            onMouseEnter={() => setHoveredRow(i)}
            onMouseLeave={() => setHoveredRow(null)}
          >
            <div
              className="flex w-max gap-4 sm:gap-5"
              style={{
                animation: reduced
                  ? undefined
                  : `${row.direction === "left" ? "drift" : "drift-reverse"} ${row.duration}s linear infinite`,
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              {tripled.map((movie, j) => {
                const isSelected = selectedIds.includes(movie.id);
                const disabled = !isSelected && maxReached;
                const dimmed = settled && !isSelected;

                return (
                  <MoviePoster
                    key={`${movie.id}-${j}`}
                    movie={movie}
                    selected={isSelected}
                    dimmed={dimmed}
                    disabled={disabled}
                    onClick={() => onToggle(movie.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
