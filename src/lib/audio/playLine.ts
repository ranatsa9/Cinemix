import { getMovieClip, speakWithReela } from "@/lib/api";

/* =========================================================
   LINE PLAYBACK

   Three tiers, tried in order:

     1. The real clip from the film.
     2. The Reela TTS voice.
     3. The browser's own speech synthesis.

   Tier 3 exists so a listening question never dies on stage
   because a backend is cold or the network is unhappy.
========================================================= */

export type PlaybackSource = "clip" | "tts" | "browser";

export type PlaybackHandle = {
  source: PlaybackSource;
  stop: () => void;
};

function playBlob(blob: Blob): Promise<PlaybackHandle> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    audio.onended = cleanup;

    audio.onerror = () => {
      cleanup();
      reject(new Error("Audio failed to play"));
    };

    audio
      .play()
      .then(() =>
        resolve({
          source: "clip",
          stop: () => {
            audio.pause();
            cleanup();
          },
        })
      )
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}

function playWithBrowser(text: string): PlaybackHandle {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    throw new Error("Speech synthesis is unavailable");
  }

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 0.95;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return {
    source: "browser",
    stop: () => window.speechSynthesis.cancel(),
  };
}

export async function playLine(
  text: string,
  clipId?: string
): Promise<PlaybackHandle> {
  if (clipId) {
    try {
      const blob = await getMovieClip(clipId);
      const handle = await playBlob(blob);

      return { ...handle, source: "clip" };
    } catch {
      // No clip for this line yet. Fall through.
    }
  }

  try {
    const blob = await speakWithReela(text);
    const handle = await playBlob(blob);

    return { ...handle, source: "tts" };
  } catch {
    // Speech backend is not reachable. Fall through.
  }

  return playWithBrowser(text);
}
