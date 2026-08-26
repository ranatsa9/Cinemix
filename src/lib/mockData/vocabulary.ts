import { VocabItem } from "@/lib/types";

// Keyed by movie id. Falls back to the "default" set if a movie has
// no dedicated list yet.
export const vocabularyByMovie: Record<string, VocabItem[]> = {
  default: [
    {
      id: "v1",
      phrase: "figure it out",
      meaning: "to understand or solve something",
      example: "Give me a second, I'll figure it out.",
    },
    {
      id: "v2",
      phrase: "give it a shot",
      meaning: "to try something",
      example: "You've never done this before? Just give it a shot.",
    },
    {
      id: "v3",
      phrase: "hang in there",
      meaning: "to stay patient during a difficult time",
      example: "I know it's tough right now — hang in there.",
    },
    {
      id: "v4",
      phrase: "catch someone off guard",
      meaning: "to surprise someone when they're not expecting it",
      example: "Her question really caught him off guard.",
    },
    {
      id: "v5",
      phrase: "make a scene",
      meaning: "to cause a public, embarrassing disturbance",
      example: "Please don't make a scene, everyone's watching.",
    },
  ],
};

export function getVocabularyForMovie(movieId: string): VocabItem[] {
  return vocabularyByMovie[movieId] ?? vocabularyByMovie.default;
}
