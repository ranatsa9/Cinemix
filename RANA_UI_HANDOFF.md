# Rana's speaking UI integration

## What was integrated

The speaking page now preserves Rana's learner flow inside Sumaya's design:

1. The learner listens to a line from the recommended movie.
2. Camera and microphone recording begin together.
3. The existing computer-vision module displays face and mouth participation.
4. Whisper returns a transcript and the page calculates recognized-word match.
5. When a word is missing, the learner can practise that word alone.
6. After three unsuccessful focused attempts, the learner may move on and revisit it later.
7. The learner returns to the complete line before continuing to the next line.

## Deliberately unchanged

- `src/lib/vision/reelVision.ts`
- All adaptive-learning logic and contracts
- Recommendation logic
- Backend scoring

## UI files changed

- `src/components/scenes/SpeakingScene.tsx`
- `src/app/layout.tsx` (frontend type fix only)
- `src/components/shell/ChapterProgress.tsx` (missing scene progress entry only)

No `.env`, API key, build cache, or dependency folder is included in this handoff.
