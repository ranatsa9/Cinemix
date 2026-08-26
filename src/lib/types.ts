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

export type LevelTestSkill = "vocabulary" | "comprehension" | "conversational";

export interface LevelTestQuestion {
  id: string;
  context?: string;
  prompt: string;
  choices: { id: string; text: string }[];
  correctId: string;
  /** 1 = easiest, 5 = hardest. Used to weight the estimated level. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** vocab/grammar, dialogue/reading, or conversational-response question. */
  skill: LevelTestSkill;
}


export interface LevelTestAnswer {
  questionId: string;
  choiceId: string;
  correct: boolean;
  difficulty: number;
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
