from fastapi import APIRouter, HTTPException

from backend.adaptive.src.activities import (
    load_vocabulary_for_movie,
    load_vocabulary_with_context,
    load_word2vec_model,
    get_distractors,
)
from backend.adaptive.src.subtitles_loader import (
    find_lines_with_word,
    get_subtitle_lines,
)


router = APIRouter()

# نحمل المودل مرة وحدة فقط وقت تشغيل الباك
word2vec_model = load_word2vec_model()

# Common concrete words do not add useful learning value in a movie
# preview, even when they happen to occur in the subtitles.
LOW_VALUE_WORDS = {
    "actual", "agree", "apple", "board", "complete", "cross",
    "depend", "event", "grand", "however", "private", "suppose",
}


@router.get("/adaptive/vocabulary/{movie_id}")
def get_adaptive_vocabulary(movie_id: int):
    try:
        vocabulary = (
            load_vocabulary_with_context(movie_id)
            or load_vocabulary_for_movie(movie_id)
        )

        if not vocabulary:
            raise HTTPException(
                status_code=404,
                detail="No vocabulary found for this movie.",
            )

        dialogue_lines = get_subtitle_lines(
            movie_id,
            min_words=5,
            max_words=22,
        )

        candidates = [
            item
            for item in vocabulary
            if len(item["word"]) >= 5
            and item["word"].lower() not in LOW_VALUE_WORDS
        ]

        if not candidates:
            candidates = vocabulary

        # Prefer richer words while keeping the original data as the source.
        candidates.sort(
            key=lambda item: len(item["word"]),
            reverse=True,
        )

        results = []

        for item in candidates[:5]:
            correct_word = item["word"]
            fallback_related = item["related"]

            distractors, source = get_distractors(
                correct_word,
                fallback_related,
                word2vec_model,
                n=3,
            )

            options = [correct_word] + distractors

            matching_lines = find_lines_with_word(
                dialogue_lines,
                correct_word,
            )

            results.append(
                {
                    "correct_word": correct_word,
                    "options": options,
                    "source": source,
                    "context": (
                        item.get("context")
                        or (matching_lines[0] if matching_lines else None)
                    ),
                }
            )

        return {
            "movie_id": movie_id,
            "vocabulary": results,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
