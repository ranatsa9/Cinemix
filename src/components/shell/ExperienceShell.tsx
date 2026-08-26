"use client";

import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { CinematicBackground } from "@/components/shell/CinematicBackground";
import { ChapterProgress } from "@/components/shell/ChapterProgress";
import { SceneTransition } from "@/components/shell/SceneTransition";

import { IntroScene } from "@/components/scenes/IntroScene";
import { LevelTestScene } from "@/components/scenes/LevelTestScene";
import { LevelRevealScene } from "@/components/scenes/LevelRevealScene";
import { GoalScene } from "@/components/scenes/GoalScene";
import { TasteGenreScene } from "@/components/scenes/TasteGenreScene";
import { TasteMoviesScene } from "@/components/scenes/TasteMoviesScene";
import { AnalysisScene } from "@/components/scenes/AnalysisScene";
import { MatchScene } from "@/components/scenes/MatchScene";
import { BeforeWatchScene } from "@/components/scenes/BeforeWatchScene";
import { AfterMovieScene } from "@/components/scenes/AfterMovieScene";
import { QuizScene } from "@/components/scenes/QuizScene";
import { SpeakingScene } from "@/components/scenes/SpeakingScene";
import { SpeakingAnalyzingScene } from "@/components/scenes/SpeakingAnalyzingScene";
import { ResultScene } from "@/components/scenes/ResultScene";
import { WatchOptionsScene } from "@/components/scenes/WatchOptionsScene";

import { SceneId } from "@/lib/types";

const SCENES: Record<SceneId, React.ComponentType> = {
  intro: IntroScene,
  levelTest: LevelTestScene,
  levelReveal: LevelRevealScene,
  goal: GoalScene,
  tasteGenre: TasteGenreScene,
  tasteMovies: TasteMoviesScene,
  analysis: AnalysisScene,
  match: MatchScene,
  beforeWatch: BeforeWatchScene,
  afterMovie: AfterMovieScene,
  quiz: QuizScene,
  speaking: SpeakingScene,
  speakingAnalyzing: SpeakingAnalyzingScene,
  result: ResultScene,
  watchOptions: WatchOptionsScene,
};

export function ExperienceShell() {
  const scene = useExperienceStore((s) => s.scene);

  const Scene = SCENES[scene];

  return (
    <main className="relative min-h-screen w-full">
      <CinematicBackground scene={scene} />

      <div className="grain-overlay" />
      <div className="vignette" />

      <ChapterProgress scene={scene} />

      <SceneTransition sceneKey={scene}>
        <Scene />
      </SceneTransition>
    </main>
  );
}