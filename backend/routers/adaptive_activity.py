from fastapi import APIRouter, HTTPException

from backend.adaptive.src.activities import (
    build_full_activity,
    load_word2vec_model,
)


router = APIRouter()


# Load Word2Vec ONCE when backend starts.
# We do not want to reload the model on every request.
# Loaded on the first request, not at import time, so /health can answer
# while the model is still cold.
word2vec_model = None


def get_model():
    global word2vec_model

    if word2vec_model is None:
        word2vec_model = load_word2vec_model()

    return word2vec_model


@router.get("/adaptive/activity/{movie_id}")
def get_adaptive_activity(movie_id: int):
    try:
        activity = build_full_activity(
            movie_id,
            get_model(),
        )

        if not activity:
            raise HTTPException(
                status_code=404,
                detail="No activity found for this movie.",
            )

        return {
            "movie_id": movie_id,
            "vocabulary": activity.get(
                "vocabulary_grammar",
                [],
            ),
            "quiz": activity.get(
                "quiz",
                [],
            ),
            "speaking_prompt": activity.get(
                "speaking_prompt",
                [],
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )