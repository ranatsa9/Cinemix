"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  listeningBank,
  readingBank,
  speakingBank,
  writingBank,
} from "@/lib/mockData/levelTest";

import {
  Band,
  SECTION_LENGTH,
  SECTION_ORDER,
  nextBand,
  pickQuestion,
  sectionCopy,
} from "@/lib/services/levelTestEngine";

import { useExperienceStore } from "@/lib/store/useExperienceStore";
import { cn } from "@/lib/utils";
import { HeroPosterField } from "@/components/scenes/HeroPosterField";

import {
  SKILL_AREA,
  type LevelTestArea,
  type LevelTestChoiceQuestion,
  type LevelTestListeningQuestion,
  type LevelTestQuestion,
} from "@/lib/types";

import { playLine, type PlaybackHandle } from "@/lib/audio/playLine";
import { transcribeAudio } from "@/lib/api";
import { calculateWordMatch } from "@/lib/utils/wordMatch";

/* =========================================================
   HELPERS
========================================================= */

function renderPrompt(prompt: string) {
  const match = prompt.match(/"([^"]+)"/);

  if (!match) return prompt;

  const [full, word] = match;
  const [before, after] = prompt.split(full);

  return (
    <>
      {before}
      <span className="text-gold">&ldquo;{word}&rdquo;</span>
      {after}
    </>
  );
}

const BAND_LABEL: Record<Band, string> = {
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B2",
  5: "C1",
};

/**
 * Scores a short written answer in the browser.
 *
 * Three equal thirds: is it long enough, is it on topic, and is
 * it punctuated like a sentence. Deliberately generous, because
 * this places a learner rather than grading an essay.
 */
function scoreWriting(
  text: string,
  minWords: number,
  keywords: string[]
) {
  const trimmed = text.trim();

  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/).filter(Boolean);

  const lengthScore = Math.min(1, words.length / minWords);

  const lower = trimmed.toLowerCase();

  const hits = keywords.filter((keyword) =>
    lower.includes(keyword.toLowerCase())
  ).length;

  const topicScore = Math.min(1, hits / 2);

  const startsCapital = /^[A-Z]/.test(trimmed);
  const endsPunctuated = /[.!?]$/.test(trimmed);

  const mechanicsScore =
    (startsCapital ? 0.5 : 0) + (endsPunctuated ? 0.5 : 0);

  return Math.round(
    ((lengthScore + topicScore + mechanicsScore) / 3) * 100
  );
}

const TOTAL_QUESTIONS = SECTION_ORDER.reduce(
  (sum, area) => sum + SECTION_LENGTH[area],
  0
);

/* =========================================================
   SCENE
========================================================= */

type Phase = "section-intro" | "question";

export function LevelTestScene() {
  const addLevelAnswer = useExperienceStore((s) => s.addLevelAnswer);
  const goTo = useExperienceStore((s) => s.goTo);

  /* -------------------------------------------------------
     FLOW STATE
  ------------------------------------------------------- */

  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionInSection, setQuestionInSection] = useState(0);
  const [answeredTotal, setAnsweredTotal] = useState(0);
  const [phase, setPhase] = useState<Phase>("section-intro");

  const area: LevelTestArea = SECTION_ORDER[sectionIndex];

  /* -------------------------------------------------------
     ADAPTIVE STATE

     One band per adaptive section. Listening starts a notch
     lower than reading because audio is harder cold.
  ------------------------------------------------------- */

  const [readingBand, setReadingBand] = useState<Band>(3);
  const [listeningBand, setListeningBand] = useState<Band>(2);
  const [usedIds, setUsedIds] = useState<string[]>([]);

  const [current, setCurrent] = useState<LevelTestQuestion | null>(null);

  /* -------------------------------------------------------
     PER-QUESTION STATE
  ------------------------------------------------------- */

  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const playbackRef = useRef<PlaybackHandle | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [speakingError, setSpeakingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /* -------------------------------------------------------
     QUESTION SELECTION
  ------------------------------------------------------- */

  const loadQuestion = useCallback(
    (
      targetArea: LevelTestArea,
      band: Band,
      used: string[]
    ): LevelTestQuestion | null => {
      if (targetArea === "reading") {
        return pickQuestion(readingBank, band, used);
      }

      if (targetArea === "listening") {
        return pickQuestion(listeningBank, band, used);
      }

      if (targetArea === "writing") {
        return writingBank[0] ?? null;
      }

      return speakingBank[0] ?? null;
    },
    []
  );

  /* Stop any audio on unmount. */
  useEffect(() => {
    return () => {
      playbackRef.current?.stop();
      playbackRef.current = null;
    };
  }, []);

  const resetPerQuestionState = () => {
    setSelected(null);
    setDraft("");
    setPlayCount(0);
    setAudioError(null);
    setSpeakingError(null);
    setIsPlaying(false);
    setIsScoring(false);

    playbackRef.current?.stop();
    playbackRef.current = null;
  };

  const beginSection = (index: number) => {
    const nextArea = SECTION_ORDER[index];

    const band = nextArea === "listening" ? listeningBand : readingBand;

    const question = loadQuestion(nextArea, band, usedIds);

    setCurrent(question);
    setQuestionInSection(0);
    setPhase("question");
    resetPerQuestionState();
  };

  /* -------------------------------------------------------
     ADVANCE
  ------------------------------------------------------- */

  const advance = (correct: boolean, delay = 700) => {
    setTimeout(() => {
      resetPerQuestionState();

      setAnsweredTotal((n) => n + 1);

      const used = current ? [...usedIds, current.id] : usedIds;

      setUsedIds(used);

      /* Move the band for the adaptive sections. */

      let band: Band =
        area === "listening" ? listeningBand : readingBand;

      if (area === "reading" || area === "listening") {
        band = nextBand(band, correct);

        if (area === "reading") setReadingBand(band);
        else setListeningBand(band);
      }

      const isSectionDone =
        questionInSection + 1 >= SECTION_LENGTH[area];

      if (!isSectionDone) {
        const question = loadQuestion(area, band, used);

        if (question) {
          setCurrent(question);
          setQuestionInSection((n) => n + 1);
          return;
        }
        // Bank exhausted. Fall through to the next section.
      }

      const nextIndex = sectionIndex + 1;

      if (nextIndex >= SECTION_ORDER.length) {
        goTo("levelReveal");
        return;
      }

      setSectionIndex(nextIndex);
      setPhase("section-intro");
    }, delay);
  };

  const record = (
    choiceId: string,
    correct: boolean,
    score: number,
    response?: string
  ) => {
    if (!current) return;

    addLevelAnswer({
      questionId: current.id,
      choiceId,
      correct,
      difficulty: current.difficulty,
      area: SKILL_AREA[current.skill],
      score,
      response,
    });
  };

  /* -------------------------------------------------------
     MULTIPLE CHOICE
  ------------------------------------------------------- */

  const handleSelect = (choiceId: string) => {
    if (selected || !current) return;
    if (current.kind === "writing" || current.kind === "speaking") return;

    setSelected(choiceId);

    const correct = choiceId === current.correctId;

    record(choiceId, correct, correct ? 100 : 0);

    advance(correct);
  };

  /* -------------------------------------------------------
     LISTENING PLAYBACK
  ------------------------------------------------------- */

  const handlePlay = async () => {
    if (!current || current.kind !== "listening") return;
    if (isPlaying) return;

    setIsPlaying(true);
    setAudioError(null);

    try {
      playbackRef.current?.stop();

      playbackRef.current = await playLine(
        current.audioText,
        current.clipId
      );

      setPlayCount((n) => n + 1);
    } catch {
      setAudioError(
        "Audio could not start. Check your sound, then try again."
      );
    } finally {
      setTimeout(() => setIsPlaying(false), 900);
    }
  };

  /* -------------------------------------------------------
     WRITING
  ------------------------------------------------------- */

  const handleWritingSubmit = () => {
    if (!current || current.kind !== "writing" || selected) return;

    const score = scoreWriting(
      draft,
      current.minWords,
      current.keywords
    );

    setSelected("submitted");

    record("written", score >= 50, score, draft.trim());

    advance(score >= 50, 900);
  };

  /* -------------------------------------------------------
     SPEAKING
  ------------------------------------------------------- */

  const startRecording = async () => {
    if (!current || current.kind !== "speaking") return;

    setSpeakingError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        setIsScoring(true);

        try {
          const result = await transcribeAudio(
            blob,
            current.targetText,
            "line"
          );

          const match = calculateWordMatch(
            current.targetText,
            result.transcript,
            "line"
          );

          setSelected("spoken");

          record("spoken", match.score >= 50, match.score, result.transcript);

          advance(match.score >= 50, 1200);
        } catch {
          setSpeakingError(
            "We could not score that take. Record again, or skip this question."
          );
        } finally {
          setIsScoring(false);
        }
      };

      recorderRef.current = recorder;

      recorder.start();

      setIsRecording(true);
    } catch {
      setSpeakingError(
        "Microphone access was refused. You can skip this question."
      );
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  const skipSpeaking = () => {
    if (selected) return;

    setSelected("skipped");

    record("skipped", false, 0);

    advance(false, 400);
  };

  /* -------------------------------------------------------
     DERIVED
  ------------------------------------------------------- */

  const choices = useMemo(() => {
    if (!current) return [];
    if (current.kind === "writing" || current.kind === "speaking") return [];

    return (
      current as LevelTestChoiceQuestion | LevelTestListeningQuestion
    ).choices;
  }, [current]);

  const bandLabel = current
    ? BAND_LABEL[current.difficulty as Band]
    : "";

  /* -------------------------------------------------------
     SECTION INTRO
  ------------------------------------------------------- */

  if (phase === "section-intro") {
    const copy = sectionCopy[area];

    return (
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
        <HeroPosterField />

        <motion.div
          key={area}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex max-w-lg flex-col items-center gap-6"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-porcelain-dim">
            Part {sectionIndex + 1} of {SECTION_ORDER.length}
          </span>

          <h2 className="font-display text-4xl tracking-tight text-porcelain sm:text-6xl">
            {copy.title}
          </h2>

          <p className="text-base leading-relaxed text-porcelain-dim">
            {copy.line}
          </p>

          <button
            type="button"
            onClick={() => beginSection(sectionIndex)}
            className="mt-4 rounded-full border border-gold/40 px-10 py-4 text-[11px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(242,200,121,0.5)]"
          >
            Begin
          </button>
        </motion.div>
      </section>
    );
  }

  if (!current) return null;

  /* -------------------------------------------------------
     QUESTION
  ------------------------------------------------------- */

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-start px-6 pt-24 pb-10">
      <HeroPosterField />

      {/* Progress */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.5em] text-porcelain-dim">
          {sectionCopy[area].title}
        </span>

        <div className="flex items-center">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div key={i} className="flex items-center">
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-500",
                  i < answeredTotal
                    ? "bg-gold"
                    : i === answeredTotal
                    ? "bg-gold shadow-[0_0_10px_2px_rgba(242,200,121,0.55)]"
                    : "bg-porcelain/20"
                )}
              />

              {i < TOTAL_QUESTIONS - 1 && (
                <span
                  className={cn(
                    "h-px w-4 transition-colors duration-500 sm:w-6",
                    i < answeredTotal ? "bg-gold/50" : "bg-porcelain/12"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <span className="text-[11px] tracking-[0.3em] text-porcelain-dim">
          {answeredTotal + 1} OF {TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-center"
          >
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.42em] text-gold/70">
              {bandLabel} LEVEL
            </p>

            {current.context && (
              <p className="mb-4 font-display text-2xl text-gold sm:text-3xl">
                {current.context}
              </p>
            )}

            <h2 className="mb-8 font-display text-3xl leading-tight text-porcelain sm:text-4xl">
              {renderPrompt(current.prompt)}
            </h2>

            {/* ============ LISTENING PLAYER ============ */}

            {current.kind === "listening" && (
              <div className="mb-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={isPlaying}
                  className={cn(
                    "flex items-center gap-3 rounded-full border border-gold/40 px-8 py-4 text-sm uppercase tracking-[0.3em] text-gold transition",
                    isPlaying
                      ? "opacity-50"
                      : "hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(242,200,121,0.5)]"
                  )}
                >
                  <span className="text-lg">
                    {isPlaying ? "\u25AE\u25AE" : "\u25B6"}
                  </span>

                  {playCount === 0 ? "Play audio" : "Play again"}
                </button>

                <p className="text-[11px] tracking-[0.2em] text-porcelain-dim">
                  {playCount === 0
                    ? "Replay as many times as you need."
                    : `Played ${playCount}\u00D7`}
                </p>

                {audioError && (
                  <p className="text-[11px] text-coral">{audioError}</p>
                )}
              </div>
            )}

            {/* ============ WRITING ============ */}

            {current.kind === "writing" && (
              <div className="mx-auto flex max-w-xl flex-col gap-4">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={selected !== null}
                  rows={5}
                  placeholder="Type your answer here..."
                  className="w-full resize-none rounded-2xl border border-porcelain/12 bg-porcelain/[0.03] px-6 py-5 text-left text-base text-porcelain/90 outline-none transition placeholder:text-porcelain/25 focus:border-gold/40 focus:bg-porcelain/[0.06] disabled:opacity-50 sm:text-lg"
                />

                <div className="flex items-center justify-between text-[11px] tracking-[0.2em] text-porcelain-dim">
                  <span>
                    {draft.trim() ? draft.trim().split(/\s+/).length : 0}{" "}
                    / {current.minWords} WORDS
                  </span>

                  <button
                    type="button"
                    onClick={handleWritingSubmit}
                    disabled={selected !== null || draft.trim().length === 0}
                    className="rounded-full border border-gold/40 px-6 py-2.5 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10 disabled:opacity-30"
                  >
                    {selected ? "Saved" : "Submit"}
                  </button>
                </div>
              </div>
            )}

            {/* ============ SPEAKING ============ */}

            {current.kind === "speaking" && (
              <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
                <p className="rounded-2xl border border-porcelain/12 bg-porcelain/[0.03] px-6 py-5 font-display text-2xl leading-snug text-porcelain sm:text-3xl">
                  &ldquo;{current.targetText}&rdquo;
                </p>

                {isScoring ? (
                  <p className="text-sm uppercase tracking-[0.3em] text-gold">
                    Scoring your take...
                  </p>
                ) : selected ? (
                  <p className="text-sm uppercase tracking-[0.3em] text-gold">
                    Recorded
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "flex items-center gap-3 rounded-full border px-8 py-4 text-sm uppercase tracking-[0.3em] transition",
                      isRecording
                        ? "border-coral/60 bg-coral/10 text-coral"
                        : "border-gold/40 text-gold hover:bg-gold/10"
                    )}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isRecording ? "animate-pulse bg-coral" : "bg-gold"
                      )}
                    />

                    {isRecording ? "Stop" : "Record"}
                  </button>
                )}

                {speakingError && (
                  <p className="text-[11px] text-coral">{speakingError}</p>
                )}

                {!selected && !isRecording && !isScoring && (
                  <button
                    type="button"
                    onClick={skipSpeaking}
                    className="text-[10px] uppercase tracking-[0.3em] text-porcelain-dim transition hover:text-porcelain"
                  >
                    Skip this one
                  </button>
                )}
              </div>
            )}

            {/* ============ CHOICES ============ */}

            {choices.length > 0 && (
              <div className="mx-auto flex max-w-xl flex-col gap-3">
                {choices.map((choice, i) => {
                  const isSelected = selected === choice.id;

                  const isCorrect =
                    current.kind === "writing" || current.kind === "speaking"
                      ? false
                      : choice.id === current.correctId;

                  const showState = selected !== null;

                  const locked =
                    current.kind === "listening" && playCount === 0;

                  return (
                    <motion.button
                      key={choice.id}
                      onClick={() => handleSelect(choice.id)}
                      disabled={selected !== null || locked}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.15 + i * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={
                        selected === null && !locked ? { scale: 1.01 } : {}
                      }
                      className={cn(
                        `
                        group relative isolate flex w-full overflow-hidden
                        items-center justify-between rounded-2xl border
                        px-6 py-5 text-left text-base transition-all
                        duration-300 sm:text-lg
                        `,

                        `
                        border-porcelain/12 bg-porcelain/[0.03]
                        text-porcelain/85
                        `,

                        locked && "opacity-30",

                        selected === null &&
                          !locked &&
                          `
                          hover:border-gold/40
                          hover:bg-porcelain/[0.06]
                          hover:shadow-[0_0_20px_-4px_rgba(242,200,121,0.35)]
                          `,

                        showState &&
                          isSelected &&
                          isCorrect &&
                          `
                          border-gold/60 bg-gold/[0.08] text-porcelain
                          shadow-[0_0_24px_-6px_rgba(242,200,121,0.45)]
                          `,

                        showState &&
                          isSelected &&
                          !isCorrect &&
                          "border-coral/40 bg-coral/[0.06] text-porcelain",

                        showState && !isSelected && "opacity-40"
                      )}
                    >
                      <span>{choice.text}</span>

                      <span
                        className={cn(
                          `
                          h-2 w-2 shrink-0 rounded-full border
                          border-porcelain/25 transition-colors
                          `,

                          "group-hover:border-gold/60",

                          isSelected && isCorrect && "border-none bg-gold",

                          isSelected && !isCorrect && "border-none bg-coral"
                        )}
                      />
                    </motion.button>
                  );
                })}
              </div>
            )}

            {current.kind === "listening" && playCount === 0 && (
              <p className="mt-5 text-[11px] tracking-[0.25em] text-porcelain-dim">
                PLAY THE AUDIO TO UNLOCK THE ANSWERS
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
