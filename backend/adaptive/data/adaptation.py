# raise/lower the learner's level, and run the full update loop.

# After watching a movie, the user picks ONE mode:
# "Quick Quiz" or "Speak About It" — not both.
# So update_learner_profile() takes an activity_mode
# and scores whichever one actually happened.

import json
from pathlib import Path

# =========================================================
# FIXED IMPORTS FOR OUR PROJECT STRUCTURE
# backend/adaptive/src/...
# =========================================================

from .learner_profile import (
    create_learner_profile,
    load_profile,
    save_profile,
    add_history_entry,
    VALID_LEVELS,
)

from .scoring import score_quiz, score_speaking
from .recommender import recommend_movies


# =========================================================
# PATHS
# =========================================================

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DIFFICULTY_CONFIG_FILE = DATA_DIR / "difficulty_config.json"


# =========================================================
# ADAPTATION THRESHOLDS
# =========================================================

RAISE_THRESHOLD = 75
LOWER_THRESHOLD = 40


# =========================================================
# LOAD DIFFICULTY CONFIG
# =========================================================

def load_difficulty_thresholds():
    """
    Load low/high difficulty score cutoffs.

    These are used to convert:
    Beginner / Intermediate / Advanced

    into a numerical target difficulty.
    """

    if not DIFFICULTY_CONFIG_FILE.exists():
        raise FileNotFoundError(
            f"Difficulty config file not found:\n{DIFFICULTY_CONFIG_FILE}"
        )

    with open(DIFFICULTY_CONFIG_FILE, "r", encoding="utf-8") as f:
        config = json.load(f)

    return config["low"], config["high"]


# =========================================================
# ADAPT LEARNER LEVEL
# =========================================================

def adapt_level(current_level, activity_score):
    """
    Move learner one level up/down depending on score.

    >= 75  -> raise level
    < 40   -> lower level
    40-74  -> keep current level
    """

    if current_level not in VALID_LEVELS:
        raise ValueError(
            f"Invalid level: {current_level}. "
            f"Expected one of {VALID_LEVELS}"
        )

    index = VALID_LEVELS.index(current_level)

    # Raise level
    if (
        activity_score >= RAISE_THRESHOLD
        and index < len(VALID_LEVELS) - 1
    ):
        return VALID_LEVELS[index + 1]

    # Lower level
    if (
        activity_score < LOWER_THRESHOLD
        and index > 0
    ):
        return VALID_LEVELS[index - 1]

    # Stay at same level
    return current_level


# =========================================================
# LEVEL -> TARGET DIFFICULTY
# =========================================================

def level_to_target_difficulty(level):
    """
    Convert language level into numerical target difficulty.
    """

    low, high = load_difficulty_thresholds()

    if level == "Beginner":
        return low - 5

    if level == "Advanced":
        return high + 5

    # Intermediate
    return (low + high) / 2


# =========================================================
# GET MOVIES USER LIKED
# =========================================================

def get_liked_movie_ids(profile, min_rating=4):
    """
    A movie counts as liked when enjoyment rating >= min_rating.
    """

    liked_ids = []

    enjoyment_ratings = (
        profile
        .get("preferences", {})
        .get("enjoyment_ratings", {})
    )

    for movie_id_str, rating in enjoyment_ratings.items():
        if rating >= min_rating:
            liked_ids.append(int(movie_id_str))

    return liked_ids


# =========================================================
# FULL ADAPTIVE LEARNING UPDATE LOOP
# =========================================================

def get_seen_movie_ids(profile, current_movie_id=None):
    """
    Every film already in the learner's history, plus the one just finished.

    Passed to the recommender so the next set is genuinely new rather than a
    repeat of the same top-ranked titles.
    """
    seen = {
        entry["movieId"]
        for entry in profile.get("history", [])
        if entry.get("movieId") is not None
    }

    if current_movie_id is not None:
        seen.add(current_movie_id)

    return list(seen)


def update_learner_profile(
    user_id,
    movie_id,
    activity_mode,
    activity=None,
    quiz_answers=None,
    attempt_result=None,
    enjoyment_rating=None,
):
    """
    Update learner after finishing ONE activity.

    activity_mode:
        "quiz"
        OR
        "speaking"
    """

    # -----------------------------------------------------
    # Validate mode
    # -----------------------------------------------------

    if activity_mode not in ("quiz", "speaking"):
        raise ValueError(
            'activity_mode must be "quiz" or "speaking"'
        )

    # -----------------------------------------------------
    # Validate Quiz input
    # -----------------------------------------------------

    if activity_mode == "quiz":
        if activity is None or quiz_answers is None:
            raise ValueError(
                'activity_mode="quiz" requires both '
                '`activity` (from build_full_activity) '
                "and `quiz_answers` "
                "(the user's chosen word per question)"
            )

    # -----------------------------------------------------
    # Validate Speaking input
    # -----------------------------------------------------

    if activity_mode == "speaking":
        if attempt_result is None:
            raise ValueError(
                'activity_mode="speaking" requires '
                '`attempt_result` '
                "(finished speaking attempt JSON)"
            )

    # -----------------------------------------------------
    # Load/Create learner profile
    # -----------------------------------------------------

    profile = load_profile(user_id)

    if profile is None:
        profile = create_learner_profile(user_id)

    level_before = profile["current_level"]

    # -----------------------------------------------------
    # Score activity
    # -----------------------------------------------------

    if activity_mode == "quiz":
        activity_score = score_quiz(
            activity,
            quiz_answers,
        )

    else:
        activity_score = score_speaking(
            attempt_result
        )

    # -----------------------------------------------------
    # Adapt learner level
    # -----------------------------------------------------

    level_after = adapt_level(
        level_before,
        activity_score,
    )

    profile["current_level"] = level_after

    # -----------------------------------------------------
    # Save enjoyment rating
    # -----------------------------------------------------

    if enjoyment_rating is not None:

        profile.setdefault(
            "preferences",
            {}
        )

        profile["preferences"].setdefault(
            "enjoyment_ratings",
            {}
        )

        profile["preferences"]["enjoyment_ratings"][
            str(movie_id)
        ] = enjoyment_rating

    # -----------------------------------------------------
    # Add learning history
    # -----------------------------------------------------

    add_history_entry(
        profile,
        movie_id,
        activity_mode,
        activity_score,
        level_before,
        level_after,
        enjoyment_rating,
    )

    # -----------------------------------------------------
    # Save updated profile
    # -----------------------------------------------------

    save_profile(profile)

    # -----------------------------------------------------
    # Generate NEXT recommendations
    # -----------------------------------------------------

    preferences = profile.get(
        "preferences",
        {}
    )

    next_recommendations = recommend_movies(
        {
            "target_level": level_after,

            "target_difficulty":
                level_to_target_difficulty(
                    level_after
                ),

            "favorite_genres":
                preferences.get(
                    "favorite_genres",
                    []
                ),

            "liked_movie_ids":
                get_liked_movie_ids(
                    profile
                ),

            # Films the learner has already worked through. Without this the
            # ranking is deterministic and returns the same titles every time.
            "exclude_movie_ids":
                get_seen_movie_ids(
                    profile,
                    movie_id,
                ),
        },
        top_n=3,
    )

    # -----------------------------------------------------
    # Return everything frontend/backend needs
    # -----------------------------------------------------

    return {
        "profile": profile,
        "activity_score": activity_score,
        "level_before": level_before,
        "level_after": level_after,
        "next_recommendations": next_recommendations,
    }


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":

    # Fixed relative imports
    from .activities import (
        build_full_activity,
        load_word2vec_model,
    )

    from .mocks import mock_attempt_result

    test_movie_id = 7763

    print(
        "Loading Word2Vec model "
        "and building a test activity..."
    )

    model = load_word2vec_model()

    activity = build_full_activity(
        test_movie_id,
        model,
    )

    # =====================================================
    # TEST 1 — QUICK QUIZ
    # =====================================================

    perfect_answers = [
        q["correct_word"]
        for q in activity["quiz"]
    ]

    result = update_learner_profile(
        user_id="u_quiz_test",
        movie_id=test_movie_id,
        activity_mode="quiz",
        activity=activity,
        quiz_answers=perfect_answers,
        enjoyment_rating=5,
    )

    print("\n--- Quick Quiz mode ---")

    print(
        f"Level before: "
        f"{result['level_before']}"
    )

    print(
        f"Activity score: "
        f"{result['activity_score']}"
    )

    print(
        f"Level after: "
        f"{result['level_after']}"
    )

    print("Next recommendations:")

    for movie in result["next_recommendations"]:

        print(
            f"- {movie['title']} "
            f"({movie['language_level']}, "
            f"score={movie['hybrid_score']})"
        )

    # =====================================================
    # TEST 2 — SPEAK ABOUT IT
    # =====================================================

    result = update_learner_profile(
        user_id="u_speaking_test",
        movie_id=test_movie_id,
        activity_mode="speaking",
        attempt_result=mock_attempt_result(
            test_movie_id
        ),
        enjoyment_rating=4,
    )

    print("\n--- Speak About It mode ---")

    print(
        f"Level before: "
        f"{result['level_before']}"
    )

    print(
        f"Activity score: "
        f"{result['activity_score']}"
    )

    print(
        f"Level after: "
        f"{result['level_after']}"
    )

    print("Next recommendations:")

    for movie in result["next_recommendations"]:

        print(
            f"- {movie['title']} "
            f"({movie['language_level']}, "
            f"score={movie['hybrid_score']})"
        )