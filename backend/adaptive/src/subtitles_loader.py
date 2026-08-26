
import csv
import re
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SUBTITLES_FILE = DATA_DIR / "subtitles_clean.csv"

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


def get_subtitle_text(movie_id):
    # The large subtitle corpus is excluded from the production image. A
    # vocabulary preview can still work without an example line.
    if not SUBTITLES_FILE.exists():
        return None

    movie_id_str = str(movie_id)

    with open(SUBTITLES_FILE, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["movieId"] == movie_id_str:
                return row["clean_text"]

    return None


def get_subtitle_lines(movie_id, min_words=6, max_words=25, text=None):
    if text is None:
        text = get_subtitle_text(movie_id)
    if not text:
        return []

    sentences = SENTENCE_SPLIT_RE.split(text)
    lines = []
    for sentence in sentences:
        sentence = sentence.strip()
        word_count = len(sentence.split())
        if min_words <= word_count <= max_words:
            lines.append(sentence)

    return lines


def find_lines_with_word(lines, word):
    
    pattern = re.compile(r"\b" + re.escape(word) + r"\b", re.IGNORECASE)
    return [line for line in lines if pattern.search(line)]


if __name__ == "__main__":
    # Quick sanity check using movie 7763 (Winter Sleepers)
    test_movie_id = 7763

    print(f"Loading dialogue lines for movie {test_movie_id}...")
    lines = get_subtitle_lines(test_movie_id)
    print(f"Found {len(lines)} usable sentences (6-25 words).\n")

    for line in lines[:5]:
        print("-", line)

    matches = find_lines_with_word(lines, "difficult")
    print(f"\nLines containing 'difficult': {len(matches)}")
    for line in matches[:3]:
        print("-", line)
