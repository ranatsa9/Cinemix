import { SceneId } from "@/lib/types";

export interface ChapterTheme {
  /** primary glow color, top-left */
  a: string;

  /** secondary glow color, bottom-right */
  b: string;

  /** accent used for small UI details / focus glints */
  accent: string;
}

const violet = "#8b6bff";
const violetDeep = "#5b3df0";
const lavender = "#c3b5ff";
const coral = "#ff6f61";
const amber = "#ffb648";
const gold = "#f2c879";
const pink = "#ff7ec4";
const cyan = "#5fe3ff";

export const chapterThemes: Record<SceneId, ChapterTheme> = {
  intro: {
    a: violetDeep,
    b: "#141a3d",
    accent: violet,
  },

  levelTest: {
    a: "#1c2454",
    b: lavender,
    accent: lavender,
  },

  levelReveal: {
    a: violet,
    b: gold,
    accent: gold,
  },

  goal: {
    a: violet,
    b: cyan,
    accent: cyan,
  },

  tasteGenre: {
    a: coral,
    b: violet,
    accent: pink,
  },

  tasteMovies: {
    a: coral,
    b: pink,
    accent: gold,
  },

  analysis: {
    a: violet,
    b: "#2f4bff",
    accent: cyan,
  },

  match: {
    a: amber,
    b: violet,
    accent: gold,
  },

  beforeWatch: {
    a: amber,
    b: violetDeep,
    accent: gold,
  },

  // Where to watch / Movie Night
  watchOptions: {
    a: amber,
    b: violetDeep,
    accent: gold,
  },

  afterMovie: {
    a: "#1c2454",
    b: cyan,
    accent: pink,
  },

  quiz: {
    a: "#1c2454",
    b: violet,
    accent: cyan,
  },

  speaking: {
    a: "#1c2454",
    b: pink,
    accent: cyan,
  },

  speakingAnalyzing: {
    a: violet,
    b: cyan,
    accent: pink,
  },

  result: {
    a: gold,
    b: violet,
    accent: amber,
  },
};