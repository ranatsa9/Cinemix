import { LevelTestQuestion } from "@/lib/types";

// Ordered roughly easy -> hard. Difficulty drives the level estimate,
// not just correctness, so two people with the same score can land
// on different levels depending on which questions they got right.
//
// Q1-3: vocabulary & grammar · Q4-5: dialogue/reading comprehension
// Q6-7: conversational comprehension (idioms/contractions, text-only)
// Q8-9: natural conversational response (text-only)
export const levelTestQuestions: LevelTestQuestion[] = [
  {
    id: "q1",
    prompt: "Which word means the opposite of \"begin\"?",
    choices: [
      { id: "a", text: "Start" },
      { id: "b", text: "Finish" },
      { id: "c", text: "Continue" },
      { id: "d", text: "Open" },
    ],
    correctId: "b",
    difficulty: 1,
    skill: "vocabulary",
  },
  {
    id: "q2",
    prompt: "Choose the grammatically correct sentence.",
    choices: [
      { id: "a", text: "She don't like coffee." },
      { id: "b", text: "She doesn't likes coffee." },
      { id: "c", text: "She doesn't like coffee." },
      { id: "d", text: "She not like coffee." },
    ],
    correctId: "c",
    difficulty: 2,
    skill: "vocabulary",
  },
  {
    id: "q3",
    prompt:
      "Which word best fits: \"He was so ___ after the long flight that he fell asleep instantly.\"",
    choices: [
      { id: "a", text: "exhausted" },
      { id: "b", text: "excited" },
      { id: "c", text: "curious" },
      { id: "d", text: "confused" },
    ],
    correctId: "a",
    difficulty: 3,
    skill: "vocabulary",
  },
  {
    id: "q4",
    context: "A: \"Can you keep an eye on my bag for a sec?\" B: \"Sure, no problem.\"",
    prompt: "What is A asking B to do?",
    choices: [
      { id: "a", text: "Watch the bag briefly" },
      { id: "b", text: "Carry the bag home" },
      { id: "c", text: "Open the bag" },
      { id: "d", text: "Throw the bag away" },
    ],
    correctId: "a",
    difficulty: 2,
    skill: "comprehension",
  },
  {
    id: "q5",
    context: "A: \"How was the interview?\" B: \"Honestly? I've had better days.\"",
    prompt: "What does B mean?",
    choices: [
      { id: "a", text: "The interview went very well" },
      { id: "b", text: "The interview didn't go well" },
      { id: "c", text: "B forgot about the interview" },
      { id: "d", text: "B is excited about the results" },
    ],
    correctId: "b",
    difficulty: 3,
    skill: "comprehension",
  },
  {
    id: "q6",
    context: "\"I'm starving, let's grab a bite before the movie.\"",
    prompt: "What does the speaker want to do?",
    choices: [
      { id: "a", text: "Eat something" },
      { id: "b", text: "Watch the movie immediately" },
      { id: "c", text: "Go home early" },
      { id: "d", text: "Buy movie tickets" },
    ],
    correctId: "a",
    difficulty: 3,
    skill: "conversational",
  },
  {
    id: "q7",
    context: "\"He talked his way out of the ticket.\"",
    prompt: "What happened?",
    choices: [
      { id: "a", text: "He argued and avoided the punishment" },
      { id: "b", text: "He paid the ticket immediately" },
      { id: "c", text: "He lost the argument" },
      { id: "d", text: "He didn't say anything" },
    ],
    correctId: "a",
    difficulty: 4,
    skill: "conversational",
  },
  {
    id: "q8",
    prompt:
      "Someone says: \"Do you mind if I sit here?\" What is the most natural response?",
    choices: [
      { id: "a", text: "\"Yes, I do.\"" },
      { id: "b", text: "\"Not at all, go ahead.\"" },
      { id: "c", text: "\"I don't sit here.\"" },
      { id: "d", text: "\"You are here.\"" },
    ],
    correctId: "b",
    difficulty: 4,
    skill: "conversational",
  },
  {
    id: "q9",
    prompt:
      "Someone says: \"Sorry I'm late, traffic was crazy.\" What is the most natural response?",
    choices: [
      { id: "a", text: "\"No worries, I just got here myself.\"" },
      { id: "b", text: "\"You are wrong.\"" },
      { id: "c", text: "\"I don't care about traffic.\"" },
      { id: "d", text: "\"Late is bad.\"" },
    ],
    correctId: "a",
    difficulty: 5,
    skill: "conversational",
  },
];
