from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from backend.services.recommender import MovieRecommender


router = APIRouter()

# Built on the first request instead of at import time. The constructor reads
# the catalogue and builds vectors for every film, which takes about a minute
# — long enough that the platform healthcheck times out before the app can
# answer anything.
recommender = None


def get_recommender():
    global recommender

    if recommender is None:
        recommender = MovieRecommender()

    return recommender


class RecommendationRequest(BaseModel):
    english_level: str
    learning_goal: str
    genres: List[str]

    # Stored by frontend as string IDs:
    # ["5349", "89745", "79132"]
    favorite_movies: List[str]


@router.post("/recommend")
def recommend_movie(
    data: RecommendationRequest
):
    level_mapping = {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced",
    }

    difficulty_mapping = {
        "beginner": 25.0,
        "intermediate": 50.0,
        "advanced": 75.0,
    }

    target_level = level_mapping.get(
        data.english_level.lower(),
        "Intermediate",
    )

    target_difficulty = difficulty_mapping.get(
        data.english_level.lower(),
        50.0,
    )

    liked_movie_ids = []

    unresolved_titles = []

    for value in data.favorite_movies:

        value = str(value).strip()

        # New frontend uses real numeric movie IDs
        if value.isdigit():
            liked_movie_ids.append(
                int(value)
            )

        # Backward compatibility:
        # old frontend could still send titles
        elif value:
            unresolved_titles.append(
                value
            )

    # If any old title values arrive,
    # resolve them using the existing helper.
    if unresolved_titles:
        liked_movie_ids.extend(
            get_recommender().resolve_movie_ids_by_titles(
                unresolved_titles
            )
        )

    # Remove duplicates while preserving order
    liked_movie_ids = list(
        dict.fromkeys(liked_movie_ids)
    )

    results = get_recommender().recommend(
        target_level=target_level,
        target_difficulty=target_difficulty,
        favorite_genres=data.genres,
        liked_movie_ids=liked_movie_ids,
        top_k=5,
    )

    return {
        "recommendations": results
    }