import { getMovieClip, speakWithReela } from "@/lib/api";

/* =========================================================
   LINE PLAYBACK

   Three tiers, tried in order:

     1. A registered, project-owned dialogue clip.
     2. The Reela TTS voice.
     3. The browser's own speech synthesis.

   Tier 3 exists so a listening question never dies on stage
   because a backend is cold or the network is unhappy.
========================================================= */

export type PlaybackSource = "clip" | "tts" | "browser";

export type PlaybackHandle = {
  source: PlaybackSource;
  stop: () => void;
  finished: Promise<void>;
};

function playBlob(blob: Blob): Promise<PlaybackHandle> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    let finish = () => {};
    const finished = new Promise<void>((done) => {
      finish = done;
    });
    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      URL.revokeObjectURL(url);
      finish();
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
          finished,
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
  let finish = () => {};
  const finished = new Promise<void>((done) => {
    finish = done;
  });

  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.onend = () => finish();
  utterance.onerror = () => finish();

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return {
    source: "browser",
    finished,
    stop: () => {
      window.speechSynthesis.cancel();
      finish();
    },
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
