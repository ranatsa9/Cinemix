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

  const totalCorrect = answers.filter((answer) => answer.correct).length;
  const advancedAnswers = answers.filter((answer) => answer.difficulty === 5);
  const intermediateAnswers = answers.filter((answer) => answer.difficulty === 3);
  const correctIn = (group: LevelTestAnswer[]) =>
    group.filter((answer) => answer.correct).length;

  if (totalCorrect >= 8 && correctIn(advancedAnswers) >= 2) {
    return "advanced";
  }
  if (
    totalCorrect >= 5 &&
    correctIn([...intermediateAnswers, ...advancedAnswers]) >= 2
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
