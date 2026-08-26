import { VocabItem } from "@/lib/types";

/*
 * Keyed by movie id. Falls back to the "default" set when a movie
 * has no dedicated list.
 *
 * The quiz draws five questions from this pool and builds the
 * wrong answers from the remaining entries, so the pool size is
 * what decides how repetitive the quiz feels. Every `example`
 * must contain its own phrase, because the quiz blanks the
 * phrase out of the example to make the question.
 */
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
      example: "I know it's tough right now, hang in there.",
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
    {
      id: "v6",
      phrase: "on the same page",
      meaning: "in agreement, understanding something the same way",
      example: "Before we start, I want to be sure we're on the same page.",
    },
    {
      id: "v7",
      phrase: "call it a day",
      meaning: "to stop working on something for now",
      example: "We've been at this for hours, let's call it a day.",
    },
    {
      id: "v8",
      phrase: "out of the blue",
      meaning: "suddenly and without warning",
      example: "She called me out of the blue after three years.",
    },
    {
      id: "v9",
      phrase: "break the ice",
      meaning: "to ease the tension when people first meet",
      example: "He told a bad joke to break the ice.",
    },
    {
      id: "v10",
      phrase: "cut to the chase",
      meaning: "to skip the details and get to the point",
      example: "Let's cut to the chase, what do you actually want?",
    },
    {
      id: "v11",
      phrase: "second thoughts",
      meaning: "doubts about a decision you already made",
      example: "I'm having second thoughts about the whole plan.",
    },
    {
      id: "v12",
      phrase: "keep an eye on",
      meaning: "to watch something carefully",
      example: "Could you keep an eye on my bag for a minute?",
    },
    {
      id: "v13",
      phrase: "the last straw",
      meaning: "the final problem that makes someone give up",
      example: "Missing the flight was the last straw for me.",
    },
    {
      id: "v14",
      phrase: "back to square one",
      meaning: "back to the beginning with no progress made",
      example: "The deal collapsed, so we're back to square one.",
    },
    {
      id: "v15",
      phrase: "in the long run",
      meaning: "over an extended period of time",
      example: "Buying the better one saves money in the long run.",
    },
    {
      id: "v16",
      phrase: "take it personally",
      meaning: "to feel insulted by something not aimed at you",
      example: "Don't take it personally, he's like that with everyone.",
    },
    {
      id: "v17",
      phrase: "put up with",
      meaning: "to tolerate something unpleasant",
      example: "I can't put up with this noise any longer.",
    },
    {
      id: "v18",
      phrase: "get the hang of it",
      meaning: "to learn how to do something with practice",
      example: "It's confusing at first, but you'll get the hang of it.",
    },
  ],
};

export function getVocabularyForMovie(movieId: string): VocabItem[] {
  return vocabularyByMovie[movieId] ?? vocabularyByMovie.default;
}
