import { movies } from "@/lib/mockData/movies";
import { GenreId, Goal, Level, Movie, MatchTrait, RecommendationResult } from "@/lib/types";

export interface RecommendInput {
  level: Level;
  goal: Goal;
  genreIds: GenreId[];
  selectedMovieIds: string[];
}

export interface FunnelStage {
  count: number;
  label: string;
  movieIds: string[];
}

export interface FunnelResult {
  stages: FunnelStage[];
  result: RecommendationResult;
}

function levelDistance(level: Level, fit: Level[]): number {
  const order: Level[] = ["beginner", "intermediate", "advanced"];
  const li = order.indexOf(level);
  const best = Math.min(...fit.map((f) => Math.abs(order.indexOf(f) - li)));
  return best;
}

function scoreMovie(movie: Movie, input: RecommendInput): number {
  const genreOverlap = movie.genres.filter((g) =>
    input.genreIds.includes(g)
  ).length;

  const selectedMovies = movies.filter((m) =>
    input.selectedMovieIds.includes(m.id)
  );
  const tasteGenreSet = new Set(selectedMovies.flatMap((m) => m.genres));
  const tasteOverlap = movie.genres.filter((g) => tasteGenreSet.has(g)).length;

  const levelScore = 6 - levelDistance(input.level, movie.levelFit) * 3;

  let goalScore = 0;
  if (input.goal === "listening") goalScore = movie.pace <= 3 ? 3 : 1;
  if (input.goal === "speaking") goalScore = 5 - movie.dialogueComplexity;
  if (input.goal === "vocabulary") goalScore = movie.dialogueComplexity;
  if (input.goal === "comprehension")
    goalScore = 5 - Math.abs(movie.dialogueComplexity - 3);

  return genreOverlap * 3 + tasteOverlap * 4 + levelScore * 2 + goalScore;
}

const STAGE_PLAN: { count: number; label: string }[] = [
  { count: 14, label: "" },
  { count: 10, label: "Analyzing your taste..." },
  { count: 7, label: "Matching your English level..." },
  { count: 5, label: "Analyzing dialogue complexity..." },
  { count: 3, label: "Considering your learning goal..." },
  { count: 1, label: "Finding the strongest match..." },
];

export async function buildRecommendationFunnel(
  input: RecommendInput
): Promise<FunnelResult> {
  const ranked = [...movies].sort(
    (a, b) => scoreMovie(b, input) - scoreMovie(a, input)
  );

  const stages: FunnelStage[] = STAGE_PLAN.map((stage) => ({
    count: stage.count,
    label: stage.label,
    movieIds: ranked.slice(0, stage.count).map((m) => m.id),
  }));

  const winner = ranked[0];
  const topScore = scoreMovie(winner, input);
  const maxTheoretical = 3 + 4 + 6 * 2 + 3 + 5; // rough ceiling for normalization
  const matchPercent = Math.min(
    98,
    Math.max(84, Math.round((topScore / maxTheoretical) * 100))
  );

  const traits: MatchTrait[] = buildTraits(winner, input);

  const result: RecommendationResult = {
    movie: winner,
    matchPercent,
    traits,
    reason: buildReason(winner, input),
  };

  return { stages, result };
}

function buildTraits(movie: Movie, input: RecommendInput): MatchTrait[] {
  const levelLabel =
    input.level === "beginner"
      ? "Beginner Friendly"
      : input.level === "intermediate"
      ? "Intermediate English"
      : "Advanced Dialogue";

  const dialogueLabel =
    movie.dialogueComplexity <= 2
      ? "Clear Dialogue"
      : movie.dialogueComplexity <= 3
      ? "Natural Dialogue"
      : "Rich, Layered Dialogue";

  const vocabLabel =
    movie.dialogueComplexity <= 2 ? "Everyday Vocabulary" : "Expressive Vocabulary";

  const paceLabel =
    movie.pace <= 2
      ? "Relaxed Speaking Speed"
      : movie.pace <= 3
      ? "Moderate Speaking Speed"
      : "Fast-Paced Dialogue";

  return [
    { label: levelLabel },
    { label: dialogueLabel },
    { label: vocabLabel },
    { label: paceLabel },
  ];
}

function buildReason(movie: Movie, input: RecommendInput): string {
  const goalPhrase: Record<Goal, string> = {
    listening: "trains your ear with dialogue paced just right for you",
    speaking: "gives you natural phrasing worth repeating out loud",
    vocabulary: "introduces expressions you'll actually use",
    comprehension: "keeps its story clear without losing you",
  };

  return `It matches your taste while ${goalPhrase[input.goal]} — enough challenge to grow, not enough to lose the story.`;
}
