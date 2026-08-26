import { RecommendationItem } from "@/lib/api";
import { MatchTrait, RecommendationResult } from "@/lib/types";
import { formatMovieTitle } from "@/lib/utils/movieTitle";

const FALLBACK_PALETTE: [string, string] = ["#f2c879", "#10142a"];

function buildTraits(item: RecommendationItem): MatchTrait[] {
  const traits: MatchTrait[] = [];

  if (item.language_fit_score >= 0.8) {
    traits.push({ label: "Strong Language Fit" });
  }

  if (item.taste_match_score >= 0.8) {
    traits.push({ label: "Matches Your Taste" });
  }

  if (item.quality_score >= 0.8) {
    traits.push({ label: "Highly Rated" });
  }

  if (item.learning_value_score >= 0.6) {
    traits.push({ label: "Good Learning Value" });
  }

  if (traits.length === 0) {
    traits.push({ label: "Personalized Match" });
  }

  return traits;
}

export function mapBackendRecommendation(
  item: RecommendationItem
): RecommendationResult {
  return {
    movie: {
      id: String(item.movie_id),
      title: formatMovieTitle(item.title),
      year: 0,
      genres: [],
      levelFit: [],
      dialogueComplexity: 3,
      pace: 3,
      posterUrl: item.poster_url,
      backdropUrl: item.poster_url,
      palette: FALLBACK_PALETTE,
      logline: "",
      runtime: 0,
    },

    matchPercent: Math.round(item.hybrid_score * 100),

    traits: buildTraits(item),

    reason: item.recommendation_reason,
  };
}
