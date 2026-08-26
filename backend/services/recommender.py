import re
from pathlib import Path

import numpy as np
import pandas as pd
from gensim.models import Word2Vec
from sklearn.metrics.pairwise import cosine_similarity


DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "movie_language_features.csv"
)


def _normalize_title(title: str) -> str:
    title = title.strip().lower()

    # Remove a trailing year such as "(1994)"
    title = re.sub(r"\s*\(\d{4}\)\s*$", "", title)

    # Normalize repeated spaces
    title = re.sub(r"\s+", " ", title)

    return title


def _article_swap(title: str) -> str:
    """
    Allows matching titles stored in different forms:

    "The Bourne Identity"
    <->
    "Bourne Identity, The"
    """

    title = title.strip()

    # "The Bourne Identity" -> "Bourne Identity, The"
    match = re.match(
        r"^(the|a|an)\s+(.*)$",
        title,
        flags=re.IGNORECASE,
    )

    if match:
        article = match.group(1)
        rest = match.group(2)

        return f"{rest}, {article}"

    # "Bourne Identity, The" -> "The Bourne Identity"
    match = re.match(
        r"^(.*),\s*(the|a|an)$",
        title,
        flags=re.IGNORECASE,
    )

    if match:
        rest = match.group(1)
        article = match.group(2)

        return f"{article} {rest}"

    return title


class MovieRecommender:
    def __init__(self):
        if not DATA_PATH.exists():
            raise FileNotFoundError(
                f"Data file not found: {DATA_PATH}"
            )

        self.df = pd.read_csv(
            DATA_PATH,
            engine="python",
            on_bad_lines="skip",
        )

        self._preprocess_data()
        self._prepare_word2vec()
        self._build_title_index()

    def _preprocess_data(self):
        self.df["avg_rating"] = pd.to_numeric(
            self.df.get("avg_rating", 0),
            errors="coerce",
        ).fillna(0)

        if "rating_count" not in self.df.columns:
            self.df["rating_count"] = 1
        else:
            self.df["rating_count"] = pd.to_numeric(
                self.df["rating_count"],
                errors="coerce",
            ).fillna(1)

        self.df["language_difficulty_score"] = pd.to_numeric(
            self.df.get(
                "language_difficulty_score",
                25.0,
            ),
            errors="coerce",
        ).fillna(25.0)

        self.df["vocabulary_diversity"] = pd.to_numeric(
            self.df.get(
                "vocabulary_diversity",
                0,
            ),
            errors="coerce",
        ).fillna(0)

        self.df["genres"] = (
            self.df.get("genres", "")
            .fillna("")
            .astype(str)
        )

        self.df["overview"] = (
            self.df.get("overview", "")
            .fillna("")
            .astype(str)
        )

        self.df["language_level"] = (
            self.df.get(
                "language_level",
                "Intermediate",
            )
            .fillna("Intermediate")
            .astype(str)
        )

        # Bayesian weighted quality score
        C = self.df["avg_rating"].mean()

        if self.df["rating_count"].sum() > 0:
            m = self.df["rating_count"].quantile(0.70)
        else:
            m = 10

        v = self.df["rating_count"]
        R = self.df["avg_rating"]

        self.df["baseline_score"] = (
            (v / (v + m)) * R
            + (m / (v + m)) * C
        )

    def _tokenize(self, text):
        return [
            word.lower()
            for word in text.replace("|", " ").split()
            if word.isalpha()
        ]

    def _prepare_word2vec(self):
        self.df["combined_features"] = (
            self.df["genres"].str.replace(
                "|",
                " ",
                regex=False,
            )
            + " "
            + self.df["overview"]
        )

        sentences = [
            self._tokenize(text)
            for text in self.df["combined_features"]
        ]

        self.w2v_model = Word2Vec(
            sentences=sentences,
            vector_size=100,
            window=5,
            min_count=1,
            workers=4,
        )

        vectors = []

        for sentence in sentences:
            valid_words = [
                word
                for word in sentence
                if word in self.w2v_model.wv
            ]

            if valid_words:
                vectors.append(
                    np.mean(
                        self.w2v_model.wv[valid_words],
                        axis=0,
                    )
                )
            else:
                vectors.append(
                    np.zeros(100)
                )

        self.w2v_matrix = np.array(vectors)

    def _build_title_index(self):
        """
        Build a lookup table:
        normalized movie title -> numeric movieId
        """

        self._title_to_id: dict[str, int] = {}

        if "movieId" not in self.df.columns:
            return

        if "title" in self.df.columns:
            title_col = "title"
        elif "clean_title" in self.df.columns:
            title_col = "clean_title"
        else:
            return

        rows = self.df[
            [title_col, "movieId"]
        ].dropna()

        for _, row in rows.iterrows():
            raw_title = str(row[title_col])
            movie_id = row["movieId"]

            for key in self._title_lookup_keys(raw_title):
                self._title_to_id.setdefault(
                    key,
                    movie_id,
                )

    def _title_lookup_keys(
        self,
        raw_title: str,
    ) -> set[str]:
        return {
            _normalize_title(raw_title),
            _normalize_title(
                _article_swap(raw_title)
            ),
        }

    def resolve_movie_ids_by_titles(
        self,
        titles: list[str],
    ) -> list[int]:
        """
        Converts frontend movie titles into real numeric movieIds.

        Matching is:
        - case-insensitive
        - whitespace tolerant
        - tolerant of trailing movie year
        - tolerant of:
          "The X"
          vs
          "X, The"

        Any title that cannot be matched is skipped.
        """

        resolved = []

        for raw_title in titles:
            if (
                not raw_title
                or not isinstance(raw_title, str)
            ):
                continue

            normalized = _normalize_title(
                raw_title
            )

            movie_id = self._title_to_id.get(
                normalized
            )

            if movie_id is None:
                swapped = _article_swap(
                    raw_title
                )

                movie_id = self._title_to_id.get(
                    _normalize_title(swapped)
                )

            if (
                movie_id is not None
                and pd.notna(movie_id)
            ):
                resolved.append(
                    int(movie_id)
                )

        return resolved

    def calculate_scores(
        self,
        user_profile,
        weights=None,
    ):
        if weights is None:
            weights = {
                "quality": 0.25,
                "language_fit": 0.35,
                "learning_value": 0.15,
                "taste_match": 0.25,
            }

        # 1. Movie quality
        min_b = self.df[
            "baseline_score"
        ].min()

        max_b = self.df[
            "baseline_score"
        ].max()

        if max_b > min_b:
            quality_score = (
                self.df["baseline_score"]
                - min_b
            ) / (
                max_b - min_b
            )
        else:
            quality_score = pd.Series(
                0.5,
                index=self.df.index,
            )

        # 2. Language fit
        target_difficulty = (
            user_profile.get(
                "target_difficulty",
                25.0,
            )
        )

        diff_penalty = np.abs(
            self.df[
                "language_difficulty_score"
            ]
            - target_difficulty
        )

        actual_range = (
            self.df[
                "language_difficulty_score"
            ].max()
            - self.df[
                "language_difficulty_score"
            ].min()
        )

        if actual_range > 0:
            language_fit = (
                1.0
                - diff_penalty
                / actual_range
            )
        else:
            language_fit = np.ones(
                len(self.df)
            )

        language_fit = np.clip(
            language_fit,
            0.0,
            1.0,
        )

        # 3. Learning value
        max_div = (
            self.df[
                "vocabulary_diversity"
            ].max()
        )

        if max_div > 0:
            learning_value = (
                self.df[
                    "vocabulary_diversity"
                ]
                / max_div
            )
        else:
            learning_value = pd.Series(
                0.5,
                index=self.df.index,
            )

        # 4. Taste match
        taste_match = np.zeros(
            len(self.df)
        )

        liked_ids = user_profile.get(
            "liked_movie_ids",
            [],
        )

        if (
            liked_ids
            and "movieId" in self.df.columns
        ):
            liked_indices = self.df[
                self.df["movieId"].isin(
                    liked_ids
                )
            ].index

            if len(liked_indices) > 0:
                sim_matrix = cosine_similarity(
                    self.w2v_matrix[
                        liked_indices
                    ],
                    self.w2v_matrix,
                )

                taste_match += (
                    sim_matrix.mean(
                        axis=0
                    )
                )

        favorite_genres = (
            user_profile.get(
                "favorite_genres",
                [],
            )
        )

        if favorite_genres:
            genre_pattern = "|".join(
                favorite_genres
            )

            genre_match = (
                self.df["genres"]
                .str.contains(
                    genre_pattern,
                    case=False,
                    regex=True,
                )
                .astype(float)
            )

            taste_match = (
                taste_match
                + genre_match
            ) / 2.0

        taste_match = np.clip(
            taste_match,
            0.0,
            1.0,
        )

        # Final hybrid score
        hybrid_score = (
            weights["quality"]
            * quality_score

            + weights["language_fit"]
            * language_fit

            + weights["learning_value"]
            * learning_value

            + weights["taste_match"]
            * taste_match
        )

        scored_df = self.df.copy()

        scored_df[
            "quality_score"
        ] = np.round(
            quality_score,
            3,
        )

        scored_df[
            "language_fit_score"
        ] = np.round(
            language_fit,
            3,
        )

        scored_df[
            "learning_value_score"
        ] = np.round(
            learning_value,
            3,
        )

        scored_df[
            "taste_match_score"
        ] = np.round(
            taste_match,
            3,
        )

        scored_df[
            "hybrid_score"
        ] = np.round(
            hybrid_score,
            4,
        )

        return scored_df

    def recommend(
        self,
        target_level: str,
        target_difficulty: float,
        favorite_genres: list[str],
        liked_movie_ids: list[int],
        top_k: int = 5,
    ):
        user_profile = {
            "target_level": target_level,
            "target_difficulty": target_difficulty,
            "favorite_genres": favorite_genres,
            "liked_movie_ids": liked_movie_ids,
        }

        df_scored = self.calculate_scores(
            user_profile
        )

        # Do not recommend movies
        # the user already selected
        if (
            liked_movie_ids
            and "movieId" in df_scored.columns
        ):
            filtered_df = df_scored[
                ~df_scored[
                    "movieId"
                ].isin(
                    liked_movie_ids
                )
            ]
        else:
            filtered_df = df_scored

        top_movies = (
            filtered_df
            .sort_values(
                by="hybrid_score",
                ascending=False,
            )
            .head(top_k)
        )

        results = []

        for _, row in top_movies.iterrows():
            genres = str(
                row.get(
                    "genres",
                    "",
                )
            )

            if genres:
                main_genre = (
                    genres.split("|")[0]
                )
            else:
                main_genre = "General"

            movie_id = row.get(
                "movieId",
                row.name,
            )

            poster_url = row.get(
                "poster_url",
                "",
            )

            if pd.isna(poster_url):
                poster_url = ""

            reason = (
                f"Matches your "
                f"{target_level} "
                f"language level and your "
                f"preference for "
                f"{main_genre} movies."
            )

            results.append(
                {
                    "movie_id": (
                        int(movie_id)
                        if pd.notna(
                            movie_id
                        )
                        else None
                    ),

                    "title": str(
                        row.get(
                            "title",
                            row.get(
                                "clean_title",
                                "Unknown title",
                            ),
                        )
                    ),

                    "hybrid_score": round(
                        float(
                            row[
                                "hybrid_score"
                            ]
                        ),
                        3,
                    ),

                    "quality_score": round(
                        float(
                            row[
                                "quality_score"
                            ]
                        ),
                        3,
                    ),

                    "language_fit_score": round(
                        float(
                            row[
                                "language_fit_score"
                            ]
                        ),
                        3,
                    ),

                    "learning_value_score": round(
                        float(
                            row[
                                "learning_value_score"
                            ]
                        ),
                        3,
                    ),

                    "taste_match_score": round(
                        float(
                            row[
                                "taste_match_score"
                            ]
                        ),
                        3,
                    ),

                    "poster_url": str(
                        poster_url
                    ),

                    "recommendation_reason": reason,
                }
            )

        return results