
import json
from pathlib import Path

# Path to the profiles folder
PROFILES_DIR = Path(__file__).resolve().parent.parent / "profiles"

VALID_LEVELS = ["Beginner", "Intermediate", "Advanced"]


def create_learner_profile(user_id, initial_level="Beginner"):
    
    if initial_level not in VALID_LEVELS:
        raise ValueError("initial_level must be one of " + str(VALID_LEVELS))

    profile = {
        "user_id": user_id,
        "current_level": initial_level,
        "preferences": {
            "favorite_genres": [],
            "enjoyment_ratings": {}, 
        },
        "history": [],
    }
    return profile


def save_profile(profile):
    # str() in case the caller passes a numeric or UUID user_id, not just a string
    PROFILES_DIR.mkdir(exist_ok=True)
    user_id = str(profile["user_id"])
    filepath = PROFILES_DIR / (user_id + ".json")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(profile, f, ensure_ascii=False, indent=2)


def load_profile(user_id):
    filepath = PROFILES_DIR / (str(user_id) + ".json")

    if not filepath.exists():
        return None

    with open(filepath, "r", encoding="utf-8") as f:
        profile = json.load(f)

    return profile


def add_history_entry(profile, movie_id, activity_mode, activity_score,
                       level_before, level_after, enjoyment_rating=None):
    # activity_mode: "quiz" or "speaking" - the user does one or the
    # other per movie (matche "Quick Quiz / Speak About It"
    # choice screen), so there's only one activity_score, not three.
    entry = {
        "movieId": movie_id,
        "activity_mode": activity_mode,
        "activity_score": activity_score,
        "level_before": level_before,
        "level_after": level_after,
        "enjoyment_rating": enjoyment_rating,
    }
    profile["history"].append(entry)
    return profile


if __name__ == "__main__":

    profile = create_learner_profile("u001", initial_level="Beginner")
    print("New profile created:")
    print(json.dumps(profile, indent=2))

    save_profile(profile)
    print("\nSaved to profiles/u001.json")

    loaded = load_profile("u001")
    print("\nLoaded back from disk:")
    print(json.dumps(loaded, indent=2))

    print("\nDoes a missing user return None?")
    print(load_profile("does_not_exist"))