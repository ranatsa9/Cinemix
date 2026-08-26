import { create } from "zustand";

import {
  GenreId,
  Goal,
  Level,
  LevelTestAnswer,
  QuizResult,
  RecommendationResult,
  SceneId,
  SpeakingAnalysisResult,
} from "@/lib/types";

import type {
  AdaptiveUpdateResponse,
} from "@/lib/api";


interface ExperienceState {
  history: SceneId[];
  scene: SceneId;

  levelAnswers: LevelTestAnswer[];
  level: Level | null;

  goal: Goal | null;
  genreIds: GenreId[];
  selectedMovieIds: string[];

  recommendation: RecommendationResult | null;

  speakingResult:
    SpeakingAnalysisResult | null;

  quizResult:
    QuizResult | null;

  adaptiveResult:
    AdaptiveUpdateResponse | null;

  recordingSeconds: number;


  goTo: (
    scene: SceneId
  ) => void;

  back: () => void;

  canGoBack: () => boolean;


  addLevelAnswer: (
    answer: LevelTestAnswer
  ) => void;

  setLevel: (
    level: Level
  ) => void;

  setGoal: (
    goal: Goal
  ) => void;

  toggleGenre: (
    genre: GenreId
  ) => void;

  toggleMovie: (
    movieId: string
  ) => void;

  setRecommendation: (
    rec: RecommendationResult
  ) => void;

  setSpeakingResult: (
    result: SpeakingAnalysisResult
  ) => void;

  setQuizResult: (
    result: QuizResult
  ) => void;

  setAdaptiveResult: (
    result: AdaptiveUpdateResponse
  ) => void;

  setRecordingSeconds: (
    seconds: number
  ) => void;

  restart: () => void;

  findNextMovie: () => void;
}


const initial = {
  history: [
    "intro",
  ] as SceneId[],

  scene:
    "intro" as SceneId,

  levelAnswers:
    [] as LevelTestAnswer[],

  level:
    null as Level | null,

  goal:
    null as Goal | null,

  genreIds:
    [] as GenreId[],

  selectedMovieIds:
    [] as string[],

  recommendation:
    null as RecommendationResult | null,

  speakingResult:
    null as SpeakingAnalysisResult | null,

  quizResult:
    null as QuizResult | null,

  adaptiveResult:
    null as AdaptiveUpdateResponse | null,

  recordingSeconds:
    0,
};


export const useExperienceStore =
  create<ExperienceState>(
    (set, get) => ({
      ...initial,


      // =========================
      // Navigation
      // =========================

      goTo: (
        scene
      ) =>
        set(
          (state) => ({
            scene,

            history: [
              ...state.history,
              scene,
            ],
          })
        ),


      back: () =>
        set(
          (state) => {
            if (
              state.history.length <= 1
            ) {
              return state;
            }

            const nextHistory =
              state.history.slice(
                0,
                -1
              );

            return {
              history:
                nextHistory,

              scene:
                nextHistory[
                  nextHistory.length - 1
                ],
            };
          }
        ),


      canGoBack: () =>
        get().history.length > 1,


      // =========================
      // Level
      // =========================

      addLevelAnswer: (
        answer
      ) =>
        set(
          (state) => ({
            levelAnswers: [
              ...state.levelAnswers,
              answer,
            ],
          })
        ),


      setLevel: (
        level
      ) =>
        set({
          level,
        }),


      // =========================
      // Goal
      // =========================

      setGoal: (
        goal
      ) =>
        set({
          goal,
        }),


      // =========================
      // Genres
      // =========================

      toggleGenre: (
        genre
      ) =>
        set(
          (state) => ({
            genreIds:
              state.genreIds.includes(
                genre
              )
                ? state.genreIds.filter(
                    (g) =>
                      g !== genre
                  )
                : [
                    ...state.genreIds,
                    genre,
                  ],
          })
        ),


      // =========================
      // Favorite movies
      // =========================

      toggleMovie: (
        movieId
      ) =>
        set(
          (state) => {
            if (
              state.selectedMovieIds.includes(
                movieId
              )
            ) {
              return {
                selectedMovieIds:
                  state.selectedMovieIds.filter(
                    (id) =>
                      id !== movieId
                  ),
              };
            }

            if (
              state.selectedMovieIds.length >= 3
            ) {
              return state;
            }

            return {
              selectedMovieIds: [
                ...state.selectedMovieIds,
                movieId,
              ],
            };
          }
        ),


      // =========================
      // Recommendation
      // =========================

      setRecommendation: (
        recommendation
      ) =>
        set({
          recommendation,
        }),


      // =========================
      // Speaking
      // =========================

      setSpeakingResult: (
        speakingResult
      ) =>
        set({
          speakingResult,
        }),


      // =========================
      // Quiz
      // =========================

      setQuizResult: (
        quizResult
      ) =>
        set({
          quizResult,
        }),


      // =========================
      // Adaptive Learning
      // =========================

      setAdaptiveResult: (
        adaptiveResult
      ) =>
        set({
          adaptiveResult,
        }),


      // =========================
      // Recording
      // =========================

      setRecordingSeconds: (
        recordingSeconds
      ) =>
        set({
          recordingSeconds,
        }),


      // =========================
      // Restart
      // =========================

      restart: () =>
        set({
          ...initial,

          history: [
            "intro",
          ],

          scene:
            "intro",
        }),


      // =========================
      // Next movie
      // =========================

      findNextMovie: () =>
        set(
          (state) => ({
            selectedMovieIds:
              [],

            recommendation:
              null,

            speakingResult:
              null,

            quizResult:
              null,

            adaptiveResult:
              null,

            recordingSeconds:
              0,

            scene:
              "tasteGenre",

            history: [
              ...state.history,
              "tasteGenre",
            ],
          })
        ),
    })
  );