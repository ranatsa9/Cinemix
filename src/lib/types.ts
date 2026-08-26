export type Level = "beginner" | "intermediate" | "advanced";

export type Goal = "listening" | "speaking" | "vocabulary" | "comprehension";

export type GenreId =
  | "comedy"
  | "romance"
  | "drama"
  | "thriller"
  | "action"
  | "scifi"
  | "animation"
  | "mystery";

export interface Genre {
  id: GenreId;
  label: string;
}

export type LevelTestSkill =
  | "vocabulary"
  | "comprehension"
  | "conversational"
  | "listening"
  | "writing"
  | "speaking";

/** The four areas the placement test reports on. */
export type LevelTestArea =
  | "reading"
  | "listening"
  | "writing"
  | "speaking";

export const SKILL_AREA: Record<LevelTestSkill, LevelTestArea> = {
  vocabulary: "reading",
  comprehension: "reading",
  conversational: "reading",
  listening: "listening",
  writing: "writing",
  speaking: "speaking",
};

interface LevelTestQuestionBase {
  id: string;
  context?: string;
  prompt: string;
  /** 1 = easiest, 5 = hardest. Used to weight the estimated level. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  skill: LevelTestSkill;
}

/** Reading and grammar. The original nine questions. */
export interface LevelTestChoiceQuestion extends LevelTestQuestionBase {
  kind?: "choice";
  choices: { id: string; text: string }[];
  correctId: string;
}

/**
 * Listening. The learner hears `audioText` and never sees it.
 * `clipId` points at a real movie clip; when it is missing or the
 * clip fails to load the app speaks the line instead.
 */
export interface LevelTestListeningQuestion extends LevelTestQuestionBase {
  kind: "listening";
  audioText: string;
  clipId?: string;
  choices: { id: string; text: string }[];
  correctId: string;
}

/** Writing. Free text, scored on length, coverage, and mechanics. */
export interface LevelTestWritingQuestion extends LevelTestQuestionBase {
  kind: "writing";
  minWords: number;
  /** Any of these appearing in the answer counts as on-topic. */
  keywords: string[];
}

/** Speaking. The learner reads `targetText` aloud and is transcribed. */
export interface LevelTestSpeakingQuestion extends LevelTestQuestionBase {
  kind: "speaking";
  targetText: string;
  clipId?: string;
}

export type LevelTestQuestion =
  | LevelTestChoiceQuestion
  | LevelTestListeningQuestion
  | LevelTestWritingQuestion
  | LevelTestSpeakingQuestion;


export interface LevelTestAnswer {
  questionId: string;
  choiceId: string;
  correct: boolean;
  difficulty: number;
  /** Which area this answer counts towards. Defaults to reading. */
  area?: LevelTestArea;
  /** 0-100. Binary questions record 100 or 0. */
  score?: number;
  /** What the learner actually wrote or said, for the reveal screen. */
  response?: string;
}

/** Display label only. The pipeline keeps using `Level`. */
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1";

export interface AreaBreakdown {
  area: LevelTestArea;
  score: number;
  level: Level;
  cefr: Cefr;
  /** False when the learner skipped every question in the area. */
  attempted: boolean;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  genres: GenreId[];
  levelFit: Level[];
  dialogueComplexity: 1 | 2 | 3 | 4 | 5;
  pace: 1 | 2 | 3 | 4 | 5;
  /** local poster asset path, e.g. /movies/the-intern.jpg */
  posterUrl: string;
  /** environmental/backdrop image; falls back to posterUrl when absent */
  backdropUrl?: string;
  /** two hex colors sampled from the poster art, used for ambient glow/lighting */
  palette: [string, string];
  logline: string;
  runtime: number;
}

export interface MatchTrait {
  label: string;
}

export interface RecommendationResult {
  movie: Movie;
  matchPercent: number;
  traits: MatchTrait[];
  reason: string;
}

export interface VocabItem {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: { id: string; text: string }[];
  correctId: string;
}

export interface SpeakingPrompt {
  id: string;
  prompt: string;
}

export interface QuizResult {
  correct: number;
  total: number;
}

export interface SpeakingAnalysisResult {
  overall: number;
  pronunciation: number;
  fluency: number;
  pace: number;
  relevance: number;
  feedback: string[];
}

export type SceneId =
  | "intro"
  | "levelTest"
  | "levelReveal"
  | "goal"
  | "tasteGenre"
  | "tasteMovies"
  | "analysis"
  | "match"
  | "beforeWatch"
  | "watchOptions"
  | "afterMovie"
  | "quiz"
  | "speaking"
  | "speakingAnalyzing"
  | "result";

export interface ChapterTheme {
  key: string;
  from: string;
  to: string;
  glow: string;
}
