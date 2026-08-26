import { LevelTestQuestion } from "@/lib/types";

// A clear progression: 3 foundation, 3 intermediate, then 3 advanced items.
export const levelTestQuestions: LevelTestQuestion[] = [
  {
    id: "q1", prompt: "Which word means the opposite of \"begin\"?",
    choices: [{ id: "a", text: "Start" }, { id: "b", text: "Finish" }, { id: "c", text: "Continue" }, { id: "d", text: "Open" }],
    correctId: "b", difficulty: 1, skill: "vocabulary",
  },
  {
    id: "q2", prompt: "Choose the grammatically correct sentence.",
    choices: [{ id: "a", text: "She don't like coffee." }, { id: "b", text: "She doesn't likes coffee." }, { id: "c", text: "She doesn't like coffee." }, { id: "d", text: "She not like coffee." }],
    correctId: "c", difficulty: 1, skill: "vocabulary",
  },
  {
    id: "q3", prompt: "Which word best completes the sentence: \"He was so ___ after the long flight that he fell asleep instantly.\"",
    choices: [{ id: "a", text: "exhausted" }, { id: "b", text: "curious" }, { id: "c", text: "patient" }, { id: "d", text: "ordinary" }],
    correctId: "a", difficulty: 2, skill: "vocabulary",
  },
  {
    id: "q4", context: "A: \"Can you keep an eye on my bag for a second?\" B: \"Sure.\"", prompt: "What is A asking B to do?",
    choices: [{ id: "a", text: "Watch the bag briefly" }, { id: "b", text: "Carry the bag home" }, { id: "c", text: "Look inside the bag" }, { id: "d", text: "Move the bag elsewhere" }],
    correctId: "a", difficulty: 3, skill: "comprehension",
  },
  {
    id: "q5", context: "A: \"How was the interview?\" B: \"Honestly? I've had better days.\"", prompt: "What does B imply?",
    choices: [{ id: "a", text: "The interview went extremely well" }, { id: "b", text: "The interview probably did not go well" }, { id: "c", text: "The interview was moved to another day" }, { id: "d", text: "B has not attended the interview yet" }],
    correctId: "b", difficulty: 3, skill: "comprehension",
  },
  {
    id: "q6", context: "\"Had I known the film was three hours long, I would have chosen another one.\"", prompt: "Which interpretation is correct?",
    choices: [{ id: "a", text: "The speaker knew the length and chose it anyway" }, { id: "b", text: "The speaker has not chosen a film yet" }, { id: "c", text: "The speaker did not know the length and now regrets the choice" }, { id: "d", text: "The speaker prefers films longer than three hours" }],
    correctId: "c", difficulty: 3, skill: "conversational",
  },
  {
    id: "q7", context: "\"Her apology was less an admission of fault than an attempt to forestall further criticism.\"", prompt: "What does the sentence imply?",
    choices: [{ id: "a", text: "She fully accepted responsibility for the mistake" }, { id: "b", text: "Her apology was mainly strategic, intended to prevent more criticism" }, { id: "c", text: "She apologized because the criticism had already stopped" }, { id: "d", text: "Her apology made the criticism more severe" }],
    correctId: "b", difficulty: 5, skill: "comprehension",
  },
  {
    id: "q8", context: "\"Only after the credits rolled did he realize the narrator had been unreliable.\"", prompt: "Which interpretation is most accurate?",
    choices: [{ id: "a", text: "He distrusted the narrator from the beginning" }, { id: "b", text: "The credits revealed who the narrator was" }, { id: "c", text: "He realized the narrator's unreliability only when the film had ended" }, { id: "d", text: "He never questioned the narrator's version of events" }],
    correctId: "c", difficulty: 5, skill: "comprehension",
  },
  {
    id: "q9", context: "\"I wouldn't say the proposal is without merit; I merely question whether its virtues survive contact with reality.\"", prompt: "What is the speaker's position?",
    choices: [{ id: "a", text: "The proposal is entirely worthless" }, { id: "b", text: "The proposal is already proven to work" }, { id: "c", text: "The proposal has theoretical value but may be impractical" }, { id: "d", text: "The proposal should be accepted without changes" }],
    correctId: "c", difficulty: 5, skill: "conversational",
  },
];
