"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { levelTestQuestions } from "@/lib/mockData/levelTest";
import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { cn } from "@/lib/utils";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";

function renderPrompt(prompt: string) {
  const match = prompt.match(/"([^"]+)"/);

  if (!match) return prompt;

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

export function LevelTestScene() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const addLevelAnswer = useExperienceStore((s) => s.addLevelAnswer);
  const goTo = useExperienceStore((s) => s.goTo);

  const question = levelTestQuestions[index];
  const isLast = index === levelTestQuestions.length - 1;

  const difficultyBand =
    index < 3
      ? "BEGINNER · A1–A2"
      : index < 6
      ? "INTERMEDIATE · B1–B2"
      : "ADVANCED · C1";

  const shuffledChoices = useMemo(() => question.choices, [question]);

  const handleSelect = (choiceId: string) => {
    if (selected) return;

    setSelected(choiceId);

    addLevelAnswer({
      questionId: question.id,
      choiceId,
      correct: choiceId === question.correctId,
      difficulty: question.difficulty,
    });

    setTimeout(() => {
      if (isLast) {
        goTo("levelReveal");
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 650);
  };

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-start px-6 pt-24 pb-10">
      {/* same edge poster ring used on the intro screen */}
      <HeroPosterField />

      {/* Cinematic progress */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.5em] text-porcelain-dim">
          Progress
        </span>

        <div className="flex items-center">
          {levelTestQuestions.map((q, i) => (
            <div key={q.id} className="flex items-center">
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

              {i < levelTestQuestions.length - 1 && (
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
          ))}
        </div>

        <span className="text-[11px] tracking-[0.3em] text-porcelain-dim">
          {index + 1} OF {levelTestQuestions.length}
        </span>
      </div>

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
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative text-center"
          >

            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.42em] text-gold/70">
              {difficultyBand}
            </p>

            {/* Optional question context */}
            {question.context && (
              <p
                className="
                  mb-4
                  font-display
                  text-2xl
                  text-gold
                  sm:text-3xl
                "
              >
                {question.context}
              </p>
            )}

            {/* Question */}
            <h2
              className="
                mb-8
                font-display
                text-3xl
                leading-tight
                text-porcelain
                sm:text-4xl
              "
            >
              {renderPrompt(question.prompt)}
            </h2>

            {/* Choices */}
            <div className="mx-auto flex max-w-xl flex-col gap-3">
              {shuffledChoices.map((choice, i) => {
                const isSelected = selected === choice.id;
                const isCorrect = choice.id === question.correctId;
                const showState = selected !== null;

                return (
                  <motion.button
                    key={choice.id}
                    onClick={() => handleSelect(choice.id)}
                    disabled={selected !== null}

                    initial={{
                      opacity: 0,
                      y: 10,
                    }}

                    animate={{
                      opacity: 1,
                      y: 0,
                    }}

                    transition={{
                      duration: 0.5,
                      delay: 0.15 + i * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}

                    whileHover={
                      selected === null
                        ? { scale: 1.01 }
                        : {}
                    }

                    className={cn(
                      `
                      group
                      relative
                      isolate
                      flex
                      w-full
                      overflow-hidden
                      items-center
                      justify-between
                      rounded-2xl
                      border
                      px-6
                      py-5
                      text-left
                      text-base
                      transition-all
                      duration-300
                      sm:text-lg
                      `,

                      `
                      border-porcelain/12
                      bg-porcelain/[0.03]
                      text-porcelain/85
                      `,

                      selected === null &&
                        `
                        hover:border-gold/40
                        hover:bg-porcelain/[0.06]
                        hover:shadow-[0_0_20px_-4px_rgba(242,200,121,0.35)]
                        `,

                      showState &&
                        isSelected &&
                        isCorrect &&
                        `
                        border-gold/60
                        bg-gold/[0.08]
                        text-porcelain
                        shadow-[0_0_24px_-6px_rgba(242,200,121,0.45)]
                        `,

                      showState &&
                        isSelected &&
                        !isCorrect &&
                        `
                        border-coral/40
                        bg-coral/[0.06]
                        text-porcelain
                        `,

                      showState &&
                        !isSelected &&
                        "opacity-40"
                    )}
                  >
                    <span>{choice.text}</span>

                    {/* Selection indicator */}
                    <span
                      className={cn(
                        `
                        h-2
                        w-2
                        shrink-0
                        rounded-full
                        border
                        border-porcelain/25
                        transition-colors
                        `,

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
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
