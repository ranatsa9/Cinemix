import { QuizQuestion, SpeakingPrompt } from "@/lib/types";

export const quizByMovie: Record<string, QuizQuestion[]> = {
  default: [
    {
      id: "qz1",
      prompt: "What did the phrase \"figure it out\" mean in the movie?",
      choices: [
        { id: "a", text: "To give up" },
        { id: "b", text: "To solve or understand something" },
        { id: "c", text: "To celebrate" },
        { id: "d", text: "To ask for help loudly" },
      ],
      correctId: "b",
    },
    {
      id: "qz2",
      prompt: "Which best describes the main character's goal?",
      choices: [
        { id: "a", text: "To avoid change" },
        { id: "b", text: "To prove someone wrong" },
        { id: "c", text: "To find their place and be understood" },
        { id: "d", text: "To win a competition" },
      ],
      correctId: "c",
    },
    {
      id: "qz3",
      prompt: "What tone did most of the dialogue have?",
      choices: [
        { id: "a", text: "Formal and distant" },
        { id: "b", text: "Warm and conversational" },
        { id: "c", text: "Aggressive and cold" },
        { id: "d", text: "Robotic and scripted" },
      ],
      correctId: "b",
    },
  ],
};

export const speakingPromptsByMovie: Record<string, SpeakingPrompt[]> = {
  default: [
    { id: "sp1", prompt: "What was your favorite moment in the movie, and why?" },
    { id: "sp2", prompt: "Describe one character you found interesting." },
    { id: "sp3", prompt: "What do you think happens after the ending?" },
  ],
};

export function getQuizForMovie(movieId: string): QuizQuestion[] {
  return quizByMovie[movieId] ?? quizByMovie.default;
}

export function getSpeakingPromptForMovie(movieId: string): SpeakingPrompt {
  const prompts = speakingPromptsByMovie[movieId] ?? speakingPromptsByMovie.default;
  return prompts[Math.floor(Math.random() * prompts.length)];
}
