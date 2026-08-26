"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import {
  getAdaptiveActivity,
  getAdaptiveVocabulary,
  updateAdaptiveLearning,
  type AdaptiveQuizItem,
} from "@/lib/api";
import { getVocabularyForMovie } from "@/lib/mockData/vocabulary";
import { shuffled } from "@/lib/services/experienceFallbacks";

import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { cn } from "@/lib/utils";


type UiChoice = {
  id: string;
  text: string;
  word: string;
};

type UiQuestion = {
  id: string;
  prompt: string;
  choices: UiChoice[];
  correctId: string;
  correctWord: string;
};


function renderPrompt(prompt: string) {
  const match = prompt.match(/"([^"]+)"/);

  if (!match) {
    return prompt;
  }

  const [full, word] = match;
  const [before, after] = prompt.split(full);

  return (
    <>
      {before}

      <span className="text-gold">
        &ldquo;{word}&rdquo;
      </span>

      {after}
    </>
  );
}


function mapAdaptiveQuestion(
  item: AdaptiveQuizItem,
  index: number
): UiQuestion {
  // A meaning question only works when every option has its own definition.
  // vocabularyMeaning() returns the same generic sentence for unknown words,
  // which would render four identical answers.
  const meanings = item.options.map(
    (option) => vocabularyMeaning(option)
  );

  const meaningsAreDistinct =
    new Set(meanings).size === meanings.length;

  const choices: UiChoice[] = item.options.map(
    (option, optionIndex) => ({
      id: `q${index}-c${optionIndex}`,
      text: meaningsAreDistinct
        ? meanings[optionIndex]
        : option,
      word: option,
    })
  );

  const correctChoice = choices.find(
    (choice) => choice.word === item.correct_word
  );

  return {
    id: `q${index}`,

    // Ask what the word means when definitions are available; otherwise fall
    // back to the masked sentence rather than showing four identical options.
    prompt: meaningsAreDistinct
      ? `What does "${item.correct_word}" mean?`
      : item.context ||
        `Choose the correct word: "${item.correct_word}"`,

    choices,

    correctId:
      correctChoice?.id ?? "",

    correctWord:
      item.correct_word,
  };
}

function buildFallbackQuiz(
  movieId: number,
  remoteWords: AdaptiveQuizItem[] = []
): AdaptiveQuizItem[] {
  const local = getVocabularyForMovie(String(movieId)).map((item) => ({
    correct_word: item.phrase,
    options: [] as string[],
    context: item.example,
    source: "curated-fallback",
  }));
  const source = remoteWords.length >= 3 ? remoteWords : local;
  const words = source.map((item) => item.correct_word);

  return source.slice(0, 5).map((item) => ({
    ...item,
    options: shuffled([
      item.correct_word,
      ...words.filter((word) => word !== item.correct_word),
    ]).slice(0, 4),
  }));
}


export function QuizScene() {
  const recommendation = useExperienceStore(
    (s) => s.recommendation
  );

  const setQuizResult = useExperienceStore(
    (s) => s.setQuizResult
  );

  const setAdaptiveResult = useExperienceStore(
    (s) => s.setAdaptiveResult
  );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );


  const [adaptiveQuiz, setAdaptiveQuiz] =
    useState<AdaptiveQuizItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [index, setIndex] =
    useState(0);

  const [selected, setSelected] =
    useState<string | null>(null);

  const [correctCount, setCorrectCount] =
    useState(0);

  const [answers, setAnswers] =
    useState<string[]>([]);


  // ==================================
  // Load real adaptive quiz
  // ==================================

  useEffect(() => {
    let mounted = true;

    async function loadQuiz() {
      try {
        setLoading(true);
        setLoadError(null);

        const movieId = Number(
          recommendation?.movie.id
        );

        if (!Number.isFinite(movieId)) {
          throw new Error(
            "Invalid movie ID"
          );
        }

        const activity =
          await getAdaptiveActivity(
            movieId
          );

        if (!mounted) return;

        setAdaptiveQuiz(
          activity.quiz?.length
            ? activity.quiz
            : buildFallbackQuiz(movieId)
        );

      } catch (error) {
        console.error(
          "Failed to load adaptive quiz:",
          error
        );

        if (!mounted) return;

        try {
          const movieId = Number(recommendation?.movie.id);
          const vocabulary = Number.isFinite(movieId)
            ? await getAdaptiveVocabulary(movieId)
            : { vocabulary: [] };
          if (!mounted) return;
          setAdaptiveQuiz(
            buildFallbackQuiz(movieId, vocabulary.vocabulary ?? [])
          );
          setLoadError(null);
        } catch {
          const movieId = Number(recommendation?.movie.id) || 0;
          setAdaptiveQuiz(buildFallbackQuiz(movieId));
          setLoadError(null);
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      mounted = false;
    };
  }, [recommendation]);


  // ==================================
  // Convert backend questions to UI
  // ==================================

  const questions =
    useMemo<UiQuestion[]>(
      () =>
        adaptiveQuiz.map(
          mapAdaptiveQuestion
        ),
      [adaptiveQuiz]
    );


  const question =
    questions[index];

  const isLast =
    questions.length > 0 &&
    index === questions.length - 1;


  // ==================================
  // Background adaptive update
  // ==================================

  const updateLearningProfileInBackground = (
    nextAnswers: string[]
  ) => {
    const movieId = Number(
      recommendation?.movie.id
    );

    const adaptiveActivity = {
      quiz: questions.map(
        (q) => ({
          correct_word:
            q.correctWord,
        })
      ),
    };

    void updateAdaptiveLearning({
      user_id:
        "cinemix_demo_user",

      movie_id:
        Number.isFinite(movieId)
          ? movieId
          : 7763,

      activity_mode:
        "quiz",

      activity:
        adaptiveActivity,

      quiz_answers:
        nextAnswers,

      attempt_result:
        null,

      enjoyment_rating:
        null,
    })
      .then((adaptiveResult) => {
        console.log(
          "ADAPTIVE RESULT:",
          adaptiveResult
        );

        // Save the FULL adaptive result
        // so ResultScene can use it.
        setAdaptiveResult(
          adaptiveResult
        );

        // ResultScene reconciles this response with the learner's saved
        // placement level, so a single activity cannot accidentally downgrade it.
      })
      .catch((error) => {
        console.error(
          "Adaptive learning background update failed:",
          error
        );
      });
  };


  // ==================================
  // Handle answer
  // ==================================

  const handleSelect = (
    choiceId: string
  ) => {
    if (
      selected ||
      !question
    ) {
      return;
    }

    setSelected(
      choiceId
    );

    const selectedChoice =
      question.choices.find(
        (choice) =>
          choice.id === choiceId
      );

    const selectedText =
      selectedChoice?.text ?? "";

    const nextAnswers = [
      ...answers,
      selectedText,
    ];

    setAnswers(
      nextAnswers
    );

    const isCorrect =
      choiceId ===
      question.correctId;

    const nextCorrect =
      isCorrect
        ? correctCount + 1
        : correctCount;

    if (isCorrect) {
      setCorrectCount(
        nextCorrect
      );
    }


    setTimeout(() => {

      // ==================================
      // LAST QUESTION
      // ==================================

      if (isLast) {

        // Save quiz score immediately
        setQuizResult({
          correct:
            nextCorrect,

          total:
            questions.length,
        });


        // Start Adaptive Learning
        // in the background
        updateLearningProfileInBackground(
          nextAnswers
        );


        // Show ResultScene immediately
        goTo(
          "result"
        );

        return;
      }


      // ==================================
      // NEXT QUESTION
      // ==================================

      setIndex(
        (i) => i + 1
      );

      setSelected(
        null
      );

    }, 650);
  };


  // ==================================
  // Loading
  // ==================================

  if (loading) {
    return (
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-28">

        <HeroPosterField />

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="relative z-10 text-center"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-gold">
            Building your quiz...
          </p>
        </motion.div>

      </section>
    );
  }


  // ==================================
  // Error
  // ==================================

  if (
    loadError ||
    questions.length === 0
  ) {
    return (
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-28">

        <HeroPosterField />

        <div className="relative z-10 max-w-xl text-center">

          <h2 className="font-display text-3xl text-porcelain sm:text-5xl">
            Quiz unavailable
          </h2>

          <p className="mt-4 text-porcelain-dim">
            {loadError ??
              "No quiz was generated for this movie."}
          </p>

        </div>

      </section>
    );
  }


  // ==================================
  // Main quiz UI
  // ==================================

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-start px-6 pt-24 pb-10">

      <HeroPosterField />


      {/* Progress */}

      <div className="relative z-10 mb-8 flex flex-col items-center gap-3">

        <span className="text-[10px] uppercase tracking-[0.5em] text-porcelain-dim">
          Progress
        </span>


        <div className="flex items-center">

          {questions.map(
            (q, i) => (

              <div
                key={q.id}
                className="flex items-center"
              >

                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors duration-500",

                    i < index
                      ? "bg-gold"

                      : i === index
                      ? "bg-gold shadow-[0_0_10px_2px_rgba(242,200,121,0.55)]"

                      : "bg-porcelain/20"
                  )}
                />


                {i <
                  questions.length - 1 && (

                  <span
                    className={cn(
                      "h-px w-8 transition-colors duration-500 sm:w-10",

                      i < index
                        ? "bg-gold/50"
                        : "bg-porcelain/12"
                    )}
                  />

                )}

              </div>

            )
          )}

        </div>


        <span className="text-[11px] tracking-[0.3em] text-porcelain-dim">

          {index + 1}
          {" "}
          OF
          {" "}
          {questions.length}

        </span>

      </div>


      {/* Question */}

      <div className="relative z-10 w-full max-w-2xl">

        <AnimatePresence mode="wait">

          <motion.div
            key={question.id}

            initial={{
              opacity: 0,
              y: 30,
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

            className="text-center"
          >

            <h2 className="mb-8 font-display text-3xl leading-tight text-porcelain sm:text-4xl">

              {renderPrompt(
                question.prompt
              )}

            </h2>


            <div className="mx-auto flex max-w-xl flex-col gap-3">

              {question.choices.map(
                (choice, i) => {

                  const isSelected =
                    selected ===
                    choice.id;

                  const isCorrect =
                    choice.id ===
                    question.correctId;

                  const showState =
                    selected !== null;


                  return (
                    <motion.button
                      key={
                        choice.id
                      }

                      onClick={() =>
                        handleSelect(
                          choice.id
                        )
                      }

                      disabled={
                        selected !== null
                      }

                      initial={{
                        opacity: 0,
                        y: 10,
                      }}

                      animate={{
                        opacity: 1,
                        y: 0,
                      }}

                      transition={{
                        duration:
                          0.5,

                        delay:
                          0.15 +
                          i * 0.06,

                        ease: [
                          0.16,
                          1,
                          0.3,
                          1,
                        ],
                      }}

                      whileHover={
                        selected ===
                        null
                          ? {
                              x: 6,
                            }
                          : {}
                      }

                      className={cn(
                        "group flex items-center justify-between rounded-2xl border px-6 py-5 text-left text-base backdrop-blur-sm transition-all duration-300 sm:text-lg",

                        "border-porcelain/12 bg-porcelain/[0.03] text-porcelain/85",

                        selected ===
                          null &&
                          "hover:border-gold/40 hover:bg-porcelain/[0.06] hover:shadow-[0_0_20px_-4px_rgba(242,200,121,0.35)]",

                        showState &&
                          isSelected &&
                          isCorrect &&
                          "border-gold/60 bg-gold/[0.08] text-porcelain shadow-[0_0_24px_-6px_rgba(242,200,121,0.45)]",

                        showState &&
                          isSelected &&
                          !isCorrect &&
                          "border-coral/40 bg-coral/[0.06] text-porcelain",

                        showState &&
                          !isSelected &&
                          "opacity-40"
                      )}
                    >

                      <span>
                        {choice.text}
                      </span>


                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full border border-porcelain/25 transition-colors",

                          "group-hover:border-gold/60",

                          isSelected &&
                            isCorrect &&
                            "border-none bg-gold",

                          isSelected &&
                            !isCorrect &&
                            "border-none bg-coral"
                        )}
                      />

                    </motion.button>
                  );
                }
              )}

            </div>

          </motion.div>

        </AnimatePresence>

      </div>

    </section>
  );
}
