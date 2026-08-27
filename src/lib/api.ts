/* =========================================================
   API URLS
========================================================= */

/*
 * Main Cinemix AI FastAPI backend
 *
 * Swagger:
 * http://127.0.0.1:8000/docs
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/*
 * Speech / Whisper / Reela backend
 *
 * We keep it separate because FastAPI already uses port 8000.
 * Later we will run Speech_TTS_Backend.py on port 8001.
 */
const SPEECH_API_URL =
  process.env.NEXT_PUBLIC_SPEECH_API_URL ||
  "http://127.0.0.1:8001";


/* =========================================================
   HEALTH
========================================================= */

export async function checkBackendHealth() {
  const response = await fetch(
    `${API_URL}/health`
  );

  if (!response.ok) {
    throw new Error(
      "Backend is not responding"
    );
  }

  return response.json();
}


/* =========================================================
   USERS
========================================================= */

export type CreateUserPayload = {
  english_level: string;
  learning_goal: string;
  favorite_genre: string;
};

export async function createUser(
  data: CreateUserPayload
) {
  const response = await fetch(
    `${API_URL}/users`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to save user"
    );
  }

  return response.json();
}


export async function getUsers() {
  const response = await fetch(
    `${API_URL}/users`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load users"
    );
  }

  return response.json();
}


/* =========================================================
   REAL MOVIE CATALOGUE
========================================================= */

export type CatalogueMovieItem = {
  movie_id: number;

  title: string;

  year: number | null;

  genres: string[];

  poster_url: string;

  overview: string;

  runtime: number | null;

  popularity: number;

  vote_average: number;
};


export type MoviesResponse = {
  count: number;

  movies: CatalogueMovieItem[];
};


export async function getMovies(
  genre?: string,
  limit = 40
): Promise<MoviesResponse> {
  const params =
    new URLSearchParams();

  if (genre) {
    params.set(
      "genre",
      genre
    );
  }

  params.set(
    "limit",
    String(limit)
  );

  const response = await fetch(
    `${API_URL}/movies?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load movies"
    );
  }

  return response.json();
}


/* =========================================================
   RECOMMENDATION
========================================================= */

export type RecommendationItem = {
  movie_id: number;

  title: string;

  hybrid_score: number;

  quality_score: number;

  language_fit_score: number;

  learning_value_score: number;

  taste_match_score: number;

  poster_url: string;

  recommendation_reason: string;
};


export type RecommendationResponse = {
  recommendations:
    RecommendationItem[];
};


export type RecommendationPayload = {
  english_level: string;

  learning_goal: string;

  genres: string[];

  favorite_movies: string[];
};


export async function getRecommendation(
  data: RecommendationPayload
): Promise<RecommendationResponse> {
  const response = await fetch(
    `${API_URL}/recommend`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to get recommendation"
    );
  }

  return response.json();
}


/* =========================================================
   ADAPTIVE QUIZ / ACTIVITY

   Swagger:
   GET /adaptive/activity/{movie_id}
========================================================= */

export type AdaptiveQuizItem = {
  correct_word: string;

  options: string[];

  context?: string;

  source?: string;
};


export type AdaptiveActivityResponse = {
  movie_id?: number;

  quiz: AdaptiveQuizItem[];
};


export async function getAdaptiveActivity(
  movieId: number
): Promise<AdaptiveActivityResponse> {
  const response = await fetch(
    `${API_URL}/adaptive/activity/${movieId}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load adaptive activity"
    );
  }

  return response.json();
}


/* =========================================================
   ADAPTIVE VOCABULARY

   Swagger:
   GET /adaptive/vocabulary/{movie_id}
========================================================= */

export type AdaptiveVocabularyItem = {
  correct_word: string;

  options: string[];

  context?: string;

  meaning?: string;

  source?: string;
};


export type AdaptiveVocabularyResponse = {
  movie_id?: number;

  vocabulary:
    AdaptiveVocabularyItem[];
};


export async function getAdaptiveVocabulary(
  movieId: number
): Promise<AdaptiveVocabularyResponse> {
  const response = await fetch(
    `${API_URL}/adaptive/vocabulary/${movieId}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load adaptive vocabulary"
    );
  }

  return response.json();
}


/* =========================================================
   QUIZ
========================================================= */

export type QuizAnswerPayload = {
  question_id: number;

  selected_answer: string;

  correct_answer: string;
};


export type SubmitQuizPayload = {
  movie_id: number;

  answers:
    QuizAnswerPayload[];
};


export async function submitQuiz(
  data: SubmitQuizPayload
) {
  const response = await fetch(
    `${API_URL}/quiz`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to submit quiz"
    );
  }

  return response.json();
}


/* =========================================================
   SPEAKING ANALYSIS
   Main FastAPI backend
========================================================= */

export type SpeakingPayload = {
  movie_id: number;

  transcript: string;
};


export async function analyzeSpeaking(
  data: SpeakingPayload
) {
  const response = await fetch(
    `${API_URL}/speaking`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to analyze speaking"
    );
  }

  return response.json();
}


/* =========================================================
   WHISPER TRANSCRIPTION
   Separate Speech backend
========================================================= */

export type TranscriptionResponse = {
  transcript: string;

  language: string;

  languageProbability: number;

  speechDurationSeconds: number;

  model: string;
};


export async function transcribeAudio(
  audioBlob: Blob,
  expectedText?: string,
  exerciseMode: "line" | "word" = "line"
): Promise<TranscriptionResponse> {
  const response = await fetch(
    `${SPEECH_API_URL}/api/transcribe`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          audioBlob.type ||
          "audio/webm",

        ...(expectedText
          ? {
              "X-Expected-Text":
                expectedText,
            }
          : {}),

        "X-Exercise-Mode":
          exerciseMode,
      },

      body: audioBlob,
    }
  );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.error ||
        "Failed to transcribe audio"
    );
  }

  return response.json();
}


/* =========================================================
   REELA TEXT TO SPEECH
   Separate Speech backend
========================================================= */

export async function speakWithReela(
  text: string
): Promise<Blob> {
  const response = await fetch(
    `${SPEECH_API_URL}/api/speak`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        text,
      }),
    }
  );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.error ||
        "Reela could not generate audio"
    );
  }

  return response.blob();
}


/* =========================================================
   SPEAKING PRACTICE LINES
   Separate Speech backend

   GET /api/lines?movieId=...
========================================================= */

export type PracticeLine = {
  lineId: string;
  text: string;
  level: string;
  qualityScore: number | null;
  clipAvailable: boolean;
  clipId: string | null;
};

export type PracticeLinesResponse = {
  movie: {
    movieId: string;
    imdbId: string;
    title: string;
    year: number | string;
    genre: string;
  };

  lines: PracticeLine[];
};

export async function getPracticeLines(
  movieId: string | number
): Promise<PracticeLinesResponse> {
  const response = await fetch(
    `${SPEECH_API_URL}/api/lines?movieId=${encodeURIComponent(
      String(movieId)
    )}`
  );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.error ||
        "Failed to load movie speaking lines"
    );
  }

  return response.json();
}


/* =========================================================
   ADAPTIVE LEARNING UPDATE

   Swagger:
   POST /adaptive/update
========================================================= */

export type AdaptiveUpdateResponse = {
  activity_score: number;

  level_before: string;

  level_after: string;

  next_recommendations:
    unknown[];

  profile: unknown;
};


export type AdaptiveUpdatePayload = {
  user_id: string;

  movie_id: number;

  activity_mode:
    | "quiz"
    | "speaking";

  activity?: {
    quiz: {
      correct_word: string;
    }[];
  } | null;

  quiz_answers?:
    string[] | null;

  attempt_result?:
    Record<
      string,
      unknown
    > | null;

  enjoyment_rating?:
    number | null;
};


export async function updateAdaptiveLearning(
  data: AdaptiveUpdatePayload
): Promise<AdaptiveUpdateResponse> {
  const response = await fetch(
    `${API_URL}/adaptive/update`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
        error?.error ||
        "Failed to update adaptive learning"
    );
  }

  return response.json();
}


/* =========================================================
   MOVIE AUDIO CLIPS

   Real spoken excerpts from the films, served by the speech
   backend. Used by the listening question in the placement
   test and by the reference player in speaking practice.
   Falls back to TTS when a clip is not available.
========================================================= */

export type MovieClip = {
  clipId: string;
  movieId: string;
  movieTitle: string;
  text: string;
  file: string;
  seconds?: number;
};

export async function listMovieClips(): Promise<{
  count: number;
  clips: MovieClip[];
}> {
  const response = await fetch(
    `${SPEECH_API_URL}/api/clips`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load movie clips"
    );
  }

  return response.json();
}

export async function getMovieClip(
  clipId: string
): Promise<Blob> {
  const response = await fetch(
    `${SPEECH_API_URL}/api/clip?clipId=${encodeURIComponent(
      clipId
    )}`
  );

  if (!response.ok) {
    throw new Error(
      "No movie clip for this line"
    );
  }

  return response.blob();
}
