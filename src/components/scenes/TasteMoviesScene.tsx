"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { getMovies } from "@/lib/api";
import { Movie } from "@/lib/types";

import { PosterUniverse } from "@/components/scenes/PosterUniverse";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useExperienceStore } from "@/lib/store/useExperienceStore";


const FALLBACK_PALETTE: [string, string] = [
  "#f2c879",
  "#10142a",
];


export function TasteMoviesScene() {
  const selectedMovieIds = useExperienceStore(
    (s) => s.selectedMovieIds
  );

  const toggleMovie = useExperienceStore(
    (s) => s.toggleMovie
  );

  const genreIds = useExperienceStore(
    (s) => s.genreIds
  );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [settled, setSettled] = useState(false);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);


  // ==================================
  // Load REAL movies from FastAPI
  // ==================================

  useEffect(() => {
    let mounted = true;

    async function loadRealMovies() {
      try {
        setLoading(true);

        const selectedGenre =
          genreIds.length > 0
            ? String(genreIds[0])
            : undefined;

        const response = await getMovies(
          selectedGenre,
          40
        );

        if (!mounted) return;

        const mappedMovies: Movie[] =
          response.movies.map((item) => ({
            id: String(item.movie_id),

            title: item.title,

            year: item.year ?? 0,

            // These fields are required by the
            // existing Movie UI type.
            genres: [],
            levelFit: [],

            dialogueComplexity: 3,
            pace: 3,

            posterUrl: item.poster_url,
            backdropUrl: item.poster_url,

            palette: FALLBACK_PALETTE,

            logline: item.overview ?? "",

            runtime: item.runtime ?? 0,
          }));

        setMovies(mappedMovies);
      } catch (error) {
        console.error(
          "Failed to load movie catalogue:",
          error
        );

        setMovies([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRealMovies();

    return () => {
      mounted = false;
    };
  }, [genreIds]);


  // ==================================
  // Movie selection
  // ==================================

  const handleToggle = (movieId: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSettled(false);

    toggleMovie(movieId);
  };


  useEffect(() => {
    if (selectedMovieIds.length !== 3) {
      return;
    }

    timerRef.current = setTimeout(
      () => setSettled(true),
      900
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [selectedMovieIds.length]);


  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-0 py-28">

      <div className="mb-10 flex flex-col items-center px-6 text-center">

        <AnimatePresence mode="wait">

          {!settled ? (
            <motion.div
              key="prompt"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              transition={{
                duration: 0.5,
              }}
            >
              <h2 className="font-display text-3xl text-porcelain sm:text-5xl">
                Pick 3 movies you love.
              </h2>

              <p className="mt-4 text-sm uppercase tracking-[0.3em] text-porcelain-dim">
                {selectedMovieIds.length} / 3 selected
              </p>

            </motion.div>
          ) : (
            <motion.div
              key="settled"
              initial={{
                opacity: 0,
                scale: 0.92,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <h2 className="font-display text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-coral via-pink to-violet sm:text-6xl">
                WE KNOW YOUR TASTE.
              </h2>
            </motion.div>
          )}

        </AnimatePresence>

      </div>


      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-sm uppercase tracking-[0.3em] text-porcelain-dim"
        >
          Loading movies...
        </motion.div>
      ) : movies.length > 0 ? (
        <PosterUniverse
          movies={movies}
          selectedIds={selectedMovieIds}
          onToggle={handleToggle}
          settled={settled}
          maxReached={
            selectedMovieIds.length >= 3
          }
        />
      ) : (
        <p className="py-20 text-sm text-porcelain-dim">
          No movies available.
        </p>
      )}


      <AnimatePresence>

        {settled && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4,
              duration: 0.7,
            }}
            className="mt-14"
          >
            <MagneticButton
              onClick={() =>
                goTo("analysis")
              }
            >
              Find My Movie
            </MagneticButton>

          </motion.div>
        )}

      </AnimatePresence>

    </section>
  );
}
