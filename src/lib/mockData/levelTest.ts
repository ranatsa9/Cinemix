import { LevelTestQuestion } from "@/lib/types";

// Nine-question progressive placement test approved for the final experience:
// Q1–3 Beginner (A1–A2), Q4–6 Intermediate (B1–B2),
// Q7–9 Advanced (C1: complex grammar, nuance, and subtext).
export const levelTestQuestions: LevelTestQuestion[] = [
  {
    id: "q1",
    prompt: "Choose the correct sentence.",
    choices: [
      { id: "a", text: "She go to work every day." },
      { id: "b", text: "She goes to work every day." },
      { id: "c", text: "She going to work every day." },
      { id: "d", text: "She gone to work every day." },
    ],
    correctId: "b", difficulty: 1, skill: "vocabulary",
  },
  {
    id: "q2",
    context: "Omar arrived before the office opened. Because it was raining, he crossed the street and decided to wait in a café.",
    prompt: "Where is Omar waiting now?",
    choices: [
      { id: "a", text: "Inside the office" },
      { id: "b", text: "At home" },
      { id: "c", text: "In a café across the street" },
      { id: "d", text: "Outside in the rain" },
    ],
    correctId: "c", difficulty: 2, skill: "comprehension",
  },
  {
    id: "q3",
    prompt: "Complete the sentence: \"I have lived here ___ 2022.\"",
    choices: [
      { id: "a", text: "for" }, { id: "b", text: "since" },
      { id: "c", text: "during" }, { id: "d", text: "from" },
    ],
    correctId: "b", difficulty: 2, skill: "vocabulary",
  },
  {
    id: "q4",
    context: "A: \"How was the interview?\" B: \"I’ve had better days.\"",
    prompt: "What does B imply?",
    choices: [
      { id: "a", text: "The interview went badly" },
      { id: "b", text: "The interview was postponed" },
      { id: "c", text: "It was B’s best interview" },
      { id: "d", text: "B received the job immediately" },
    ],
    correctId: "a", difficulty: 3, skill: "comprehension",
  },
  {
    id: "q5",
    prompt: "Choose the best completion: \"If I had known about the traffic, I ___ earlier.\"",
    choices: [
      { id: "a", text: "would leave" }, { id: "b", text: "would have left" },
      { id: "c", text: "will have left" }, { id: "d", text: "had left" },
    ],
    correctId: "b", difficulty: 3, skill: "vocabulary",
  },
  {
    id: "q6",
    context: "A: \"Did Maya admit she broke it?\" B: \"She danced around the subject.\"",
    prompt: "What did Maya do?",
    choices: [
      { id: "a", text: "She celebrated before answering" },
      { id: "b", text: "She avoided answering directly" },
      { id: "c", text: "She denied being present" },
      { id: "d", text: "She explained everything clearly" },
    ],
    correctId: "b", difficulty: 3, skill: "conversational",
  },
  {
    id: "q7",
    prompt: "Choose the best completion: \"Were the evidence more conclusive, the committee ___ the proposal.\"",
    choices: [
      { id: "a", text: "would endorse" }, { id: "b", text: "will endorse" },
      { id: "c", text: "endorsed" }, { id: "d", text: "would have been endorsed" },
    ],
    correctId: "a", difficulty: 5, skill: "vocabulary",
  },
  {
    id: "q8",
    context: "A critic writes: \"The director’s restraint is admirable, though at times the film mistakes ambiguity for depth.\"",
    prompt: "Which interpretation best captures the critic’s position?",
    choices: [
      { id: "a", text: "The film is profound simply because it explains very little." },
      { id: "b", text: "The subtlety works, but some obscurity feels unearned." },
      { id: "c", text: "Every mystery should be explicitly resolved." },
      { id: "d", text: "The director lacks any sense of restraint." },
    ],
    correctId: "b", difficulty: 5, skill: "comprehension",
  },
  {
    id: "q9",
    context: "A: \"He presented the decision as inevitable.\" B: \"Convenient, considering he engineered the circumstances that made it so.\"",
    prompt: "What is B suggesting?",
    choices: [
      { id: "a", text: "He accurately predicted an unavoidable outcome." },
      { id: "b", text: "He accepted circumstances beyond his control." },
      { id: "c", text: "He created the conditions, then denied responsibility for the result." },
      { id: "d", text: "He did not know how the decision had been made." },
    ],
    correctId: "c", difficulty: 5, skill: "conversational",
  },
];
