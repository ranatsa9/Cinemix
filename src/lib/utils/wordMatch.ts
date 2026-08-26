/* =========================================================
   WORD MATCHING

   Shared by the speaking practice scene and by the speaking
   question in the placement test.

   Line mode stays strict: every expected word has to appear.

   Word mode is deliberately tolerant. A learner practising a
   single word records well under a second of audio, and any
   recognizer will regularly return "practise", "practice.",
   "the practice" or "practiced" for the same take. Scoring
   those as zero is what made single-word practice look broken.
========================================================= */

export type WordMatchResult = {
  score: number;
  matched: string[];
  missing: string[];
  extra: string[];
  /** Word mode only. True when the take was accepted as close enough. */
  approximate?: boolean;
};

export function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}']/gu, "")
    .trim();
}

/**
 * Strips the endings that carry no pronunciation weight for a
 * beginner, so "practised" and "practise" collapse together.
 */
function stem(word: string) {
  return word
    .replace(/(ing|ed|es|s)$/u, "")
    .replace(/e$/u, "");
}

/** Classic Levenshtein distance. Small inputs, so the simple table is fine. */
function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from(
    { length: b.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    previous = current;
  }

  return previous[b.length];
}

/** 1 = identical, 0 = nothing in common. */
export function similarity(a: string, b: string) {
  const longest = Math.max(a.length, b.length);

  if (longest === 0) return 1;

  return 1 - editDistance(a, b) / longest;
}

/**
 * True when a spoken token is close enough to the target to
 * count as the same word.
 */
function isCloseEnough(target: string, spoken: string) {
  if (!target || !spoken) return false;

  if (target === spoken) return true;

  if (stem(target) === stem(spoken)) return true;

  // "practice" heard inside "practicing" and the reverse.
  if (
    target.length >= 4 &&
    (spoken.includes(target) || target.includes(spoken))
  ) {
    return true;
  }

  const threshold = target.length <= 4 ? 0.75 : 0.8;

  return similarity(target, spoken) >= threshold;
}

/**
 * Words this short are unreliable on their own in any automatic
 * transcription, so the UI should not offer them for isolated
 * practice.
 */
export function canPractiseAsSingleWord(word: string) {
  return normalizeWord(word).length >= 3;
}

export function calculateWordMatch(
  expectedText: string,
  spokenText: string,
  mode: "line" | "word" = "line"
): WordMatchResult {
  const expectedWords = expectedText
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  const spokenWords = spokenText
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  /* -------------------------------------------------------
     WORD MODE
  ------------------------------------------------------- */

  if (mode === "word") {
    const target = expectedWords[0] ?? "";

    if (!target) {
      return { score: 0, matched: [], missing: [], extra: spokenWords };
    }

    const exactHit = spokenWords.some(
      (spoken) => spoken === target
    );

    const closeHit =
      exactHit ||
      spokenWords.some((spoken) => isCloseEnough(target, spoken));

    if (closeHit) {
      return {
        score: 100,
        matched: [target],
        missing: [],
        extra: spokenWords.filter(
          (spoken) => !isCloseEnough(target, spoken)
        ),
        approximate: !exactHit,
      };
    }

    // Partial credit so the learner sees movement instead of a
    // flat zero on every retry.
    const best = spokenWords.reduce(
      (highest, spoken) =>
        Math.max(highest, similarity(target, spoken)),
      0
    );

    return {
      score: Math.round(best * 100),
      matched: [],
      missing: [target],
      extra: spokenWords,
      approximate: false,
    };
  }

  /* -------------------------------------------------------
     LINE MODE
  ------------------------------------------------------- */

  const remainingSpoken = [...spokenWords];

  const matched: string[] = [];
  const missing: string[] = [];

  for (const expectedWord of expectedWords) {
    let index = remainingSpoken.indexOf(expectedWord);

    if (index === -1) {
      index = remainingSpoken.findIndex((spoken) =>
        isCloseEnough(expectedWord, spoken)
      );
    }

    if (index !== -1) {
      matched.push(expectedWord);
      remainingSpoken.splice(index, 1);
    } else {
      missing.push(expectedWord);
    }
  }

  const score =
    expectedWords.length > 0
      ? Math.round((matched.length / expectedWords.length) * 100)
      : 0;

  return {
    score,
    matched,
    missing,
    extra: remainingSpoken,
  };
}
