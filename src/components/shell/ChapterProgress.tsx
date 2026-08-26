"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { SceneId } from "@/lib/types";
import { useExperienceStore } from "@/lib/store/useExperienceStore";

const CHAPTER_WEIGHT: Record<SceneId, number> = {
  intro: 0,
  levelTest: 1,
  levelReveal: 2,
  goal: 3,
  tasteGenre: 4,
  tasteMovies: 4.5,
  analysis: 5,
  match: 6,
  beforeWatch: 7,
  watchOptions: 7.5,
  afterMovie: 8,
  quiz: 8.5,
  speaking: 8.5,
  speakingAnalyzing: 9,
  result: 10,
};

const TOTAL = 10;

export function ChapterProgress({ scene }: { scene: SceneId }) {
  const back = useExperienceStore((s) => s.back);
  const canGoBack = useExperienceStore((s) => s.canGoBack());
  const restart = useExperienceStore((s) => s.restart);

  const progress = Math.min(1, CHAPTER_WEIGHT[scene] / TOTAL);
  const showChrome = scene !== "intro";

  return (
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div className="h-[2px] w-full bg-porcelain/10">
        <motion.div
          className="h-full bg-gradient-to-r from-coral via-gold to-violet"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="cinemix-mini-wordmark pointer-events-auto select-none text-sm font-semibold tracking-[0.2em]">
          CINEMIX
        </span>

        {showChrome && (
          <div className="pointer-events-auto flex items-center gap-2">
            {canGoBack && (
              <button
                onClick={back}
                aria-label="Go back"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-porcelain/15 text-porcelain/70 transition hover:border-porcelain/40 hover:text-porcelain"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              onClick={restart}
              aria-label="Restart experience"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-porcelain/15 text-porcelain/70 transition hover:border-porcelain/40 hover:text-porcelain"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
