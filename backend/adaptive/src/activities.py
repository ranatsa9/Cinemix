

import json
import random
import re
from pathlib import Path

from gensim.models import Word2Vec

from .subtitles_loader import (
    get_subtitle_text,
    get_subtitle_lines,
    find_lines_with_word,
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ACTIVITIES_DIR = Path(__file__).resolve().parent.parent / "activities"

VOCAB_FILE = DATA_DIR / "vocabulary_candidates.json"
WORD2VEC_FILE = DATA_DIR / "word2vec.model"

NUM_VOCAB_PREVIEW = 5
NUM_QUIZ_QUESTIONS = 5
NUM_SPEAKING_PROMPTS = 1


# =========================================================
# Shared helpers
# =========================================================

def load_vocabulary_for_movie(movie_id):
    with open(VOCAB_FILE, "r", encoding="utf-8") as f:
        all_vocab = json.load(f)

    movie_id_str = str(movie_id)

    if movie_id_str not in all_vocab:
        return []

    return all_vocab[movie_id_str]


def load_word2vec_model():
    return Word2Vec.load(str(WORD2VEC_FILE))


def get_distractors(
    word,
    fallback_related,
    model,
    n=3,
):
    try:
        similar_words = model.wv.most_similar(
            word,
            topn=n,
        )

        distractors = [
            w
            for w, score in similar_words
        ]

        if len(distractors) < n:
            return fallback_related, "fallback"

        return distractors, "word2vec"

    except KeyError:
        return fallback_related, "fallback"


def _mask_word(sentence, word):
    """
    Replaces the first whole-word match
    with a blank.
    """

    pattern = re.compile(
        r"\b"
        + re.escape(word)
        + r"\b",
        re.IGNORECASE,
    )

    return pattern.sub(
        "____",
        sentence,
        count=1,
    )


# =========================================================
# 1. Before-movie vocabulary preview
# Not graded
# =========================================================

def build_vocabulary_questions(
    movie_id,
    model,
    num_questions=NUM_VOCAB_PREVIEW,
):
    vocabulary = load_vocabulary_for_movie(
        movie_id
    )

    if len(vocabulary) == 0:
        return []

    if len(vocabulary) < num_questions:
        chosen_words = vocabulary
    else:
        chosen_words = random.sample(
            vocabulary,
            num_questions,
        )

    questions = []

    for item in chosen_words:

        correct_word = item["word"]
        fallback_related = item["related"]

        distractors, source = get_distractors(
            correct_word,
            fallback_related,
            model,
            n=3,
        )

        options = [
            correct_word
        ] + distractors

        random.shuffle(options)

        questions.append(
            {
                "correct_word": correct_word,
                "options": options,
                "source": source,
            }
        )

    return questions


# =========================================================
# 2. After-movie quiz
# =========================================================

def build_quiz_questions(
    movie_id,
    model,
    lines,
    num_questions=NUM_QUIZ_QUESTIONS,
):
    """
    A vocabulary word tested inside
    a real subtitle line.

    This combines comprehension +
    vocabulary.
    """

    vocabulary = load_vocabulary_for_movie(
        movie_id
    )

    if len(vocabulary) == 0:
        return []

    if len(lines) == 0:
        return []

    random.shuffle(vocabulary)

    questions = []

    for item in vocabulary:

        if len(questions) >= num_questions:
            break

        correct_word = item["word"]

        matching_lines = find_lines_with_word(
            lines,
            correct_word,
        )

        if not matching_lines:
            continue

        line = random.choice(
            matching_lines
        )

        distractors, source = get_distractors(
            correct_word,
            item["related"],
            model,
            n=3,
        )

        options = [
            correct_word
        ] + distractors

        random.shuffle(options)

        questions.append(
            {
                "context": _mask_word(
                    line,
                    correct_word,
                ),
                "correct_word": correct_word,
                "options": options,
                "source": source,
            }
        )

    return questions


# =========================================================
# 3. Speaking prompt
# =========================================================

def build_speaking_prompts(
    lines,
    num_prompts=NUM_SPEAKING_PROMPTS,
):
    """
    Text-only prompt.

    Actual grading happens later in:
    scoring.score_speaking()
    """

    if len(lines) == 0:
        return []

    chosen = random.sample(
        lines,
        min(
            num_prompts,
            len(lines),
        ),
    )

    return [
        {
            "reference_sentence": line
        }
        for line in chosen
    ]


# =========================================================
# Combine full activity
# =========================================================

def build_full_activity(
    movie_id,
    model,
):
    """
    Fetch subtitle text once,
    then reuse it for quiz and speaking.
    """

    text = get_subtitle_text(
        movie_id
    )

    quiz_lines = get_subtitle_lines(
        movie_id,
        min_words=6,
        max_words=25,
        text=text,
    )

    speaking_lines = get_subtitle_lines(
        movie_id,
        min_words=4,
        max_words=12,
        text=text,
    )

    return {
        "movieId": movie_id,

        "vocabulary_grammar":
            build_vocabulary_questions(
                movie_id,
                model,
            ),

        "quiz":
            build_quiz_questions(
                movie_id,
                model,
                quiz_lines,
            ),

        "speaking_prompt":
            build_speaking_prompts(
                speaking_lines
            ),
    }


# =========================================================
# Save activity
# =========================================================

def save_activity(
    movie_id,
    activity,
):
    ACTIVITIES_DIR.mkdir(
        exist_ok=True
    )

    filepath = (
        ACTIVITIES_DIR
        / f"{movie_id}.json"
    )

    with open(
        filepath,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            activity,
            f,
            ensure_ascii=False,
            indent=2,
        )


# =========================================================
# Local test
# =========================================================

if __name__ == "__main__":

    test_movie_id = 7763

    print(
        "Loading Word2Vec model..."
    )

    model = load_word2vec_model()

    print(
        f"Building full activity "
        f"for movie {test_movie_id}..."
    )

    activity = build_full_activity(
        test_movie_id,
        model,
    )

    for category, questions in activity.items():

        if category == "movieId":
            continue

        print(
            f"\n{category}: "
            f"{len(questions)} question(s)"
        )

    save_activity(
        test_movie_id,
        activity,
    )

    print(
        f"\nSaved to "
        f"activities/{test_movie_id}.json"
    )