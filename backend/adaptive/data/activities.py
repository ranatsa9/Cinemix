

import json
import random
import re
from pathlib import Path

import nltk
from gensim.models import Word2Vec

from .subtitles_loader import (
    get_subtitle_text,
    get_subtitle_lines,
    find_lines_with_word,
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ACTIVITIES_DIR = Path(__file__).resolve().parent.parent / "activities"

VOCAB_FILE = DATA_DIR / "vocabulary_candidates.json"
VOCAB_CONTEXT_FILE = DATA_DIR / "vocabulary_with_context.json"
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


# Cached so the 22 MB file is read once per process, not per request.
_context_cache = None


def load_vocabulary_with_context(movie_id):
    """
    Vocabulary with a pre-computed example line per word.

    The full subtitle corpus is excluded from the production image, so the
    example sentence for each word is computed offline and shipped in a
    smaller file. Returns None when that file is absent, which lets callers
    fall back to the original path.
    """
    global _context_cache

    if not VOCAB_CONTEXT_FILE.exists():
        return None

    if _context_cache is None:
        with open(VOCAB_CONTEXT_FILE, "r", encoding="utf-8") as f:
            _context_cache = json.load(f)

    return _context_cache.get(str(movie_id))


def load_word2vec_model():
    return Word2Vec.load(str(WORD2VEC_FILE))


def _same_part_of_speech(word, candidates):
    """
    Keep only candidates sharing the target word's part of speech.

    Without this, a verb can be offered against three nouns, and the answer
    is found by grammar rather than by knowing the word.
    """
    try:
        target = nltk.pos_tag([word])[0][1][:2]
        tagged = nltk.pos_tag(candidates)
        return [w for w, pos in tagged if pos[:2] == target]
    except LookupError:
        # POS tagger data unavailable — fall back to the unfiltered list.
        return candidates


def get_distractors(
    word,
    fallback_related,
    model,
    n=3,
):
    """
    Wrong options that share the target's part of speech and rough length,
    so the question tests the word rather than its shape.
    """
    try:
        similar = [
            w
            for w, score in model.wv.most_similar(word, topn=n * 5)
        ]
    except KeyError:
        similar = list(fallback_related)

    similar = [
        w
        for w in similar
        if w.lower() != word.lower()
    ]

    if len(similar) < n:
        return fallback_related, "fallback"

    same_pos = _same_part_of_speech(word, similar)
    pool = same_pos if len(same_pos) >= n else similar

    distractors = sorted(
        pool,
        key=lambda w: abs(len(w) - len(word)),
    )[:n]

    if len(distractors) < n:
        return fallback_related, "fallback"

    return distractors, "word2vec"


def _mask_word(sentence, word):
    """
    Replaces EVERY whole-word match with a blank.

    Masking only the first occurrence leaves the answer visible whenever the
    word appears twice in the same line.
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
    vocabulary = (
        load_vocabulary_with_context(movie_id)
        or load_vocabulary_for_movie(movie_id)
    )

    if not vocabulary:
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
        fallback_related = item.get("related", [])

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
                "context": item.get("context"),
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

    vocabulary = (
        load_vocabulary_with_context(movie_id)
        or load_vocabulary_for_movie(movie_id)
    )

    if not vocabulary:
        return []

    vocabulary = list(vocabulary)
    random.shuffle(vocabulary)

    questions = []

    for item in vocabulary:

        if len(questions) >= num_questions:
            break

        correct_word = item["word"]

        # Pre-computed example first; the subtitle file is only a fallback
        # and is absent in production.
        line = item.get("context")

        if not line and lines:
            matching_lines = find_lines_with_word(
                lines,
                correct_word,
            )

            if matching_lines:
                line = random.choice(matching_lines)

        if not line:
            continue

        distractors, source = get_distractors(
            correct_word,
            item.get("related", []),
            model,
            n=3,
        )

        # A question with fewer than three wrong options is not a question.
        if len(distractors) < 3:
            continue

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

    print("\n--- Sample quiz question ---")
    for question in activity["quiz"][:1]:
        print(question["context"])
        print("Options:", question["options"])
        print("Answer :", question["correct_word"])

    save_activity(
        test_movie_id,
        activity,
    )

    print(
        f"\nSaved to "
        f"activities/{test_movie_id}.json"
    )
