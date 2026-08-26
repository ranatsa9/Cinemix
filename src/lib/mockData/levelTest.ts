import {
  LevelTestChoiceQuestion,
  LevelTestListeningQuestion,
  LevelTestQuestion,
  LevelTestSpeakingQuestion,
  LevelTestWritingQuestion,
} from "@/lib/types";

/* =========================================================
   PLACEMENT TEST ITEM BANK

   The test is sectioned and adaptive rather than a fixed
   list, so it covers all four areas:

     1. Reading and grammar  - 6 items, adaptive 1..5
     2. Listening            - 3 items, adaptive 2..5
     3. Writing              - 1 free-text item
     4. Speaking             - 1 read-aloud item

   The reading and listening banks hold more items than any
   single sitting uses. The engine picks by difficulty: a
   correct answer moves the learner up a band, a wrong one
   moves them down. Two people therefore see different
   questions, which is the point.

   `difficulty` maps to CEFR roughly as:
     1 = A1   2 = A2   3 = B1   4 = B2   5 = C1
========================================================= */

/* ---------------------------------------------------------
   READING AND GRAMMAR
--------------------------------------------------------- */

export const readingBank: LevelTestChoiceQuestion[] = [
  /* ---- A1 ---- */
  {
    id: "r-a1-1",
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
    id: "r-a1-2",
    prompt: "Complete the sentence: \"There ___ two cinemas in my city.\"",
    choices: [
      { id: "a", text: "is" }, { id: "b", text: "are" },
      { id: "c", text: "be" }, { id: "d", text: "was" },
    ],
    correctId: "b", difficulty: 1, skill: "vocabulary",
  },
  {
    id: "r-a1-3",
    context: "Sara is at the ticket desk. She says: \"One ticket, please.\"",
    prompt: "Where is Sara?",
    choices: [
      { id: "a", text: "At a cinema" },
      { id: "b", text: "At a hospital" },
      { id: "c", text: "At school" },
      { id: "d", text: "At home" },
    ],
    correctId: "a", difficulty: 1, skill: "comprehension",
  },

  /* ---- A2 ---- */
  {
    id: "r-a2-1",
    context:
      "Omar arrived before the office opened. Because it was raining, he crossed the street and decided to wait in a cafe.",
    prompt: "Where is Omar waiting now?",
    choices: [
      { id: "a", text: "Inside the office" },
      { id: "b", text: "At home" },
      { id: "c", text: "In a cafe across the street" },
      { id: "d", text: "Outside in the rain" },
    ],
    correctId: "c", difficulty: 2, skill: "comprehension",
  },
  {
    id: "r-a2-2",
    prompt: "Complete the sentence: \"I have lived here ___ 2022.\"",
    choices: [
      { id: "a", text: "for" }, { id: "b", text: "since" },
      { id: "c", text: "during" }, { id: "d", text: "from" },
    ],
    correctId: "b", difficulty: 2, skill: "vocabulary",
  },
  {
    id: "r-a2-3",
    prompt: "Choose the best completion: \"The film was ___ long that I fell asleep.\"",
    choices: [
      { id: "a", text: "so" }, { id: "b", text: "such" },
      { id: "c", text: "very" }, { id: "d", text: "too much" },
    ],
    correctId: "a", difficulty: 2, skill: "vocabulary",
  },

  /* ---- B1 ---- */
  {
    id: "r-b1-1",
    context: "A: \"How was the interview?\" B: \"I've had better days.\"",
    prompt: "What does B imply?",
    choices: [
      { id: "a", text: "The interview went badly" },
      { id: "b", text: "The interview was postponed" },
      { id: "c", text: "It was B's best interview" },
      { id: "d", text: "B received the job immediately" },
    ],
    correctId: "a", difficulty: 3, skill: "comprehension",
  },
  {
    id: "r-b1-2",
    prompt:
      "Choose the best completion: \"If I had known about the traffic, I ___ earlier.\"",
    choices: [
      { id: "a", text: "would leave" }, { id: "b", text: "would have left" },
      { id: "c", text: "will have left" }, { id: "d", text: "had left" },
    ],
    correctId: "b", difficulty: 3, skill: "vocabulary",
  },
  {
    id: "r-b1-3",
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

  /* ---- B2 ---- */
  {
    id: "r-b2-1",
    prompt:
      "Choose the best completion: \"No sooner ___ the room than the lights went out.\"",
    choices: [
      { id: "a", text: "he entered" }, { id: "b", text: "had he entered" },
      { id: "c", text: "he had entered" }, { id: "d", text: "did he enter" },
    ],
    correctId: "b", difficulty: 4, skill: "vocabulary",
  },
  {
    id: "r-b2-2",
    context:
      "A: \"Should we tell her before the meeting?\" B: \"I'd rather she heard it from you than from the report.\"",
    prompt: "What does B want?",
    choices: [
      { id: "a", text: "For A to tell her personally" },
      { id: "b", text: "For nobody to tell her" },
      { id: "c", text: "For her to read the report first" },
      { id: "d", text: "To tell her himself after the meeting" },
    ],
    correctId: "a", difficulty: 4, skill: "conversational",
  },
  {
    id: "r-b2-3",
    context:
      "The proposal was rejected, ostensibly on cost grounds, although nobody on the committee had seen the budget.",
    prompt: "What does \"ostensibly\" signal here?",
    choices: [
      { id: "a", text: "The stated reason may not be the real one" },
      { id: "b", text: "The reason was proven beyond doubt" },
      { id: "c", text: "The committee agreed unanimously" },
      { id: "d", text: "The cost was unusually high" },
    ],
    correctId: "a", difficulty: 4, skill: "comprehension",
  },

  /* ---- C1 ---- */
  {
    id: "r-c1-1",
    prompt:
      "Choose the best completion: \"Were the evidence more conclusive, the committee ___ the proposal.\"",
    choices: [
      { id: "a", text: "would endorse" }, { id: "b", text: "will endorse" },
      { id: "c", text: "endorsed" }, { id: "d", text: "would have been endorsed" },
    ],
    correctId: "a", difficulty: 5, skill: "vocabulary",
  },
  {
    id: "r-c1-2",
    context:
      "A critic writes: \"The director's restraint is admirable, though at times the film mistakes ambiguity for depth.\"",
    prompt: "Which interpretation best captures the critic's position?",
    choices: [
      { id: "a", text: "The film is profound simply because it explains very little." },
      { id: "b", text: "The subtlety works, but some obscurity feels unearned." },
      { id: "c", text: "Every mystery should be explicitly resolved." },
      { id: "d", text: "The director lacks any sense of restraint." },
    ],
    correctId: "b", difficulty: 5, skill: "comprehension",
  },
  {
    id: "r-c1-3",
    context:
      "A: \"He presented the decision as inevitable.\" B: \"Convenient, considering he engineered the circumstances that made it so.\"",
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

/* ---------------------------------------------------------
   LISTENING

   The learner hears the line and never reads it.

   `audioText` is spoken by the Reela voice. `clipId` is an
   optional hook: when a real clip from the film is present
   on the speech backend it plays instead. Distractors are
   built to punish mishearing, not misreading, so they differ
   from the answer by sound rather than by meaning.
--------------------------------------------------------- */

export const listeningBank: LevelTestListeningQuestion[] = [
  /* ---- A1 ----
     A floor for the section. Without these, a learner who
     misses both A2 items gets pushed up into B1 audio,
     because the picker widens outwards when a band runs dry.
  ---- */
  {
    id: "l-a1-1",
    kind: "listening",
    prompt: "Listen, then choose what you heard.",
    audioText: "The film starts at eight.",
    choices: [
      { id: "a", text: "The film starts at eight." },
      { id: "b", text: "The film starts at night." },
      { id: "c", text: "The film stars a knight." },
      { id: "d", text: "The film start is late." },
    ],
    correctId: "a", difficulty: 1, skill: "listening",
  },
  {
    id: "l-a1-2",
    kind: "listening",
    prompt: "Listen. What does the speaker want?",
    audioText: "Can I have a glass of water, please?",
    choices: [
      { id: "a", text: "Water" },
      { id: "b", text: "The bill" },
      { id: "c", text: "A menu" },
      { id: "d", text: "A ticket" },
    ],
    correctId: "a", difficulty: 1, skill: "listening",
  },

  /* ---- A2 ---- */
  {
    id: "l-a2-1",
    kind: "listening",
    prompt: "Listen, then choose what you heard.",
    audioText: "I left my keys on the kitchen table this morning.",
    choices: [
      { id: "a", text: "I left my keys on the kitchen table this morning." },
      { id: "b", text: "I lift my keys on the chicken table this morning." },
      { id: "c", text: "I left my case on the kitchen table this evening." },
      { id: "d", text: "I felt my keys in the kitchen cabinet this morning." },
    ],
    correctId: "a", difficulty: 2, skill: "listening",
  },
  {
    id: "l-a2-2",
    kind: "listening",
    prompt: "Listen. What is the speaker asking for?",
    audioText: "Could you turn it down a little? I can't hear myself think.",
    choices: [
      { id: "a", text: "For the noise to be reduced" },
      { id: "b", text: "For the light to be switched off" },
      { id: "c", text: "For someone to repeat the question" },
      { id: "d", text: "For help finding something" },
    ],
    correctId: "a", difficulty: 2, skill: "listening",
  },

  /* ---- B1 ---- */
  {
    id: "l-b1-1",
    kind: "listening",
    prompt: "Listen, then choose what you heard.",
    audioText:
      "I'm not going to sit here and pretend everything is fine.",
    choices: [
      { id: "a", text: "I'm not going to sit here and pretend everything is fine." },
      { id: "b", text: "I'm not going to see here and defend everything I find." },
      { id: "c", text: "I am going to sit here until everything is fine." },
      { id: "d", text: "I'm not going to sit here and pretend everything is mine." },
    ],
    correctId: "a", difficulty: 3, skill: "listening",
  },
  {
    id: "l-b1-2",
    kind: "listening",
    prompt: "Listen. What is the speaker going to do?",
    audioText:
      "I was supposed to meet them at seven, but I think I'll cancel.",
    choices: [
      { id: "a", text: "Cancel the meeting" },
      { id: "b", text: "Arrive at seven as planned" },
      { id: "c", text: "Move the meeting to a later time" },
      { id: "d", text: "Ask someone else to go instead" },
    ],
    correctId: "a", difficulty: 3, skill: "listening",
  },

  /* ---- B2 ---- */
  {
    id: "l-b2-1",
    kind: "listening",
    prompt: "Listen. How does the speaker feel?",
    audioText:
      "Well, that went exactly the way I expected it to. Exactly.",
    choices: [
      { id: "a", text: "Genuinely pleased with the result" },
      { id: "b", text: "Sarcastic, it went badly" },
      { id: "c", text: "Confused about what happened" },
      { id: "d", text: "Asking the listener a question" },
    ],
    correctId: "b", difficulty: 4, skill: "listening",
  },
  {
    id: "l-b2-2",
    kind: "listening",
    prompt: "Listen. What is the speaker actually saying?",
    audioText:
      "I'm sure you had your reasons. I just wish I'd heard them from you first.",
    choices: [
      { id: "a", text: "They are hurt at being told by someone else" },
      { id: "b", text: "They fully agree with the decision" },
      { id: "c", text: "They did not understand the reasons given" },
      { id: "d", text: "They want the decision reversed" },
    ],
    correctId: "a", difficulty: 4, skill: "listening",
  },

  /* ---- C1 ---- */
  {
    id: "l-c1-1",
    kind: "listening",
    prompt: "Listen. What does the speaker imply about the plan?",
    audioText:
      "It's an interesting approach. Ambitious, certainly. We'd need to be very lucky.",
    choices: [
      { id: "a", text: "They think it will probably fail" },
      { id: "b", text: "They are enthusiastic and want to start" },
      { id: "c", text: "They have already tried it before" },
      { id: "d", text: "They think it is too cautious" },
    ],
    correctId: "a", difficulty: 5, skill: "listening",
  },
];

/* ---------------------------------------------------------
   WRITING
--------------------------------------------------------- */

export const writingBank: LevelTestWritingQuestion[] = [
  {
    id: "w-1",
    kind: "writing",
    context: "A friend asks why you liked the last film you watched.",
    prompt: "Write your reply in two or three full sentences.",
    minWords: 20,
    keywords: [
      "because", "film", "movie", "story", "character", "characters",
      "acting", "ending", "liked", "loved", "enjoyed", "watch", "watched",
      "scene", "director", "felt", "made me",
    ],
    difficulty: 3, skill: "writing",
  },
];

/* ---------------------------------------------------------
   SPEAKING
--------------------------------------------------------- */

export const speakingBank: LevelTestSpeakingQuestion[] = [
  {
    id: "s-1",
    kind: "speaking",
    context: "Read this line out loud, the way a character would say it.",
    prompt: "Press record and say the line.",
    targetText:
      "I have never been more certain about anything in my life.",
    difficulty: 3,
    skill: "speaking",
  },
];

/* ---------------------------------------------------------
   FLAT LIST

   Kept so anything that still imports a plain array keeps
   working. The scene itself uses the adaptive engine.
--------------------------------------------------------- */

export const levelTestQuestions: LevelTestQuestion[] = [
  ...readingBank,
  ...listeningBank,
  ...writingBank,
  ...speakingBank,
];
