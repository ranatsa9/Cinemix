import { Level, LevelTestAnswer } from "@/lib/types";

/**
 * Mock implementation of the level estimate. A real backend will
 * eventually replace this with something like POST /api/assess-level,
 * fed the same LevelTestAnswer[] shape.
 */
export async function estimateLevel(
  answers: LevelTestAnswer[]
): Promise<Level> {
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const weighted = answers.reduce((sum, a) => {
    if (!a.correct) return sum;
    return sum + a.difficulty;
  }, 0);

  const maxPossible = answers.reduce((sum, a) => sum + a.difficulty, 0);
  const ratio = maxPossible === 0 ? 0 : weighted / maxPossible;

  const advancedAnswers = answers.filter((answer) => answer.difficulty === 5);
  const foundationAnswers = answers.filter((answer) => answer.difficulty <= 2);
  const correctIn = (group: LevelTestAnswer[]) =>
    group.filter((answer) => answer.correct).length;

  // Easy points alone cannot produce an Advanced result.
  if (
    ratio >= 0.68 &&
    correctIn(advancedAnswers) >= 2
  ) {
    return "advanced";
  }

  const beyondFoundation = answers.filter(
    (answer) => answer.difficulty >= 3
  );

  if (
    ratio >= 0.3 &&
    correctIn(foundationAnswers) >= 2 &&
    correctIn(beyondFoundation) >= 2
  ) {
    return "intermediate";
  }

  return "beginner";
}

export const levelCopy: Record<
  Level,
  { headline: string; description: string }
> = {
  beginner: {
    headline: "BEGINNER",
    description:
      "You catch the basics, but natural speech still moves fast. We'll ease you in.",
  },
  intermediate: {
    headline: "INTERMEDIATE",
    description:
      "You understand everyday English and natural conversations. Now let's find the right challenge for you.",
  },
  advanced: {
    headline: "ADVANCED · C1",
    description:
      "You handle complex structures, implied meaning, irony, and nuanced dialogue. Time for films that genuinely stretch you.",
  },
};
