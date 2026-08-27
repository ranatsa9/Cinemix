"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { HeroPosterField } from "@/components/scenes/HeroPosterField";
import { getSpeakingPromptForMovie } from "@/lib/mockData/quiz";
import { useExperienceStore } from "@/lib/store/useExperienceStore";

import {
  analyzeVisionFrame,
  initializeVision,
  startVisionAttempt,
  finishVisionAttempt,
  VisionAttemptResult,
} from "@/lib/vision/reelVision";

import {
  transcribeAudio,
  TranscriptionResponse,
  getPracticeLines,
  PracticeLine,
  updateAdaptiveLearning,
} from "@/lib/api";

import {
  playLine,
  type PlaybackHandle,
} from "@/lib/audio/playLine";

import {
  calculateWordMatch,
  canPractiseAsSingleWord,
  type WordMatchResult,
} from "@/lib/utils/wordMatch";

/* =========================================================
   WAVEFORM
========================================================= */

const WAVEFORM = [
  12, 20, 14, 28, 18, 35, 24, 42, 30, 48,
  25, 38, 18, 32, 22, 44, 28, 36, 16, 26,
  20, 34, 14, 24,
];

/* =========================================================
   LEVEL LABEL
========================================================= */

function getLevelLabel(
  level: "beginner" | "intermediate" | "advanced" | null
) {
  if (level === "beginner") return "A2";
  if (level === "intermediate") return "B1";
  if (level === "advanced") return "B2";

  return "A2";
}

/* =========================================================
   WORD MATCH
========================================================= */

/*
 * Word matching now lives in a shared module so the placement
 * test scores its speaking question exactly the same way.
 */

/* =========================================================
   COACH FEEDBACK
========================================================= */

function getCoachFeedback(
  result: WordMatchResult
) {
  if (result.score >= 95) {
    return "Excellent take. You matched the line almost perfectly.";
  }

  if (result.score >= 80) {
    return "Great delivery. A few words changed, but the line stayed very close.";
  }

  if (result.score >= 60) {
    return "Good attempt. Focus on the missing words and try the line once more.";
  }

  return "Try another take slowly. Listen to the reference and focus on one phrase at a time.";
}

/* =========================================================
   SPEAKING SCENE
========================================================= */

export function SpeakingScene() {
  const recommendation = useExperienceStore(
    (s) => s.recommendation
  );

  const level = useExperienceStore(
    (s) => s.level
  );

  const goTo = useExperienceStore(
    (s) => s.goTo
  );

  const setSpeakingResult = useExperienceStore(
    (s) => s.setSpeakingResult
  );

  const setAdaptiveResult = useExperienceStore(
    (s) => s.setAdaptiveResult
  );

  const setLevel = useExperienceStore(
    (s) => s.setLevel
  );

  /* =======================================================
     CAMERA
  ======================================================= */

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [cameraStatus, setCameraStatus] =
    useState<
      "loading" | "ready" | "blocked" | "error"
    >("loading");

  const [cameraError, setCameraError] =
    useState<string | null>(null);

  /* =======================================================
     COMPUTER VISION
  ======================================================= */

  const [visionReady, setVisionReady] =
    useState(false);

  const [faceDetected, setFaceDetected] =
    useState(false);

  const [mouthMoving, setMouthMoving] =
    useState(false);

  const visionFrameRef =
    useRef<number | null>(null);

  /* =======================================================
     RECORDING
  ======================================================= */

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [micReady, setMicReady] =
    useState(false);

  const [audioLevel, setAudioLevel] =
    useState(0);

  const [recordedAudio, setRecordedAudio] =
    useState<Blob | null>(null);

  const [visionResult, setVisionResult] =
    useState<VisionAttemptResult | null>(null);

  /* =======================================================
     FOCUSED WORD PRACTICE (UI ONLY)
  ======================================================= */

  const [practiceMode, setPracticeMode] =
    useState<"line" | "word">("line");

  const [focusWord, setFocusWord] =
    useState("");

  const [focusedAttempts, setFocusedAttempts] =
    useState(0);

  const [skippedWords, setSkippedWords] =
    useState<string[]>([]);

  /* =======================================================
     WHISPER
  ======================================================= */

  const [transcript, setTranscript] =
    useState("");

  const [
    transcriptionResult,
    setTranscriptionResult,
  ] =
    useState<TranscriptionResponse | null>(
      null
    );

  const [
    isTranscribing,
    setIsTranscribing,
  ] =
    useState(false);

  const [
    transcriptionError,
    setTranscriptionError,
  ] =
    useState<string | null>(null);

  /* =======================================================
     REELA TEXT TO SPEECH
  ======================================================= */

  const [
    isPlayingReference,
    setIsPlayingReference,
  ] = useState(false);

  const [
    referenceError,
    setReferenceError,
  ] = useState<string | null>(null);

  const referencePlaybackRef =
    useRef<PlaybackHandle | null>(null);

  /* =======================================================
     AUDIO VISUALIZER
  ======================================================= */

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const analyserRef =
    useRef<AnalyserNode | null>(null);

  const audioAnimationRef =
    useRef<number | null>(null);

  /* =======================================================
     MOVIE / PROMPT
  ======================================================= */

  const fallbackPrompt = useMemo(
    () =>
      getSpeakingPromptForMovie(
        recommendation?.movie.id ??
          "default"
      ),
    [recommendation?.movie.id]
  );

  const movieTitle =
    recommendation?.movie.title ??
    "The Intern";

  const levelLabel =
    getLevelLabel(level);

  /* =======================================================
     REAL MOVIE PRACTICE LINES
  ======================================================= */

  const [
    practiceLines,
    setPracticeLines,
  ] = useState<PracticeLine[]>([]);

  const [
    currentLineIndex,
    setCurrentLineIndex,
  ] = useState(0);

  const [
    linesLoading,
    setLinesLoading,
  ] = useState(false);

  const [
    linesError,
    setLinesError,
  ] = useState<string | null>(null);

  const [
    completedLineScores,
    setCompletedLineScores,
  ] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    async function loadMovieLines() {
      const movieId =
        recommendation?.movie.id;

      if (
        movieId === null ||
        movieId === undefined
      ) {
        setPracticeLines([]);
        setLinesError(
          "Movie dialogue is unavailable for this recommendation."
        );
        return;
      }

      try {
        setLinesLoading(true);
        setLinesError(null);
        setCurrentLineIndex(0);
        setCompletedLineScores([]);

        const response =
          await getPracticeLines(
            movieId
          );

        if (!active) {
          return;
        }

        /*
         * Prefer lines prepared for the learner's CEFR level.
         * If fewer than 3 match, fill the remaining slots with
         * the highest-quality lines from the same movie.
         */
        const allLines =
          [...response.lines].sort(
            (a, b) =>
              (b.qualityScore ?? 0) -
              (a.qualityScore ?? 0)
          );

        const levelMatches =
          allLines.filter(
            (line) =>
              line.level
                ?.trim()
                .toUpperCase() ===
              levelLabel.toUpperCase()
          );

        const chosen: PracticeLine[] =
          [];

        for (const line of levelMatches) {
          if (chosen.length >= 3) {
            break;
          }

          chosen.push(line);
        }

        for (const line of allLines) {
          if (chosen.length >= 3) {
            break;
          }

          if (
            !chosen.some(
              (item) =>
                item.lineId ===
                line.lineId
            )
          ) {
            chosen.push(line);
          }
        }

        setPracticeLines(chosen);

        if (chosen.length === 0) {
          setLinesError(
            "No speaking lines were found for this movie."
          );
        }
      } catch (error) {
        console.error(
          "Practice lines error:",
          error
        );

        if (!active) {
          return;
        }

        setPracticeLines([]);

        setLinesError(
          error instanceof Error
            ? error.message
            : "Could not load speaking lines for this movie."
        );
      } finally {
        if (active) {
          setLinesLoading(false);
        }
      }
    }

    loadMovieLines();

    return () => {
      active = false;
    };
  }, [
    recommendation?.movie.id,
    levelLabel,
  ]);

  const currentLine =
    practiceLines[
      currentLineIndex
    ] ?? null;

  const currentLineText =
    currentLine?.text ??
    fallbackPrompt.prompt;

  const activeExpectedText =
    practiceMode === "word" && focusWord
      ? focusWord
      : currentLineText;

  const totalLines =
    practiceLines.length > 0
      ? practiceLines.length
      : 1;

  const currentLineNumber =
    Math.min(
      currentLineIndex + 1,
      totalLines
    );

  const progressPercent =
    Math.round(
      (currentLineNumber /
        totalLines) *
        100
    );

  /* =======================================================
     WORD MATCH RESULT
  ======================================================= */

  const wordMatch =
    useMemo<WordMatchResult | null>(
      () => {
        if (!transcript.trim()) {
          return null;
        }

        return calculateWordMatch(
          activeExpectedText,
          transcript,
          practiceMode
        );
      },
      [
        activeExpectedText,
        transcript,
        practiceMode,
      ]
    );

  const coachFeedback =
    wordMatch
      ? practiceMode === "word"
        ? wordMatch.score === 100
          ? wordMatch.approximate
            ? `Close enough — “${focusWord}” came through. Say it once more for a cleaner ending, or return to the full line.`
            : `Great — “${focusWord}” was recognized. You can return to the full line.`
          : focusedAttempts >= 2
          ? `You tried “${focusWord}” twice. Keep practising or move on and revisit it later.`
          : `Listen to “${focusWord}”, then try only that word again.`
        : getCoachFeedback(wordMatch)
      : "";

  /* =======================================================
     TIMER
  ======================================================= */

  const formatTime = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  /* =======================================================
     START CAMERA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        setCameraStatus("loading");
        setCameraError(null);

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Camera access is not supported in this browser."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",

                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },
              },

              audio: false,
            }
          );

        if (!mounted) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        streamRef.current =
          stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        setCameraStatus("ready");
      } catch (error) {
        console.error(
          "Camera error:",
          error
        );

        if (!mounted) {
          return;
        }

        if (
          error instanceof DOMException &&
          (
            error.name ===
              "NotAllowedError" ||
            error.name ===
              "PermissionDeniedError"
          )
        ) {
          setCameraStatus("blocked");

          setCameraError(
            "Camera permission was denied."
          );
        } else {
          setCameraStatus("error");

          setCameraError(
            "Cinemix could not start your camera."
          );
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current =
          null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject =
          null;
      }
    };
  }, []);

  /* =======================================================
     START MEDIAPIPE
  ======================================================= */

  useEffect(() => {
    if (
      cameraStatus !== "ready"
    ) {
      return;
    }

    let active = true;

    async function startVision() {
      try {
        setVisionReady(false);

        await initializeVision();

        if (!active) {
          return;
        }

        setVisionReady(true);

        const detect = () => {
          if (!active) {
            return;
          }

          const video =
            videoRef.current;

          if (
            video &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            try {
              const result =
                analyzeVisionFrame(
                  video,
                  performance.now()
                );

              setFaceDetected(
                result.faceDetected
              );

              setMouthMoving(
                result.mouthMoving
              );
            } catch (error) {
              console.error(
                "Vision frame error:",
                error
              );
            }
          }

          visionFrameRef.current =
            requestAnimationFrame(
              detect
            );
        };

        detect();
      } catch (error) {
        console.error(
          "MediaPipe initialization error:",
          error
        );

        if (active) {
          setVisionReady(false);
        }
      }
    }

    startVision();

    return () => {
      active = false;

      if (
        visionFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          visionFrameRef.current
        );

        visionFrameRef.current =
          null;
      }
    };
  }, [cameraStatus]);

  /* =======================================================
     RETRY CAMERA
  ======================================================= */

  const retryCamera =
    async () => {
      try {
        setCameraStatus("loading");
        setCameraError(null);

        setVisionReady(false);
        setFaceDetected(false);
        setMouthMoving(false);

        if (
          visionFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            visionFrameRef.current
          );

          visionFrameRef.current =
            null;
        }

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",

                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },
              },

              audio: false,
            }
          );

        streamRef.current =
          stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        setCameraStatus("ready");
      } catch (error) {
        console.error(
          "Camera retry error:",
          error
        );

        setCameraStatus("error");

        setCameraError(
          "Cinemix could not start your camera."
        );
      }
    };

  /* =======================================================
     AUDIO VISUALIZER
  ======================================================= */

  const startAudioVisualization = (
    stream: MediaStream
  ) => {
    const audioContext =
      new AudioContext();

    const analyser =
      audioContext.createAnalyser();

    analyser.fftSize = 256;

    analyser.smoothingTimeConstant =
      0.8;

    const source =
      audioContext.createMediaStreamSource(
        stream
      );

    source.connect(analyser);

    audioContextRef.current =
      audioContext;

    analyserRef.current =
      analyser;

    const data =
      new Uint8Array(
        analyser.frequencyBinCount
      );

    const updateAudio = () => {
      analyser.getByteFrequencyData(
        data
      );

      const average =
        data.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / data.length;

      setAudioLevel(
        Math.min(
          1,
          average / 100
        )
      );

      audioAnimationRef.current =
        requestAnimationFrame(
          updateAudio
        );
    };

    updateAudio();
  };

  /* =======================================================
     START RECORDING
  ======================================================= */

  const startRecording =
    async () => {
      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Microphone access is not supported."
          );
        }

        const micStream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        setMicReady(true);

        const recorder =
          new MediaRecorder(
            micStream
          );

        mediaRecorderRef.current =
          recorder;

        audioChunksRef.current =
          [];

        setRecordedAudio(null);

        setVisionResult(null);

        setTranscript("");

        setTranscriptionResult(
          null
        );

        setTranscriptionError(
          null
        );

        setRecordingSeconds(0);

        recorder.ondataavailable = (
          event
        ) => {
          if (
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

        recorder.onstop =
          async () => {
            const blob =
              new Blob(
                audioChunksRef.current,
                {
                  type:
                    recorder.mimeType ||
                    "audio/webm",
                }
              );

            setRecordedAudio(
              blob
            );

            micStream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            setMicReady(false);

            /* ===========================================
               WHISPER
            =========================================== */

            try {
              setIsTranscribing(
                true
              );

              setTranscriptionError(
                null
              );

              const result =
                await transcribeAudio(
                  blob,
                  activeExpectedText,
                  practiceMode
                );

              setTranscriptionResult(
                result
              );

              setTranscript(
                result.transcript
              );

              if (practiceMode === "word") {
                if (!result.transcript.trim()) {
                  // Silence is a microphone problem, not a
                  // pronunciation mistake. Say so instead of
                  // rendering an empty result panel.
                  setTranscriptionError(
                    "We didn't catch any sound. Hold the button, wait half a second, then say the word."
                  );
                }

                const focusedResult = calculateWordMatch(
                  activeExpectedText,
                  result.transcript,
                  "word"
                );

                setFocusedAttempts((previous) =>
                  focusedResult.score === 100
                    ? previous
                    : previous + 1
                );
              }

              console.log(
                "Whisper result:",
                result
              );
            } catch (error) {
              console.error(
                "Transcription error:",
                error
              );

              setTranscriptionError(
                error instanceof Error
                  ? error.message
                  : "Cinemix could not understand this take."
              );
            } finally {
              setIsTranscribing(
                false
              );
            }
          };

        /* Start CV */

        startVisionAttempt();

        /* Start waveform */

        startAudioVisualization(
          micStream
        );

        /* Start recorder */

        recorder.start();

        setIsRecording(true);

        /* Timer */

        timerRef.current =
          setInterval(() => {
            setRecordingSeconds(
              (previous) =>
                previous + 1
            );
          }, 1000);
      } catch (error) {
        console.error(
          "Microphone error:",
          error
        );

        alert(
          "Please allow microphone access to record your take."
        );
      }
    };

  /* =======================================================
     STOP RECORDING
  ======================================================= */

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current
        .state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }

    if (
      audioAnimationRef.current !==
      null
    ) {
      cancelAnimationFrame(
        audioAnimationRef.current
      );

      audioAnimationRef.current =
        null;
    }

    if (
      audioContextRef.current
    ) {
      audioContextRef.current
        .close()
        .catch(() => {});

      audioContextRef.current =
        null;
    }

    setAudioLevel(0);

    setIsRecording(false);

    const result =
      finishVisionAttempt();

    setVisionResult(result);

    console.log(
      "CV attempt result:",
      result
    );
  };

  /* =======================================================
     NEXT MOVIE LINE
  ======================================================= */

  const clearTake = () => {
    setTranscript("");
    setTranscriptionResult(null);
    setTranscriptionError(null);
    setRecordedAudio(null);
    setVisionResult(null);
    setRecordingSeconds(0);
  };

  const practiseWord = (word: string) => {
    setPracticeMode("word");
    setFocusWord(word);
    setFocusedAttempts(0);
    clearTake();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const returnToFullLine = () => {
    setPracticeMode("line");
    setFocusWord("");
    setFocusedAttempts(0);
    clearTake();
  };

  const moveOnFromWord = () => {
    if (focusWord) {
      setSkippedWords((previous) =>
        previous.includes(focusWord)
          ? previous
          : [...previous, focusWord]
      );
    }

    returnToFullLine();
  };

  const goToNextLine = () => {
    if (!wordMatch) {
      return;
    }

    setCompletedLineScores(
      (previous) => {
        const next = [...previous];

        next[currentLineIndex] =
          wordMatch.score;

        return next;
      }
    );

    if (
      currentLineIndex >=
      totalLines - 1
    ) {
      return;
    }

    referencePlaybackRef.current?.stop();
    referencePlaybackRef.current = null;

    setIsPlayingReference(false);
    setReferenceError(null);

    setPracticeMode("line");
    setFocusWord("");
    setFocusedAttempts(0);
    clearTake();

    setCurrentLineIndex(
      (previous) =>
        Math.min(
          previous + 1,
          totalLines - 1
        )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isLastLine =
    currentLineIndex >=
    totalLines - 1;

  const scoresForAverage = [
    ...completedLineScores,
  ];

  if (wordMatch) {
    scoresForAverage[
      currentLineIndex
    ] = wordMatch.score;
  }

  const validScores =
    scoresForAverage.filter(
      (score) =>
        typeof score ===
        "number"
    );

  const finalAverage =
    validScores.length > 0
      ? Math.round(
          validScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
            validScores.length
        )
      : 0;

  const finishSpeakingChallenge = () => {
    setSpeakingResult({
      overall: finalAverage,
      pronunciation: 0,
      fluency: 0,
      pace: 0,
      relevance: finalAverage,
      feedback: [
        `${finalAverage}% recognized-word match across ${totalLines} movie lines.`,
        skippedWords.length > 0
          ? `Saved for later practice: ${skippedWords.join(", ")}.`
          : "No difficult words were skipped.",
      ],
    });

    const movieId = Number(recommendation?.movie.id);

    if (Number.isFinite(movieId)) {
      void updateAdaptiveLearning({
        user_id: "cinemix_demo_user",
        movie_id: movieId,
        activity_mode: "speaking",
        activity: null,
        quiz_answers: null,
        attempt_result: {
          prototypeWordAccuracy: finalAverage,
          visualSpeakingCheck: visionResult ?? {},
          skippedWords,
        },
        enjoyment_rating: null,
      })
        .then((result) => {
          setAdaptiveResult(result);

          const nextLevel = result.level_after.toLowerCase();
          if (
            nextLevel === "beginner" ||
            nextLevel === "intermediate" ||
            nextLevel === "advanced"
          ) {
            setLevel(nextLevel);
          }
        })
        .catch((error) => {
          console.error("Speaking adaptive update failed:", error);
        });
    }

    goTo("result");
  };

  /* =======================================================
     PLAY REELA REFERENCE
  ======================================================= */

  const playReference = async () => {
    if (
      isRecording ||
      isPlayingReference
    ) {
      return;
    }

    try {
      setReferenceError(null);
      setIsPlayingReference(true);

      referencePlaybackRef.current?.stop();

      const clipId =
        practiceMode === "line"
          ? currentLine?.clipId ?? undefined
          : undefined;

      const playback = await playLine(
          activeExpectedText,
          clipId
        );

      referencePlaybackRef.current = playback;

      playback.finished.then(() => {
        if (referencePlaybackRef.current === playback) {
          referencePlaybackRef.current = null;
          setIsPlayingReference(false);
        }
      });
    } catch (error) {
      console.error(
        "Reela TTS error:",
        error
      );

      setIsPlayingReference(false);

      setReferenceError(
        error instanceof Error
          ? error.message
          : "Reference audio could not be played."
      );

      referencePlaybackRef.current = null;
    }
  };

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(
          timerRef.current
        );
      }

      if (
        audioAnimationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          audioAnimationRef.current
        );
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (
        audioContextRef.current
      ) {
        audioContextRef.current
          .close()
          .catch(() => {});
      }

      referencePlaybackRef.current?.stop();
      referencePlaybackRef.current = null;
    };
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#080b0d] px-5 py-16 sm:px-8 lg:px-10">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="opacity-20">
        <HeroPosterField />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px]">

        {/* ===================================================
            HEADER
        =================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mb-9 text-center"
        >

          <div className="flex items-center justify-center gap-3">

            <div className="h-2 w-2 rounded-full bg-[#e2b866] shadow-[0_0_12px_rgba(226,184,102,0.8)]" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e2b866]">
              Cinemix Speaking Challenge
            </p>

          </div>

          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Bring the movie to life.
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/45">
            Listen to the line, record your take,
            and let Reela coach your delivery.
          </p>

        </motion.header>

        {/* ===================================================
            TOP INFO
        =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
            duration: 0.55,
          }}
          className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#111619] px-5 py-4"
        >

          <div>

            <p className="text-[9px] uppercase tracking-[0.24em] text-white/30">
              Recommended Movie
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {movieTitle}
            </p>

          </div>

          <div className="flex items-center gap-5">

            <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />

            <div>

              <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">
                Progress
              </p>

              <p className="mt-1 text-xs text-white/65">
                Line {currentLineNumber} of {totalLines}
              </p>

            </div>

            <div className="w-24">

              <div className="h-1 overflow-hidden rounded-full bg-white/10">

                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${progressPercent}%`,
                  }}
                  transition={{
                    delay: 0.45,
                    duration: 0.8,
                  }}
                  className="h-full rounded-full bg-[#e2b866]"
                />

              </div>

            </div>

          </div>

        </motion.div>

        {(linesLoading || linesError) && (
          <div className="mb-5 rounded-xl border border-white/[0.08] bg-[#111619] px-5 py-4">
            {linesLoading ? (
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{
                    opacity: [
                      0.3,
                      1,
                      0.3,
                    ],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                  }}
                  className="h-2 w-2 rounded-full bg-[#e2b866]"
                />

                <p className="text-xs text-white/45">
                  Loading dialogue from {movieTitle}...
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#c85d4b]">
                {linesError}
              </p>
            )}
          </div>
        )}

        {/* ===================================================
            MAIN TWO COLUMNS
        =================================================== */}

        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">

          {/* =================================================
              CAMERA
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: -15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.18,
              duration: 0.65,
            }}
            className="rounded-xl border border-white/[0.08] bg-[#111619] p-4"
          >

            {/* HEADER */}

            <div className="mb-4 flex items-center justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  Live Camera
                </p>

                <p className="mt-1 text-[11px] text-white/30">
                  Visual presence check
                </p>

              </div>

              <div className="flex items-center gap-4">

                {/* MIC */}

                <div className="flex items-center gap-2">

                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      micReady
                        ? "bg-[#c85d4b] shadow-[0_0_8px_rgba(200,93,75,0.9)]"
                        : "bg-white/20"
                    }`}
                  />

                  <span
                    className={`text-[9px] uppercase tracking-[0.18em] ${
                      micReady
                        ? "text-[#c85d4b]"
                        : "text-white/35"
                    }`}
                  >
                    Mic
                  </span>

                </div>

                {/* CAMERA */}

                <div className="flex items-center gap-2">

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      cameraStatus ===
                      "ready"
                        ? "bg-[#66a77a]"
                        : cameraStatus ===
                          "loading"
                        ? "bg-[#e2b866]"
                        : "bg-[#c85d4b]"
                    }`}
                  />

                  <span
                    className={`text-[9px] uppercase tracking-[0.18em] ${
                      cameraStatus ===
                      "ready"
                        ? "text-[#66a77a]"
                        : "text-white/35"
                    }`}
                  >
                    Camera
                  </span>

                </div>

              </div>

            </div>

            {/* =================================================
                VIDEO
            ================================================= */}

            <div
              className={`relative aspect-video overflow-hidden rounded-lg border bg-[#050708] ${
                isRecording
                  ? "border-[#c85d4b]/45"
                  : faceDetected
                  ? "border-[#66a77a]/35"
                  : "border-white/[0.07]"
              }`}
            >

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover ${
                  cameraStatus ===
                  "ready"
                    ? "opacity-100"
                    : "opacity-0"
                }`}
                style={{
                  transform:
                    "scaleX(-1)",
                }}
              />

              {/* CAMERA LOADING */}

              {cameraStatus ===
                "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">

                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-10 w-10 rounded-full border border-[#e2b866]/20 border-t-[#e2b866]"
                  />

                  <p className="mt-4 text-xs text-white/45">
                    Starting camera...
                  </p>

                </div>
              )}

              {/* CAMERA ERROR */}

              {(cameraStatus ===
                "blocked" ||
                cameraStatus ===
                  "error") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">

                  <p className="text-sm text-white/70">
                    Camera unavailable
                  </p>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-white/35">
                    {cameraError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      retryCamera
                    }
                    className="mt-5 rounded-md border border-[#e2b866]/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#e2b866]"
                  >
                    Try Again
                  </button>

                </div>
              )}

              {/* LIVE */}

              {cameraStatus ===
                "ready" && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-black/45 px-3 py-2 backdrop-blur-md">

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isRecording
                        ? "bg-[#c85d4b]"
                        : faceDetected
                        ? "bg-[#66a77a]"
                        : "bg-[#e2b866]"
                    }`}
                  />

                  <span className="text-[9px] uppercase tracking-[0.16em] text-white/65">
                    {isRecording
                      ? "Recording"
                      : visionReady
                      ? "Live"
                      : "Loading Vision"}
                  </span>

                </div>
              )}

              {/* TIMER */}

              {cameraStatus ===
                "ready" && (
                <div
                  className={`absolute right-4 top-4 rounded-md px-3 py-2 font-mono text-[11px] backdrop-blur-md ${
                    isRecording
                      ? "bg-[#9b2727]/80 text-white"
                      : "bg-black/45 text-white/65"
                  }`}
                >
                  {formatTime(
                    recordingSeconds
                  )}
                </div>
              )}

              {/* WAVEFORM */}

              <div className="absolute inset-x-0 bottom-0">

                <div className="flex h-16 items-center justify-center gap-[3px] bg-gradient-to-t from-black/70 to-transparent px-6">

                  {WAVEFORM.map(
                    (
                      height,
                      index
                    ) => (
                      <motion.div
                        key={index}
                        animate={{
                          height:
                            isRecording
                              ? Math.max(
                                  4,
                                  height *
                                    (
                                      0.35 +
                                      audioLevel *
                                        1.4
                                    )
                                )
                              : Math.max(
                                  3,
                                  height *
                                    0.35
                                ),

                          opacity:
                            isRecording
                              ? 0.9
                              : 0.35,
                        }}
                        transition={{
                          duration:
                            0.1,
                        }}
                        className={`w-[2px] rounded-full ${
                          isRecording
                            ? "bg-[#e2b866]"
                            : "bg-[#e2b866]/35"
                        }`}
                      />
                    )
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                CV LIVE STATUS
            ================================================= */}

            <div className="mt-4 grid grid-cols-2 gap-3">

              {/* FACE */}

              <div
                className={`rounded-lg border px-4 py-3 ${
                  faceDetected
                    ? "border-[#66a77a]/25 bg-[#66a77a]/[0.04]"
                    : "border-white/[0.06] bg-[#0c1012]"
                }`}
              >

                <div className="flex items-center justify-between">

                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                    Face
                  </span>

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      faceDetected
                        ? "bg-[#66a77a]"
                        : "bg-white/20"
                    }`}
                  />

                </div>

                <p
                  className={`mt-2 text-xs ${
                    faceDetected
                      ? "text-[#66a77a]"
                      : "text-white/50"
                  }`}
                >
                  {!visionReady
                    ? "Loading..."
                    : faceDetected
                    ? "Detected"
                    : "Not detected"}
                </p>

              </div>

              {/* MOUTH */}

              <div
                className={`rounded-lg border px-4 py-3 ${
                  mouthMoving
                    ? "border-[#e2b866]/25 bg-[#e2b866]/[0.04]"
                    : "border-white/[0.06] bg-[#0c1012]"
                }`}
              >

                <div className="flex items-center justify-between">

                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                    Mouth Movement
                  </span>

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      mouthMoving
                        ? "bg-[#e2b866]"
                        : "bg-white/20"
                    }`}
                  />

                </div>

                <p
                  className={`mt-2 text-xs ${
                    mouthMoving
                      ? "text-[#e2b866]"
                      : "text-white/50"
                  }`}
                >
                  {!visionReady
                    ? "Loading..."
                    : mouthMoving
                    ? "Movement detected"
                    : "Waiting"}
                </p>

              </div>

            </div>

            {/* =================================================
                CV RESULT
            ================================================= */}

            {visionResult && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-3 rounded-lg border border-white/[0.06] bg-[#0c1012] px-4 py-3"
              >

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                      Visual Speaking
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        visionResult
                          .visualSpeakingDetected
                          ? "text-[#66a77a]"
                          : "text-white/45"
                      }`}
                    >
                      {visionResult
                        .visualSpeakingDetected
                        ? "Detected"
                        : "Needs another take"}
                    </p>

                  </div>

                  <div className="flex gap-5">

                    <div className="text-right">

                      <p className="text-[9px] text-white/30">
                        Face
                      </p>

                      <p className="mt-1 text-xs text-white/65">
                        {
                          visionResult
                            .faceVisiblePercent
                        }
                        %
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-[9px] text-white/30">
                        Mouth
                      </p>

                      <p className="mt-1 text-xs text-white/65">
                        {
                          visionResult
                            .mouthMovementPercent
                        }
                        %
                      </p>

                    </div>

                  </div>

                </div>

              </motion.div>
            )}

            <div className="mt-4">

              <p className="text-[10px] text-white/25">
                Camera analysis happens locally.
                Video is never uploaded.
              </p>

            </div>

          </motion.div>

          {/* =================================================
              YOUR TAKE
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.25,
              duration: 0.65,
            }}
            className="flex flex-col rounded-xl border border-white/[0.08] bg-[#111619] p-6"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e2b866]">
                  Your Take
                </p>

                <p className="mt-2 text-xs text-white/35">
                  {practiceMode === "word"
                    ? `Focused practice · attempt ${Math.max(1, focusedAttempts + 1)}`
                    : "Match the line as naturally as you can."}
                </p>

              </div>

              <div className="flex h-10 min-w-10 items-center justify-center rounded-md border border-[#e2b866]/30 bg-[#e2b866]/[0.05] px-3">

                <span className="text-xs font-semibold text-[#e2b866]">
                  {levelLabel}
                </span>

              </div>

            </div>

            {/* DIALOGUE */}

            <div className="my-8">

              <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">
                {practiceMode === "word"
                  ? "Difficult Word"
                  : "Movie Dialogue"}
              </p>

              <div className="mt-4 border-l-2 border-[#e2b866]/70 pl-5">

                <p className="font-display text-2xl leading-[1.45] text-white sm:text-[28px]">
                  &ldquo;
                  {activeExpectedText}
                  &rdquo;
                </p>

                {currentLine && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#e2b866]/15 bg-[#e2b866]/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#e2b866]/70">
                      From {movieTitle}
                    </span>

                    <span className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-white/30">
                      {currentLine.level}
                    </span>
                  </div>
                )}

              </div>

            </div>

            {/* REELA */}

            <div className="rounded-lg border border-white/[0.07] bg-[#0c1012] p-4">

              <div className="flex items-center gap-3">

                <div className="relative">

                  <motion.div
                    animate={{
                      opacity: [
                        0.15,
                        0.35,
                        0.15,
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                    }}
                    className="absolute -inset-2 rounded-full bg-[#e2b866]/30 blur-lg"
                  />

                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e2b866]/35 bg-[#15191b]">

                    <span className="font-display text-sm font-semibold text-[#e2b866]">
                      R
                    </span>

                  </div>

                </div>

                <div>

                  <div className="flex items-center gap-2">

                    <p className="text-sm font-medium text-white">
                      Reela
                    </p>

                    <span className="rounded-sm bg-[#e2b866]/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.15em] text-[#e2b866]">
                      AI Coach
                    </span>

                  </div>

                  <p className="mt-1 text-[11px] text-white/30">
                    {practiceMode === "word"
                      ? "Listen closely, then record only this word."
                      : "Listen first, then make the line yours."}
                  </p>

                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-auto pt-7">

              <div className="grid gap-3 sm:grid-cols-2">

                {/* HEAR REFERENCE */}

                <motion.button
                  type="button"
                  onClick={
                    playReference
                  }
                  disabled={
                    isRecording ||
                    isPlayingReference ||
                    linesLoading
                  }
                  whileHover={
                    !isRecording &&
                    !isPlayingReference &&
                    !linesLoading
                      ? {
                          y: -2,
                        }
                      : {}
                  }
                  whileTap={
                    !isRecording &&
                    !isPlayingReference &&
                    !linesLoading
                      ? {
                          scale: 0.985,
                        }
                      : {}
                  }
                  className={`flex items-center justify-center gap-3 rounded-lg border px-5 py-4 text-xs font-medium transition-all ${
                    isRecording ||
                    isPlayingReference
                      ? "cursor-not-allowed border-white/[0.05] bg-[#0c1012] text-white/25"
                      : "border-white/[0.09] bg-[#0c1012] text-white/65 hover:border-[#e2b866]/35"
                  }`}
                >

                  {isPlayingReference ? (
                    <>
                      <div className="flex h-4 items-center gap-[2px]">
                        <motion.span
                          animate={{
                            scaleY: [
                              0.6,
                              1.4,
                              0.8,
                              1.2,
                              0.6,
                            ],
                          }}
                          transition={{
                            duration: 1,
                            repeat:
                              Infinity,
                          }}
                          className="h-3 w-[2px] rounded-full bg-[#e2b866]"
                        />

                        <motion.span
                          animate={{
                            scaleY: [
                              1.2,
                              0.7,
                              1.4,
                              0.8,
                              1.2,
                            ],
                          }}
                          transition={{
                            duration: 0.9,
                            repeat:
                              Infinity,
                          }}
                          className="h-4 w-[2px] rounded-full bg-[#e2b866]"
                        />

                        <motion.span
                          animate={{
                            scaleY: [
                              0.8,
                              1.3,
                              0.6,
                              1.4,
                              0.8,
                            ],
                          }}
                          transition={{
                            duration: 1.1,
                            repeat:
                              Infinity,
                          }}
                          className="h-3 w-[2px] rounded-full bg-[#e2b866]"
                        />
                      </div>

                      Reela is speaking...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-[#e2b866]"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>

                      Hear reference
                    </>
                  )}

                </motion.button>

                {/* RECORD */}

                <motion.button
                  type="button"
                  disabled={
                    linesLoading
                  }
                  onClick={
                    isRecording
                      ? stopRecording
                      : startRecording
                  }
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                  className={`flex items-center justify-center gap-3 rounded-lg px-5 py-4 text-xs font-semibold ${
                    isRecording
                      ? "border border-[#c85d4b]/50 bg-[#9b2727] text-white"
                      : "bg-[#e2b866] text-[#080b0d]"
                  }`}
                >

                  {isRecording ? (
                    <>
                      <span className="h-2.5 w-2.5 rounded-[2px] bg-white" />

                      Stop recording
                    </>
                  ) : (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#9b2727]" />

                      {practiceMode === "word"
                        ? `Try “${focusWord}”`
                        : "Record your take"}
                    </>
                  )}

                </motion.button>

              </div>

              {referenceError && (
                <p className="mt-3 text-center text-[10px] text-[#c85d4b]">
                  {referenceError}
                </p>
              )}

              {/* STATUS */}

              <div className="mt-5 flex items-center justify-center gap-2">

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isRecording
                      ? "animate-pulse bg-[#c85d4b]"
                      : isTranscribing
                      ? "animate-pulse bg-[#e2b866]"
                      : recordedAudio
                      ? "bg-[#66a77a]"
                      : "bg-[#e2b866]/60"
                  }`}
                />

                <p
                  className={`text-[10px] tracking-wide ${
                    isRecording
                      ? "text-[#c85d4b]"
                      : isTranscribing
                      ? "text-[#e2b866]"
                      : recordedAudio
                      ? "text-[#66a77a]"
                      : "text-white/25"
                  }`}
                >
                  {isRecording
                    ? "Recording your take..."
                    : isTranscribing
                    ? "Cinemix is listening..."
                    : recordedAudio
                    ? "Take recorded successfully."
                    : "Ready when you are."}
                </p>

              </div>

            </div>

          </motion.div>

        </div>

        {/* ===================================================
            WHAT CINEMIX HEARD
        =================================================== */}

        {(isTranscribing ||
          transcript ||
          transcriptionError) && (
          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 rounded-xl border border-white/[0.08] bg-[#111619] p-5"
          >

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e2b866]">
                  What Cinemix Heard
                </p>

                {isTranscribing ? (
                  <div className="mt-4 flex items-center gap-3">

                    <motion.span
                      animate={{
                        opacity: [
                          0.3,
                          1,
                          0.3,
                        ],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                      }}
                      className="h-2 w-2 rounded-full bg-[#e2b866]"
                    />

                    <p className="text-sm text-white/40">
                      Transcribing your take with Whisper...
                    </p>

                  </div>
                ) : transcriptionError ? (
                  <p className="mt-4 text-sm text-[#c85d4b]">
                    {transcriptionError}
                  </p>
                ) : (
                  <p className="mt-4 font-display text-xl leading-relaxed text-white sm:text-2xl">
                    {transcript ||
                      "—"}
                  </p>
                )}

              </div>

              {transcriptionResult &&
                !isTranscribing && (
                  <div className="flex gap-6">

                    <div className="text-right">

                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">
                        Language
                      </p>

                      <p className="mt-1 text-xs text-white/55">
                        {
                          transcriptionResult
                            .language
                        }
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">
                        Speech
                      </p>

                      <p className="mt-1 text-xs text-white/55">
                        {
                          transcriptionResult
                            .speechDurationSeconds
                        }
                        s
                      </p>

                    </div>

                  </div>
                )}

            </div>

          </motion.section>
        )}

        {/* ===================================================
            SPEAKING ANALYSIS
        =================================================== */}

        {wordMatch &&
          !isTranscribing &&
          !transcriptionError && (
            <motion.section
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              className="mt-5 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"
            >

              {/* =============================================
                  WORD MATCH SCORE
              ============================================= */}

              <div className="rounded-xl border border-white/[0.08] bg-[#111619] p-6">

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e2b866]">
                  Word Match
                </p>

                <div className="mt-5 flex items-end gap-2">

                  <motion.span
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.5,
                    }}
                    className={`font-display text-6xl font-semibold ${
                      wordMatch.score >=
                      80
                        ? "text-[#66a77a]"
                        : wordMatch.score >=
                          60
                        ? "text-[#e2b866]"
                        : "text-[#c85d4b]"
                    }`}
                  >
                    {
                      wordMatch.score
                    }
                  </motion.span>

                  <span className="mb-2 text-lg text-white/35">
                    %
                  </span>

                </div>

                {/* SCORE BAR */}

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">

                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: `${wordMatch.score}%`,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                    className={`h-full rounded-full ${
                      wordMatch.score >=
                      80
                        ? "bg-[#66a77a]"
                        : wordMatch.score >=
                          60
                        ? "bg-[#e2b866]"
                        : "bg-[#c85d4b]"
                    }`}
                  />

                </div>

                <p className="mt-4 text-xs leading-5 text-white/35">
                  {
                    wordMatch
                      .matched.length
                  }{" "}
                  of{" "}
                  {wordMatch
                    .matched.length +
                    wordMatch
                      .missing.length}{" "}
                  words matched.
                </p>

                {/* SMALL STATS */}

                <div className="mt-6 grid grid-cols-3 gap-2">

                  <div className="rounded-lg border border-white/[0.05] bg-black/10 p-3 text-center">

                    <p className="text-[9px] uppercase tracking-[0.14em] text-white/25">
                      Matched
                    </p>

                    <p className="mt-1 text-lg font-medium text-[#66a77a]">
                      {
                        wordMatch
                          .matched.length
                      }
                    </p>

                  </div>

                  <div className="rounded-lg border border-white/[0.05] bg-black/10 p-3 text-center">

                    <p className="text-[9px] uppercase tracking-[0.14em] text-white/25">
                      Missing
                    </p>

                    <p className="mt-1 text-lg font-medium text-[#c85d4b]">
                      {
                        wordMatch
                          .missing.length
                      }
                    </p>

                  </div>

                  <div className="rounded-lg border border-white/[0.05] bg-black/10 p-3 text-center">

                    <p className="text-[9px] uppercase tracking-[0.14em] text-white/25">
                      Extra
                    </p>

                    <p className="mt-1 text-lg font-medium text-[#e2b866]">
                      {
                        wordMatch
                          .extra.length
                      }
                    </p>

                  </div>

                </div>

              </div>

              {/* =============================================
                  COACH FEEDBACK
              ============================================= */}

              <div className="rounded-xl border border-white/[0.08] bg-[#111619] p-6">

                {/* REELA */}

                <div className="flex items-start gap-4">

                  <div className="relative">

                    <motion.div
                      animate={{
                        opacity: [
                          0.15,
                          0.35,
                          0.15,
                        ],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                      }}
                      className="absolute -inset-2 rounded-full bg-[#e2b866]/25 blur-lg"
                    />

                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#e2b866]/35 bg-[#15191b]">

                      <span className="font-display text-sm font-semibold text-[#e2b866]">
                        R
                      </span>

                    </div>

                  </div>

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="text-sm font-medium text-white">
                        Reela
                      </p>

                      <span className="rounded-sm bg-[#e2b866]/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.15em] text-[#e2b866]">
                        Coach Feedback
                      </span>

                    </div>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                      {
                        coachFeedback
                      }
                    </p>

                  </div>

                </div>

                {/* DIVIDER */}

                <div className="my-6 h-px bg-white/[0.06]" />

                {/* ===========================================
                    MISSING WORDS
                =========================================== */}

                <div>

                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                    Missing words
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {wordMatch
                      .missing
                      .length > 0 ? (
                      wordMatch.missing.map(
                        (
                          word,
                          index
                        ) => (
                          <motion.span
                            key={`missing-${word}-${index}`}
                            initial={{
                              opacity: 0,
                              scale:
                                0.9,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                            }}
                            transition={{
                              delay:
                                index *
                                0.04,
                            }}
                            className="rounded-full border border-[#c85d4b]/25 bg-[#c85d4b]/[0.06] px-3 py-1.5 text-xs text-[#d98170]"
                          >
                            {word}
                          </motion.span>
                        )
                      )
                    ) : (
                      <div className="flex items-center gap-2">

                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#66a77a]/15 text-[9px] text-[#66a77a]">
                          ✓
                        </span>

                        <span className="text-xs text-[#66a77a]">
                          None — great job.
                        </span>

                      </div>
                    )}

                  </div>

                  {practiceMode === "line" &&
                    wordMatch.missing.length > 0 &&
                    canPractiseAsSingleWord(wordMatch.missing[0]) && (
                      <button
                        type="button"
                        onClick={() => practiseWord(wordMatch.missing[0])}
                        className="mt-4 rounded-lg border border-[#e2b866]/35 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e2b866] transition hover:bg-[#e2b866]/10"
                      >
                        Practise “{wordMatch.missing[0]}”
                      </button>
                    )}

                  {practiceMode === "word" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {wordMatch.score === 100 ? (
                        <button
                          type="button"
                          onClick={returnToFullLine}
                          className="rounded-lg bg-[#66a77a] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#080b0d]"
                        >
                          Return to full line
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={clearTake}
                          className="rounded-lg border border-[#e2b866]/35 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e2b866]"
                        >
                          Try word again
                        </button>
                      )}

                      {focusedAttempts >= 2 && wordMatch.score < 100 && (
                        <button
                          type="button"
                          onClick={moveOnFromWord}
                          className="rounded-lg border border-white/15 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:border-white/30 hover:text-white"
                        >
                          Move on for now
                        </button>
                      )}
                    </div>
                  )}

                </div>

                {/* ===========================================
                    EXTRA WORDS
                =========================================== */}

                <div className="mt-6">

                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                    Extra words
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {wordMatch
                      .extra
                      .length > 0 ? (
                      wordMatch.extra.map(
                        (
                          word,
                          index
                        ) => (
                          <motion.span
                            key={`extra-${word}-${index}`}
                            initial={{
                              opacity: 0,
                              scale:
                                0.9,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                            }}
                            transition={{
                              delay:
                                index *
                                0.04,
                            }}
                            className="rounded-full border border-[#e2b866]/20 bg-[#e2b866]/[0.05] px-3 py-1.5 text-xs text-[#e2b866]/80"
                          >
                            {word}
                          </motion.span>
                        )
                      )
                    ) : (
                      <div className="flex items-center gap-2">

                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#66a77a]/15 text-[9px] text-[#66a77a]">
                          ✓
                        </span>

                        <span className="text-xs text-[#66a77a]">
                          None.
                        </span>

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </motion.section>
          )}

        {/* ===================================================
            LINE NAVIGATION
        =================================================== */}

        {wordMatch &&
          practiceMode === "line" &&
          !isTranscribing &&
          !transcriptionError && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-5"
            >
              {!isLastLine ? (
                <motion.button
                  type="button"
                  onClick={
                    goToNextLine
                  }
                  disabled={
                    isPlayingReference
                  }
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.99,
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#e2b866] px-6 py-4 text-sm font-semibold text-[#080b0d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next movie line

                  <span aria-hidden="true">
                    →
                  </span>
                </motion.button>
              ) : (
                <div className="rounded-xl border border-[#66a77a]/20 bg-[#66a77a]/[0.05] p-6 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#66a77a]">
                    Speaking Challenge Complete
                  </p>

                  <p className="mt-3 font-display text-3xl text-white">
                    {finalAverage}% average match
                  </p>

                  <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-white/40">
                    You completed all {totalLines} dialogue lines from {movieTitle}.
                  </p>

                  <motion.button
                    type="button"
                    onClick={finishSpeakingChallenge}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="mt-5 inline-flex items-center justify-center gap-3 rounded-xl bg-[#e2b866] px-7 py-3.5 text-sm font-semibold text-[#080b0d]"
                  >
                    Continue to results
                    <span aria-hidden="true">→</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

      </div>

    </section>
  );
}
