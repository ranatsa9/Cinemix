import { Goal } from "@/lib/types";

export const goals: { id: Goal; label: string; description: string }[] = [
  {
    id: "listening",
    label: "Listening",
    description: "Train your ear for natural speech and accents.",
  },
  {
    id: "speaking",
    label: "Speaking",
    description: "Build fluency and confidence saying things out loud.",
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    description: "Pick up expressions and words people actually use.",
  },
  {
    id: "comprehension",
    label: "Comprehension",
    description: "Follow plot, tone, and meaning without subtitles.",
  },
];
