import {
  AreaBreakdown,
  Cefr,
  Level,
  LevelTestAnswer,
  LevelTestArea,
} from "@/lib/types";

/** Reading has the most items, so it carries the most weight. */
const AREA_WEIGHTS: Record<LevelTestArea, number> = {
  reading: 0.4,
  listening: 0.25,
  writing: 0.15,
  speaking: 0.2,
};

const AREAS: LevelTestArea[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

export const areaLabel: Record<LevelTestArea, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

function levelFromScore(score: number): Level {
  if (score >= 80) return "advanced";
  if (score >= 50) return "intermediate";
  return "beginner";
}

/**
 * CEFR label for a single area.
 *
 * Five bands rather than three, because "intermediate" covers
 * an enormous range and a learner who scores 52 and one who
 * scores 78 need very different films.
 */
export function cefrFromScore(score: number): Cefr {
  if (score >= 85) return "C1";
  if (score >= 68) return "B2";
  if (score >= 48) return "B1";
  if (score >= 25) return "A2";
  return "A1";
}

export const cefrCopy: Record<Cefr, string> = {
  A1: "Can follow single words and very simple lines.",
  A2: "Can follow slow, clear speech about familiar things.",
  B1: "Can follow everyday conversation at normal speed.",
  B2: "Can follow fast dialogue and catch most implied meaning.",
  C1: "Can follow irony, subtext, and heavy accents without help.",
};

/**
 * Score for one area, 0-100.
 *
 * Answers carry an explicit `score` for the graded writing and
 * speaking questions. Multiple choice answers fall back to their
 * correct flag, weighted by difficulty so that clearing a C1
 * question counts for more than clearing an A1 one.
 */
function scoreArea(answers: LevelTestAnswer[]): number {
  if (answers.length === 0) return 0;

  const totalWeight = answers.reduce(
    (sum, answer) => sum + answer.difficulty,
    0
  );

  if (totalWeight === 0) return 0;

  const earned = answers.reduce((sum, answer) => {
    const value =
      typeof answer.score === "number"
        ? answer.score
        : answer.correct
        ? 100
        : 0;

    return sum + (value / 100) * answer.difficulty;
  }, 0);

  return Math.round((earned / totalWeight) * 100);
}

export function buildAreaBreakdown(
  answers: LevelTestAnswer[]
): AreaBreakdown[] {
  return AREAS.map((area) => {
    const inArea = answers.filter(
      (answer) => (answer.area ?? "reading") === area
    );

    const score = scoreArea(inArea);

    return {
      area,
      score,
      level: levelFromScore(score),
      cefr: cefrFromScore(score),
      attempted: inArea.length > 0,
    };
  });
}

/**
 * Overall placement.
 *
 * Reading carries the most weight because it has the most
 * questions, but a learner who reads well and cannot speak or
 * listen no longer lands on "advanced" the way they used to.
 */
export function overallScore(answers: LevelTestAnswer[]): number {
  const breakdown = buildAreaBreakdown(answers).filter(
    (entry) => entry.attempted
  );

  if (breakdown.length === 0) return 0;

  const totalWeight = breakdown.reduce(
    (sum, entry) => sum + AREA_WEIGHTS[entry.area],
    0
  );

  return Math.round(
    breakdown.reduce(
      (sum, entry) => sum + entry.score * AREA_WEIGHTS[entry.area],
      0
    ) / totalWeight
  );
}

export function overallCefr(answers: LevelTestAnswer[]): Cefr {
  const breakdown = buildAreaBreakdown(answers).filter(
    (entry) => entry.attempted
  );

  const overall = overallScore(answers);

  if (breakdown.length === 0) return "A1";

  // One very weak area holds the label back a band, so a learner
  // who reads well but cannot speak is not sold a C1 badge.
  const weakest = Math.min(
    ...breakdown.map((entry) => entry.score)
  );

  const raw = cefrFromScore(overall);

  const order: Cefr[] = ["A1", "A2", "B1", "B2", "C1"];

  const rawIndex = order.indexOf(raw);

  const capped =
    weakest < 25
      ? Math.max(0, rawIndex - 1)
      : rawIndex;

  return order[capped];
}

export async function estimateLevel(
  answers: LevelTestAnswer[]
): Promise<Level> {
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const breakdown = buildAreaBreakdown(answers).filter(
    (entry) => entry.attempted
  );

  if (breakdown.length === 0) return "beginner";

  const weights = AREA_WEIGHTS;

  const totalWeight = breakdown.reduce(
    (sum, entry) => sum + weights[entry.area],
    0
  );

  const overall =
    breakdown.reduce(
      (sum, entry) => sum + entry.score * weights[entry.area],
      0
    ) / totalWeight;

  // A single very weak area holds the learner back one band, so
  // the placement reflects the skill they will actually struggle
  // with in a film.
  const weakest = Math.min(
    ...breakdown.map((entry) => entry.score)
  );

  if (overall >= 80 && weakest >= 50) return "advanced";
  if (overall >= 50 && weakest >= 25) return "intermediate";

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
