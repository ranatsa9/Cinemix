import { SpeakingAnalysisResult } from "@/lib/types";

/**
 * Mock implementation. A real backend will replace this with something
 * like POST /api/analyze-speaking, fed the recorded audio/video blob.
 */
export async function analyzeSpeaking(
  durationSeconds: number
): Promise<SpeakingAnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 2200));

  const base = Math.min(96, 62 + durationSeconds * 1.1);
  const jitter = () => Math.round(base + (Math.random() * 16 - 8));

  const pronunciation = clamp(jitter());
  const fluency = clamp(jitter() - 4);
  const pace = clamp(jitter() + 2);
  const relevance = clamp(jitter() + 6);
  const overall = clamp(
    Math.round(pronunciation * 0.3 + fluency * 0.3 + pace * 0.2 + relevance * 0.2)
  );

  const feedback = buildFeedback({ pronunciation, fluency, pace, relevance });

  return { overall, pronunciation, fluency, pace, relevance, feedback };
}

function clamp(n: number): number {
  return Math.max(40, Math.min(99, n));
}

function buildFeedback(scores: {
  pronunciation: number;
  fluency: number;
  pace: number;
  relevance: number;
}): string[] {
  const notes: string[] = [];

  notes.push(
    scores.pronunciation >= 80
      ? "You spoke clearly and used good vocabulary."
      : "Focus on enunciating key words a little more clearly."
  );

  notes.push(
    scores.fluency >= 78
      ? "Your ideas flowed naturally from one to the next."
      : "Try reducing long pauses to improve fluency."
  );

  notes.push(
    scores.relevance >= 85
      ? "Your answer stayed right on topic — great comprehension."
      : "Try connecting your answer more directly to the question."
  );

  return notes;
}
