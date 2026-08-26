"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import {
  getAdaptiveVocabulary,
  type AdaptiveVocabularyItem,
} from "@/lib/api";

import { MagneticButton } from "@/components/motion/MagneticButton";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";

import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { cn } from "@/lib/utils";
import { getVocabularyForMovie } from "@/lib/mockData/vocabulary";
import { vocabularyMeaning } from "@/lib/services/experienceFallbacks";

type Step =
  | { kind: "intro"; line: string }
  | { kind: "vocab"; index: number }
  | { kind: "ready" };

export function BeforeWatchScene() {
  const recommendation = useExperienceStore(
    (s) => s.recommendation
  );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );

  const [vocab, setVocab] =
    useState<AdaptiveVocabularyItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [stepIndex, setStepIndex] =
    useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadVocabulary() {
      try {
        setLoading(true);
        setLoadError(null);

        const movieId = Number(
          recommendation?.movie.id
        );

        if (!Number.isFinite(movieId)) {
          throw new Error("Invalid movie ID");
        }

        const response =
          await getAdaptiveVocabulary(
            movieId
          );

        if (!mounted) return;

        if (
          !response.vocabulary ||
          response.vocabulary.length === 0
        ) {
          throw new Error(
            "No vocabulary available for this movie"
          );
        }

        setVocab(
          response.vocabulary
        );

      } catch (error) {
        console.error(
          "Failed to load vocabulary:",
          error
        );

        if (!mounted) return;

        const fallback = getVocabularyForMovie(
          String(recommendation?.movie.id ?? "default")
        ).map((item) => ({
          correct_word: item.phrase,
          options: [item.phrase],
          context: item.example,
          meaning: item.meaning,
          source: "curated-fallback",
        }));
        setVocab(fallback);
        setLoadError(null);

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVocabulary();

    return () => {
      mounted = false;
    };
  }, [recommendation]);

  const steps = useMemo<Step[]>(
    () => [
      {
        kind: "intro",
        line: "Before you press play...",
      },

      {
        kind: "intro",
        line: "Here are a few words you'll hear.",
      },

      ...vocab.map(
        (_, i) =>
          ({
            kind: "vocab",
            index: i,
          } as const)
      ),

      {
        kind: "ready",
      },
    ],
    [vocab]
  );

  const step =
    steps[stepIndex];

  const isLast =
    stepIndex ===
    steps.length - 1;

  const advance = () => {
    if (!isLast) {
      setStepIndex(
        (i) => i + 1
      );
    }
  };

  if (loading) {
    return (
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-28">
        <HeroPosterField />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-gold">
            Preparing your vocabulary...
          </p>
        </motion.div>
      </section>
    );
  }

  if (
    loadError ||
    vocab.length === 0
  ) {
    return (
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-28">
        <HeroPosterField />

        <div className="relative z-10 max-w-xl text-center">
          <h2 className="font-display text-3xl text-porcelain sm:text-5xl">
            Vocabulary unavailable
          </h2>

          <p className="mt-4 text-porcelain-dim">
            {loadError ??
              "No vocabulary was generated for this movie."}
          </p>

          <div className="mt-10">
            <MagneticButton
              onClick={() =>
                goTo("watchOptions")
              }
            >
              Continue
            </MagneticButton>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-28">
      <HeroPosterField />

      <div className="relative z-10 flex w-full flex-col items-center">

        <div className="mb-10 flex items-center gap-2">
          {steps
            .filter(
              (s) =>
                s.kind === "vocab"
            )
            .map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",

                  step.kind === "vocab" &&
                    step.index === i
                    ? "bg-amber"
                    : "bg-porcelain/20"
                )}
              />
            ))}
        </div>

        <AnimatePresence mode="wait">

          {step.kind === "intro" && (
            <motion.div
              key={`intro-${stepIndex}`}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
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
              className="max-w-xl text-center"
            >
              <h2 className="font-display text-3xl text-porcelain sm:text-5xl">
                {step.line}
              </h2>
            </motion.div>
          )}

          {step.kind === "vocab" && (
            <motion.div
              key={`vocab-${step.index}`}
              initial={{
                opacity: 0,
                y: 24,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -24,
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
              className="max-w-lg text-center"
            >
              <p className="font-display text-4xl font-semibold text-amber sm:text-5xl">
                {
                  vocab[
                    step.index
                  ].correct_word
                }
              </p>

              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-porcelain-dim">
                {vocab[step.index].meaning ??
                  vocabularyMeaning(vocab[step.index].correct_word)}
              </p>

              {vocab[step.index].context && (
                <div className="mt-7 rounded-2xl border border-porcelain/10 bg-porcelain/[0.04] px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-porcelain-dim">
                    From this movie&apos;s dialogue
                  </p>
                  <p className="mt-3 font-display text-xl leading-relaxed text-porcelain/85">
                    &ldquo;{vocab[step.index].context}&rdquo;
                  </p>
                </div>
              )}

              {vocab[
                step.index
              ].source && (
                <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-porcelain/30">
                  {
                    vocab[
                      step.index
                    ].source ===
                    "word2vec"
                      ? "Selected for this movie"
                      : "Movie vocabulary"
                  }
                </p>
              )}
            </motion.div>
          )}

          {step.kind === "ready" && (
            <motion.div
              key="ready"
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
              className="flex flex-col items-center gap-8 text-center"
            >
              <h2 className="bg-gradient-to-r from-porcelain via-gold to-gold bg-clip-text font-display text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
                YOU&apos;RE READY.
              </h2>

              <MagneticButton
                onClick={() =>
                  goTo("watchOptions")
                }
              >
                Go Watch 🎬
              </MagneticButton>
            </motion.div>
          )}

        </AnimatePresence>

        {!isLast && (
          <motion.button
            onClick={advance}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.5,
            }}
            className="mt-14 text-sm uppercase tracking-[0.3em] text-porcelain-dim transition-colors hover:text-porcelain"
          >
            Next →
          </motion.button>
        )}

      </div>
    </section>
  );
}
