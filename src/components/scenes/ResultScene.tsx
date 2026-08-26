"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { MagneticButton } from "@/components/motion/MagneticButton";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { formatMovieTitle } from "@/lib/utils/movieTitle";


function useCountUp(
  target: number,
  durationMs = 1300
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(
        1,
        (now - start) / durationMs
      );

      const eased =
        1 - Math.pow(1 - t, 3);

      setValue(
        Math.round(
          eased * target
        )
      );

      if (t < 1) {
        raf =
          requestAnimationFrame(
            tick
          );
      }
    };

    raf =
      requestAnimationFrame(
        tick
      );

    return () =>
      cancelAnimationFrame(
        raf
      );
  }, [target, durationMs]);

  return value;
}


type AdaptiveMovie = {
  movieId?: number;
  movie_id?: number;

  title?: string;

  year?: number;

  main_genre?: string;

  language_level?: string;

  hybrid_score?: number;

  poster_url?: string;

  recommendation_reason?: string;
};


export function ResultScene() {
  const speakingResult =
    useExperienceStore(
      (s) => s.speakingResult
    );

  const quizResult =
    useExperienceStore(
      (s) => s.quizResult
    );

  const adaptiveResult =
    useExperienceStore(
      (s) => s.adaptiveResult
    );

  const findNextMovie =
    useExperienceStore(
      (s) => s.findNextMovie
    );


  const [activePanel, setActivePanel] =
    useState<
      "progress" | "movies" | null
    >(null);


  const overall =
    speakingResult
      ? speakingResult.overall

      : quizResult
      ? Math.round(
          (
            quizResult.correct /
            quizResult.total
          ) * 100
        )

      : 0;


  const animatedOverall =
    useCountUp(
      overall
    );


  const nextRecommendations =
    (
      adaptiveResult
        ?.next_recommendations ??
      []
    ) as AdaptiveMovie[];


  const previousLevel =
    adaptiveResult
      ?.level_before ??
    "Beginner";


  const currentLevel =
    adaptiveResult
      ?.level_after ??
    previousLevel;


  const activityScore =
    adaptiveResult
      ? Math.round(
          adaptiveResult.activity_score
        )
      : overall;


  const levelChanged =
    previousLevel !==
    currentLevel;


  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-24">

      <HeroPosterField />


      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">

        {/* =================================================
            SCORE HERO
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.8,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}

          className="mb-10"
        >

          <p className="mb-4 text-xs uppercase tracking-[0.45em] text-gold/70">

            {speakingResult
              ? "Your speaking score"
              : "Your quiz score"}

          </p>


          <motion.h1
            initial={{
              opacity: 0,
              scale: 0.9,
            }}

            animate={{
              opacity: 1,
              scale: 1,
            }}

            transition={{
              duration: 0.9,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}

            className="bg-gradient-to-r from-porcelain via-gold to-gold bg-clip-text font-display text-8xl font-semibold text-transparent sm:text-[9rem]"
          >
            {animatedOverall}
          </motion.h1>


          {quizResult && (

            <motion.p
              initial={{
                opacity: 0,
              }}

              animate={{
                opacity: 1,
              }}

              transition={{
                delay: 0.5,
              }}

              className="mt-3 text-sm text-porcelain-dim"
            >
              {quizResult.correct}
              {" "}
              of
              {" "}
              {quizResult.total}
              {" "}
              correct
            </motion.p>

          )}

        </motion.div>


        {/* =================================================
            MESSAGE
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            delay: 0.7,
            duration: 0.8,
          }}

          className="mb-10"
        >

          <p className="font-display text-2xl text-porcelain sm:text-3xl">
            Cinemix is learning with you.
          </p>

          <p className="mt-3 text-sm text-porcelain-dim">
            Your next experience is already adapting.
          </p>

        </motion.div>


        {/* =================================================
            MAIN BUTTONS
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            delay: 1,
            duration: 0.7,
          }}

          className="mb-10 flex flex-col items-center gap-4 sm:flex-row"
        >

          <MagneticButton
            onClick={() =>
              setActivePanel(
                activePanel === "movies"
                  ? null
                  : "movies"
              )
            }
          >
            Find My Next Movie
          </MagneticButton>


          <MagneticButton
            variant="ghost"

            onClick={() =>
              setActivePanel(
                activePanel === "progress"
                  ? null
                  : "progress"
              )
            }
          >
            View My Progress
          </MagneticButton>

        </motion.div>


        {/* =================================================
            PANELS
        ================================================= */}

        <AnimatePresence mode="wait">

          {/* =================================================
              PROGRESS PANEL
          ================================================= */}

          {activePanel === "progress" && (

            <motion.div
              key="progress"

              initial={{
                opacity: 0,
                y: 28,
                scale: 0.97,
              }}

              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}

              exit={{
                opacity: 0,
                y: 18,
                scale: 0.98,
              }}

              transition={{
                duration: 0.7,
                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}

              className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-porcelain/10 bg-midnight/70 px-6 py-10 backdrop-blur-2xl sm:px-12"
            >

              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-[80px]" />


              <p className="relative mb-10 text-xs uppercase tracking-[0.45em] text-gold">
                Your Progress
              </p>


              {!adaptiveResult ? (

                <motion.div
                  initial={{
                    opacity: 0,
                  }}

                  animate={{
                    opacity: 1,
                  }}

                  className="py-10"
                >
                  <p className="text-sm text-porcelain-dim">
                    Syncing your learning path...
                  </p>
                </motion.div>

              ) : (

                <div className="relative">

                  {/* LEVEL JOURNEY */}

                  <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">

                    <motion.div
                      initial={{
                        opacity: 0,
                        x: -20,
                      }}

                      animate={{
                        opacity: 1,
                        x: 0,
                      }}

                      transition={{
                        delay: 0.15,
                      }}

                      className="text-center"
                    >

                      <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-porcelain-dim">
                        Previous
                      </p>

                      <p className="font-display text-3xl text-porcelain">
                        {previousLevel}
                      </p>

                    </motion.div>


                    <div className="flex items-center gap-3">

                      <motion.div
                        initial={{
                          width: 0,
                        }}

                        animate={{
                          width: 80,
                        }}

                        transition={{
                          delay: 0.35,
                          duration: 0.8,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}

                        className="h-px bg-gradient-to-r from-porcelain/20 to-gold/70"
                      />


                      <motion.span
                        initial={{
                          opacity: 0,
                          scale: 0.7,
                        }}

                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}

                        transition={{
                          delay: 0.55,
                        }}

                        className="text-xl text-gold"
                      >
                        →
                      </motion.span>


                      <motion.div
                        initial={{
                          width: 0,
                        }}

                        animate={{
                          width: 80,
                        }}

                        transition={{
                          delay: 0.35,
                          duration: 0.8,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}

                        className="h-px bg-gradient-to-r from-gold/70 to-porcelain/20"
                      />

                    </div>


                    <motion.div
                      initial={{
                        opacity: 0,
                        x: 20,
                      }}

                      animate={{
                        opacity: 1,
                        x: 0,
                      }}

                      transition={{
                        delay: 0.15,
                      }}

                      className="text-center"
                    >

                      <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold/70">
                        Current
                      </p>

                      <p className="font-display text-3xl text-gold">
                        {currentLevel}
                      </p>

                    </motion.div>

                  </div>


                  {/* SCORE ORB */}

                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}

                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}

                    transition={{
                      delay: 0.7,
                      duration: 0.7,
                    }}

                    className="mx-auto mt-12 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-gold/25 bg-gold/[0.04] shadow-[0_0_60px_-20px_rgba(242,200,121,0.55)]"
                  >

                    <p className="font-display text-4xl text-porcelain">
                      {activityScore}
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-porcelain-dim">
                      Activity
                    </p>

                  </motion.div>


                  <motion.p
                    initial={{
                      opacity: 0,
                    }}

                    animate={{
                      opacity: 1,
                    }}

                    transition={{
                      delay: 1,
                    }}

                    className="mt-8 text-sm text-porcelain-dim"
                  >
                    {levelChanged
                      ? `Your path has shifted from ${previousLevel} to ${currentLevel}.`
                      : `You’re holding steady at ${currentLevel}. Cinemix will keep adjusting the challenge.`}
                  </motion.p>

                </div>

              )}

            </motion.div>

          )}


          {/* =================================================
              NEXT MOVIES PANEL
          ================================================= */}

          {activePanel === "movies" && (

            <motion.div
              key="movies"

              initial={{
                opacity: 0,
                y: 28,
                scale: 0.97,
              }}

              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}

              exit={{
                opacity: 0,
                y: 18,
                scale: 0.98,
              }}

              transition={{
                duration: 0.7,
                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}

              className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-porcelain/10 bg-midnight/70 px-6 py-10 backdrop-blur-2xl sm:px-10"
            >

              <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-[30rem] -translate-x-1/2 rounded-full bg-violet/10 blur-[90px]" />


              <p className="relative mb-8 text-xs uppercase tracking-[0.45em] text-gold">
                Your Next Matches
              </p>


              {!adaptiveResult ? (

                <p className="py-10 text-sm text-porcelain-dim">
                  Preparing your next matches...
                </p>

              ) : nextRecommendations.length === 0 ? (

                <div className="py-8">

                  <p className="mb-8 text-sm text-porcelain-dim">
                    No adaptive matches are ready yet.
                  </p>


                  <MagneticButton
                    onClick={
                      findNextMovie
                    }
                  >
                    Choose Again
                  </MagneticButton>

                </div>

              ) : (

                <div className="grid gap-6 sm:grid-cols-3">

                  {nextRecommendations
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        movie,
                        index
                      ) => {

                        const title = movie.title
                          ? formatMovieTitle(movie.title)
                          : `Movie ${index + 1}`;

                        const match =
                          typeof movie.hybrid_score === "number"
                            ? Math.round(
                                movie.hybrid_score *
                                100
                              )
                            : null;


                        return (

                          <motion.button
                            type="button"

                            key={
                              movie.movieId ??
                              movie.movie_id ??
                              `${title}-${index}`
                            }

                            initial={{
                              opacity: 0,
                              y: 22,
                            }}

                            animate={{
                              opacity: 1,
                              y: 0,
                            }}

                            transition={{
                              delay:
                                0.12 +
                                index * 0.12,
                              duration: 0.6,
                              ease: [
                                0.16,
                                1,
                                0.3,
                                1,
                              ],
                            }}

                            whileHover={{
                              y: -8,
                              scale: 1.025,
                            }}

                            className="group text-left"
                          >

                            {/* POSTER */}

                            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-porcelain/10 bg-porcelain/[0.03] shadow-2xl shadow-black/30">

                              {movie.poster_url ? (

                                <Image
                                  src={
                                    movie.poster_url
                                  }

                                  alt={
                                    title
                                  }

                                  fill

                                  sizes="(max-width: 640px) 80vw, 260px"

                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                              ) : (

                                <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-porcelain-dim">
                                  {title}
                                </div>

                              )}


                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />


                              {match !== null && (

                                <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-xl">

                                  <span className="text-xs font-medium text-gold">
                                    {match}% MATCH
                                  </span>

                                </div>

                              )}


                              <div className="absolute inset-x-0 bottom-0 p-5">

                                <p className="font-display text-xl leading-tight text-white">
                                  {title}
                                </p>


                                <div className="mt-3 flex flex-wrap gap-2">

                                  {movie.language_level && (

                                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-gold/80">
                                      {movie.language_level}
                                    </span>

                                  )}


                                  {movie.main_genre && (

                                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/60">
                                      {movie.main_genre}
                                    </span>

                                  )}

                                </div>

                              </div>

                            </div>

                          </motion.button>

                        );
                      }
                    )}

                </div>

              )}

            </motion.div>

          )}

        </AnimatePresence>

      </div>

    </section>
  );
}
