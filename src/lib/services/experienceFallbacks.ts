import type { Level } from "@/lib/types";

const LEVEL_RANK: Record<Level, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export function normalizeLevel(value: unknown): Level {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("advanced")) return "advanced";
  if (text.includes("beginner")) return "beginner";
  return "intermediate";
}

export function strongerLevel(a: Level, b: Level): Level {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

export function displayLevel(level: Level) {
  return level[0].toUpperCase() + level.slice(1);
}

export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function englishReason(
  reason: unknown,
  level: Level,
  genre?: string
) {
  const text = String(reason ?? "").trim();
  if (text && !/[\u0600-\u06ff]/.test(text)) return text;
  const genreText = genre ? ` and your interest in ${genre}` : "";
  return `A strong match for your ${displayLevel(level)} English level${genreText}, with useful dialogue and strong learning value.`;
}

const MEANINGS: Record<string, string> = {
  monsieur: "a French title meaning ‘sir’ or ‘mister’",
  nevertheless: "despite what was just mentioned",
  reluctant: "unwilling or hesitant to do something",
  compelling: "very interesting or convincing",
  ambiguous: "open to more than one meaning",
  inevitably: "in a way that cannot be avoided",
  bewildered: "completely confused",
  subtle: "not obvious; delicate or understated",
};

export function vocabularyMeaning(word: string) {
  return MEANINGS[word.trim().toLowerCase()] ??
    "a useful word or expression from the movie";
}

const POSTERS = [
  "/movies/inception.jpg",
  "/movies/knives-out.jpeg",
  "/movies/arrival.jpg",
  "/movies/coco.jpg",
  "/movies/zootopia.jpg",
  "/movies/paddington-2.jpg",
  "/movies/the-intern.jpg",
  "/movies/crazy-rich-asians.png",
  "/movies/spider-verse.png",
];

export function fallbackPoster(id: unknown, index = 0) {
  const numeric = Number(id);
  const seed = Number.isFinite(numeric) ? Math.abs(numeric) : index;
  return POSTERS[(seed + index) % POSTERS.length];
}
