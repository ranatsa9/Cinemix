"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  getMovies,
  getRecommendation,
} from "@/lib/api";

import {
  mapBackendRecommendation,
} from "@/lib/services/mapRecommendation";

import {
  Movie,
} from "@/lib/types";

import {
  useExperienceStore,
} from "@/lib/store/useExperienceStore";

import {
  MoviePoster,
} from "@/components/scenes/MoviePoster";

import {
  formatMovieTitle,
} from "@/lib/utils/movieTitle";


const STAGE_DURATION = 1650;

const STAGE_PLAN = [
  {
    count: 14,
    label: "Analyzing your taste",
  },
  {
    count: 10,
    label: "Reading your movie preferences",
  },
  {
    count: 7,
    label: "Matching your English level",
  },
  {
    count: 5,
    label: "Balancing challenge and enjoyment",
  },
  {
    count: 3,
    label: "Almost there",
  },
  {
    count: 0,
    label: "Your match is ready",
  },
];


const FALLBACK_PALETTE: [string, string] = [
  "#f2c879",
  "#10142a",
];


interface RealStage {
  count: number;
  label: string;
  movieIds: string[];
}


export function AnalysisScene() {

  const level = useExperienceStore(
    (s) => s.level
  );

  const goal = useExperienceStore(
    (s) => s.goal
  );

  const genreIds = useExperienceStore(
    (s) => s.genreIds
  );

  const selectedMovieIds =
    useExperienceStore(
      (s) => s.selectedMovieIds
    );

  const setRecommendation =
    useExperienceStore(
      (s) => s.setRecommendation
    );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );


  const [pool, setPool] =
    useState<Movie[]>([]);

  const [stages, setStages] =
    useState<RealStage[] | null>(
      null
    );

  const [stageIndex, setStageIndex] =
    useState(0);


  useEffect(() => {

    if (!level || !goal) return;

    let mounted = true;


    async function prepareAnalysis() {

      try {

        const selectedGenre =
          genreIds.length > 0
            ? String(genreIds[0])
            : undefined;


        const catalogueResponse =
          await getMovies(
            selectedGenre,
            40
          );


        if (!mounted) return;


        const realMovies: Movie[] =
          catalogueResponse.movies.map(
            (item) => ({
              id: String(
                item.movie_id
              ),

              title:
                formatMovieTitle(item.title),

              year:
                item.year ?? 0,

              genres: [],

              levelFit: [],

              dialogueComplexity: 3,

              pace: 3,

              posterUrl:
                item.poster_url,

              backdropUrl:
                item.poster_url,

              palette:
                FALLBACK_PALETTE,

              logline:
                item.overview ?? "",

              runtime:
                item.runtime ?? 0,
            })
          );


        setPool(realMovies);


        const ids =
          realMovies.map(
            (movie) =>
              movie.id
          );


        const generatedStages: RealStage[] =
          STAGE_PLAN.map(
            (stage) => {

              if (stage.count === 0) {
                return {
                  count: 0,
                  label: stage.label,
                  movieIds: [],
                };
              }

              return {
                count:
                  Math.min(
                    stage.count,
                    ids.length
                  ),

                label:
                  stage.label,

                movieIds:
                  ids.slice(
                    0,
                    Math.min(
                      stage.count,
                      ids.length
                    )
                  ),
              };
            }
          );


        setStages(
          generatedStages
        );


        const recommendationResponse =
          await getRecommendation({
            english_level:
              String(level),

            learning_goal:
              String(goal),

            genres:
              genreIds.map(
                (genre) =>
                  String(genre)
              ),

            favorite_movies:
              selectedMovieIds.map(
                (movieId) =>
                  String(movieId)
              ),
          });


        if (!mounted) return;


        const top =
          recommendationResponse
            .recommendations?.[0];


        if (top) {

          const mappedRecommendation =
            mapBackendRecommendation(
              top
            );


          setRecommendation(
            mappedRecommendation
          );
        }

      } catch (error) {

        console.error(
          "Analysis/recommendation failed:",
          error
        );

      }

    }


    prepareAnalysis();


    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {

    if (!stages) return;


    if (
      stageIndex >=
      stages.length - 1
    ) {

      const timer =
        setTimeout(
          () =>
            goTo("match"),

          STAGE_DURATION + 250
        );


      return () =>
        clearTimeout(
          timer
        );
    }


    const timer =
      setTimeout(
        () =>
          setStageIndex(
            (index) =>
              index + 1
          ),

        STAGE_DURATION
      );


    return () =>
      clearTimeout(
        timer
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stageIndex,
    stages,
  ]);


  const currentStage =
    stages?.[stageIndex];


  const visibleIds =
    new Set(
      currentStage?.movieIds ??
        []
    );


  const isFinal =
    stages
      ? stageIndex ===
        stages.length - 1
      : false;


  return (
    <section className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-28">

      <div className="mb-14 flex flex-col items-center text-center">

        <AnimatePresence mode="wait">

          {!isFinal ? (
            <motion.h2
              key={
                currentStage?.count ??
                "loading"
              }
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -14,
              }}
              transition={{
                duration: 0.5,
              }}
              className="font-display text-6xl font-semibold text-porcelain sm:text-8xl"
            >
              {
                currentStage?.count ??
                "…"
              }
            </motion.h2>
          ) : (
            <motion.h2
              key="match-ready"
              initial={{
                opacity: 0,
                scale: 0.92,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 1.04,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-display text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-porcelain via-gold to-violet sm:text-6xl"
            >
              MATCH READY
            </motion.h2>
          )}

        </AnimatePresence>


        <AnimatePresence mode="wait">

          {
            currentStage?.label &&
            (
              <motion.p
                key={
                  currentStage.label
                }
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.4,
                }}
                className="mt-4 text-sm uppercase tracking-[0.35em] text-cyan"
              >
                {
                  currentStage.label
                }
              </motion.p>
            )
          }

        </AnimatePresence>

      </div>


      {!isFinal ? (
        <motion.div
          layout
          className="flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-4"
        >

          <AnimatePresence>

            {pool
              .filter(
                (movie) =>
                  visibleIds.has(
                    movie.id
                  )
              )
              .map(
                (movie) => (

                  <motion.div
                    key={
                      movie.id
                    }
                    layout
                    initial={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.6,
                      filter:
                        "blur(8px)",
                    }}
                    animate={{
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.6,

                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                  >

                    <MoviePoster
                      movie={
                        movie
                      }
                      size="sm"
                      disabled
                    />

                  </motion.div>

                )
              )}

          </AnimatePresence>

        </motion.div>
      ) : (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.7,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative flex h-28 w-28 items-center justify-center"
        >
          <motion.div
            className="absolute h-24 w-24 rounded-full border border-gold/40"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.8, 0.35],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="h-3 w-3 rounded-full bg-gold"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}

    </section>
  );
}
