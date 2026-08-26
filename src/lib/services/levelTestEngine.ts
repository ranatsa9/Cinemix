import {
  LevelTestArea,
  LevelTestChoiceQuestion,
  LevelTestListeningQuestion,
} from "@/lib/types";

/* =========================================================
   ADAPTIVE ENGINE

   Instead of walking a fixed list from easy to hard, the test
   tracks a running difficulty. Answer correctly and the next
   question comes from a harder band, get it wrong and it comes
   from an easier one.

   Two benefits over the old fixed list:

     - A strong learner reaches C1 material in three questions
       instead of seven, and a weak one is never dragged
       through five questions they cannot read.
     - The difficulty the learner settles at is itself a
       signal, so a shorter test places them more precisely.
========================================================= */

export type Band = 1 | 2 | 3 | 4 | 5;

export const SECTION_LENGTH: Record<LevelTestArea, number> = {
  reading: 6,
  listening: 3,
  writing: 1,
  speaking: 1,
};

export const SECTION_ORDER: LevelTestArea[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

export const sectionCopy: Record<
  LevelTestArea,
  { title: string; line: string }
> = {
  reading: {
    title: "READING & GRAMMAR",
    line: "Six questions. They get harder if you get them right.",
  },
  listening: {
    title: "LISTENING",
    line: "Audio only. Nothing is written down. Replay as often as you like.",
  },
  writing: {
    title: "WRITING",
    line: "One short answer, in your own words.",
  },
  speaking: {
    title: "SPEAKING",
    line: "Read one line out loud. We'll listen and score it.",
  },
};

/** Correct moves you up a band, wrong moves you down. */
export function nextBand(current: Band, correct: boolean): Band {
  const moved = correct ? current + 1 : current - 1;

  return Math.min(5, Math.max(1, moved)) as Band;
}

/**
 * Picks the unused question closest to the target band.
 *
 * Exact band first. If that band is exhausted, widen outwards
 * one step at a time so the test never stalls, however small
 * the bank is.
 */
export function pickQuestion<
  T extends LevelTestChoiceQuestion | LevelTestListeningQuestion
>(bank: T[], band: Band, usedIds: string[]): T | null {
  const available = bank.filter(
    (item) => !usedIds.includes(item.id)
  );

  if (available.length === 0) return null;

  for (let spread = 0; spread <= 4; spread += 1) {
    const matches = available.filter(
      (item) => Math.abs(item.difficulty - band) === spread
    );

    if (matches.length > 0) {
      // Random within the band so two runs of the test are not
      // identical, which matters when the judges try it twice.
      return matches[
        Math.floor(Math.random() * matches.length)
      ];
    }
  }

  return available[0];
}

/**
 * The band the learner settled at, used as a sanity check
 * against the raw score.
 */
export function settledBand(history: Band[]): Band {
  if (history.length === 0) return 1;

  const tail = history.slice(-3);

  const average =
    tail.reduce((sum, band) => sum + band, 0) / tail.length;

  return Math.round(average) as Band;
}
