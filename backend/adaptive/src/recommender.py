

import os
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import spacy
from sklearn.metrics.pairwise import cosine_similarity

warnings.filterwarnings("ignore")

try:
    _nlp = spacy.load(
        "en_core_web_md",
        disable=["parser", "ner", "tagger", "lemmatizer", "attribute_ruler"],
    )
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_md")
    _nlp = spacy.load(
        "en_core_web_md",
        disable=["parser", "ner", "tagger", "lemmatizer", "attribute_ruler"],
    )

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_DATA_FILE = DATA_DIR / "movie_language_features.csv"


class MovieRecommender:

    def __init__(self, data_path=DEFAULT_DATA_FILE):
        data_path = Path(data_path)
        if not data_path.exists():
            raise FileNotFoundError(f"Data file '{data_path}' not found.")

        self.df = pd.read_csv(data_path, engine="python", on_bad_lines="skip")
        self._preprocess_data()
        self._prepare_word2vec()

    def _preprocess_data(self):
        self.df["avg_rating"] = pd.to_numeric(
            self.df["avg_rating"], errors="coerce"
        ).fillna(0)
        self.df["rating_count"] = pd.to_numeric(
            self.df.get("rating_count", 0), errors="coerce"
        ).fillna(0)
        self.df["language_difficulty_score"] = pd.to_numeric(
            self.df["language_difficulty_score"], errors="coerce"
        ).fillna(50.0)
        self.df["vocabulary_diversity"] = pd.to_numeric(
            self.df["vocabulary_diversity"], errors="coerce"
        ).fillna(self.df["vocabulary_diversity"].mean())
        self.df["genres"] = self.df["genres"].fillna("").astype(str)
        self.df["overview"] = self.df["overview"].fillna("").astype(str)
        self.df["language_level"] = self.df["language_level"].fillna(
            "Intermediate"
        ).astype(str)

        # Bayesian / IMDB-weighted rating: blends each movie's own avg_rating
        # with the overall average C, weighted by how many ratings it has
        # (rating_count) versus a "trust threshold" m. A movie with few
        # ratings gets pulled toward the overall average instead of trusting
        # its own (possibly lucky/unlucky) score.
        C = self.df["avg_rating"].mean()
        m = (
            self.df["rating_count"].quantile(0.70)
            if "rating_count" in self.df.columns and self.df["rating_count"].sum() > 0
            else 10
        )
        v = self.df["rating_count"]
        R = self.df["avg_rating"]
        self.df["baseline_score"] = ((v / (v + m)) * R) + ((m / (v + m)) * C)

    def _get_vector(self, text):
        # Average word vector for one movie's genres+overview text
        doc = _nlp(str(text))
        vectors = [
            token.vector
            for token in doc
            if not token.is_stop and token.is_alpha
        ]
        if len(vectors) == 0:
            return np.zeros(_nlp.vocab.vectors_length or 300)
        return np.mean(vectors, axis=0)

    def _prepare_word2vec(self):
        self.df["combined_features"] = (
            self.df["genres"].str.replace("|", " ", regex=False)
            + " "
            + self.df["overview"]
        )
        w2v_list = [
            self._get_vector(text) for text in self.df["combined_features"]
        ]
        self.w2v_matrix = np.array(w2v_list)

    def calculate_scores(self, user_profile, weights=None):
        if weights is None:
            weights = {
                "quality": 0.20,
                "language_fit": 0.35,
                "learning_value": 0.15,
                "taste_match": 0.30,
            }

        # Quality: min-max scale the baseline_score (Bayesian rating) to 0-1
        b_min = self.df["baseline_score"].min()
        b_max = self.df["baseline_score"].max()
        if b_max > b_min:
            quality_score = (self.df["baseline_score"] - b_min) / (b_max - b_min)
        else:
            quality_score = pd.Series(0.5, index=self.df.index)

        # Language fit: how close each movie's difficulty is to the user's
        # target, scaled by the actual spread of difficulty scores in the
        # data (not a fixed /100) so it can properly tell movies apart.
        user_diff = user_profile.get("target_difficulty", 50.0)
        diff_penalty = np.abs(self.df["language_difficulty_score"] - user_diff)

        diff_min = self.df["language_difficulty_score"].min()
        diff_max = self.df["language_difficulty_score"].max()
        actual_range = diff_max - diff_min

        if actual_range > 0:
            language_fit_score = np.clip(1.0 - (diff_penalty / actual_range), 0.0, 1.0)
        else:
            language_fit_score = np.ones(len(self.df))

        max_vocab_div = self.df["vocabulary_diversity"].max()
        learning_value_score = (
            self.df["vocabulary_diversity"] / max_vocab_div
            if max_vocab_div > 0
            else 0.5
        )

        taste_match_score = np.zeros(len(self.df))
        liked_ids = user_profile.get("liked_movie_ids", [])
        if liked_ids:
            liked_indices = self.df[self.df["movieId"].isin(liked_ids)].index
            if len(liked_indices) > 0:
                sim_matrix = cosine_similarity(
                    self.w2v_matrix[liked_indices], self.w2v_matrix
                )
                taste_match_score += sim_matrix.mean(axis=0)

        fav_genres = user_profile.get("favorite_genres", [])
        if fav_genres:
            genre_pattern = "|".join(fav_genres)
            genre_match = (
                self.df["genres"]
                .str.contains(genre_pattern, case=False, regex=True)
                .astype(float)
            )
            taste_match_score = (taste_match_score + genre_match) / 2.0

        taste_match_score = np.clip(taste_match_score, 0.0, 1.0)

        hybrid_score = (
            weights["quality"] * quality_score
            + weights["language_fit"] * language_fit_score
            + weights["learning_value"] * learning_value_score
            + weights["taste_match"] * taste_match_score
        )

        scored_df = self.df.copy()
        scored_df["quality_score"] = np.round(quality_score, 3)
        scored_df["language_fit_score"] = np.round(language_fit_score, 3)
        scored_df["learning_value_score"] = np.round(learning_value_score, 3)
        scored_df["taste_match_score"] = np.round(taste_match_score, 3)
        scored_df["hybrid_score"] = np.round(hybrid_score, 4)

        return scored_df

    def recommend_movies(self, user_profile, top_n=5):
        scored_df = self.calculate_scores(user_profile)
        liked_ids = user_profile.get("liked_movie_ids", [])
        filtered_df = scored_df[~scored_df["movieId"].isin(liked_ids)]

        top_movies = filtered_df.sort_values(
            by="hybrid_score", ascending=False
        ).head(top_n)

        recommendations = []
        for _, row in top_movies.iterrows():
            reason_parts = []
            if row["language_fit_score"] >= 0.8:
                reason_parts.append(
                    f"يتوافق بشكل ممتاز مع مستواك اللغوي ({row['language_level']})"
                )
            if row["taste_match_score"] >= 0.4:
                main_genre = row.get(
                    "main_genre",
                    row["genres"].split("|")[0] if row["genres"] else "عام",
                )
                reason_parts.append(
                    f"يطابق تفضيلاتك في تصنيف {main_genre}"
                )
            if row["quality_score"] >= 0.7:
                reason_parts.append("حصل على تقييمات عالية وموثوقة من المشاهدين")

            reason_str = (
                " و".join(reason_parts)
                if reason_parts
                else "مقترح مناسب لتطوير لغتك وساعات المشاهدة"
            )

            recommendations.append({
                "movieId": int(row["movieId"]),
                "title": str(row.get("title", row.get("clean_title", ""))),
                "year": (
                    int(row["year"]) if pd.notnull(row.get("year")) else None
                ),
                "main_genre": str(row.get(
                    "main_genre",
                    row["genres"].split("|")[0] if row["genres"] else "",
                )),
                "language_level": str(row["language_level"]),
                "language_difficulty_score": float(
                    row["language_difficulty_score"]
                ),
                "hybrid_score": float(row["hybrid_score"]),
                "recommendation_reason": reason_str,
                "poster_url": str(row.get("poster_url", "")),
            })

        return recommendations


_recommender_instance = None


def get_recommender():
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = MovieRecommender()
    return _recommender_instance


def recommend_movies(user_profile, top_n=5):
    return get_recommender().recommend_movies(user_profile, top_n=top_n)


if __name__ == "__main__":
    import json

    sample_user = {
        "target_level": "Beginner",
        "target_difficulty": 20.0,
        "favorite_genres": ["Drama"],
        "liked_movie_ids": [],
    }

    results = recommend_movies(sample_user, top_n=3)
    print(json.dumps(results, indent=2))
