# Cinemix — Adaptive Learning & Activities

**Team role:** Person 4 — Adaptive Learning & Activities
**Owner:** ياسر القليطي (Yasser Alqulaiti)

This module is the "next-action logic" of Cinemix: it turns a finished
movie activity (a quiz or a speaking attempt) into an updated learner level
and a fresh, personalized movie recommendation. It's the piece that makes
the app *adaptive* — every teammate's part (Person 1's data, Person 2's
recommender, Person 3's speech/vision pipeline) flows through here to
actually change what the learner sees next.

---

## Table of contents

- [How it fits together](#how-it-fits-together)
- [Project structure](#project-structure)
- [Setup](#setup)
- [The one function you need](#the-one-function-you-need)
- [Mode 1: quiz](#mode-1-quiz)
- [Mode 2: speaking](#mode-2-speaking)
- [Required data files](#required-data-files)
- [Performance notes](#performance-notes)
- [Tests](#tests)
- [Known limitations](#known-limitations)

---

## How it fits together

```
 user watches a         user does ONE of:          this module scores it,
 recommended movie   →  Quick Quiz OR Speak     →  updates their level,
 (Person 2's pick)      About It (Person 3)         and asks Person 2 for
                                                     the next recommendation
```

Concretely: `build_full_activity()` builds the quiz/vocabulary/speaking
material for a movie, the learner interacts with it (elsewhere, in the
frontend), and the result — either quiz answers or Person 3's finished
speech/vision JSON — comes back into **`update_learner_profile()`**, which
is the single entry point everything else in this repo supports.

## Project structure

```
reellingo/
├── README.md               ← you are here
├── requirements.txt
├── adaptation_tests.py      unit tests (run: python adaptation_tests.py)
├── src/
│   ├── activities.py        builds vocabulary preview + 3-question quiz + speaking prompt
│   ├── subtitles_loader.py  reads real dialogue lines from Person 1's subtitle data
│   ├── scoring.py            grades a quiz attempt / a speaking attempt
│   ├── learner_profile.py    reads & writes profiles/{user_id}.json
│   ├── adaptation.py         raises/lowers level; update_learner_profile() lives here
│   ├── recommender.py        Person 2's real recommendation engine (integrated as-is)
│   └── mocks.py              stand-in for Person 3's data, for testing without her live system
├── data/                    Person 1 & Person 2's data files (see below) - not authored here
├── activities/              generated per-movie activity JSON (cache/output)
└── profiles/                one JSON file per learner
```

## Setup

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_md   # one-time; needed by recommender.py
```

`recommender.py` will try to auto-download `en_core_web_md` on first import
if it's missing, but that needs internet access at runtime — if your
deployment environment doesn't have that, run the download step above
ahead of time instead of relying on the fallback.

## The one function you need

```python
from src.adaptation import update_learner_profile

result = update_learner_profile(
    user_id=...,             # any string or number identifying the learner
    movie_id=7763,            # the movie they just did an activity for
    activity_mode="quiz",     # or "speaking" - never both for the same activity
    activity=activity,        # required for "quiz" mode - see below
    quiz_answers=[...],       # required for "quiz" mode - see below
    attempt_result=None,      # required for "speaking" mode - see below
    enjoyment_rating=None,    # optional, 1-5
)
```

Returns:
```python
{
    "profile": {...},              # the full updated learner profile
    "activity_score": 82.4,        # 0-100
    "level_before": "Beginner",
    "level_after": "Intermediate",
    "next_recommendations": [...], # 3 movies from Person 2's real recommender
}
```

Call this **once**, right after the learner finishes either the quiz or a
speaking attempt. Every other function in `src/` is internal plumbing this
one already uses — you shouldn't need to call them directly.

Passing something invalid (missing `activity` in quiz mode, missing
`attempt_result` in speaking mode, or an `activity_mode` that isn't `"quiz"`
or `"speaking"`) raises a `ValueError` with a message explaining exactly
what's missing — it won't fail silently or crash somewhere unrelated.

## Mode 1: quiz

1. Get the activity for the movie:
   ```python
   from src.activities import build_full_activity, load_word2vec_model
   model = load_word2vec_model()   # load ONCE at startup - see Performance notes
   activity = build_full_activity(movie_id, model)
   ```
   - `activity["quiz"]` — 3 questions, each with `correct_word` and 4 shuffled `options`. This is what gets graded.
   - `activity["vocabulary_grammar"]` — 5 words for the before-movie preview screen. Not graded, display only.
   - `activity["speaking_prompt"]` — currently unused by the real speaking flow (Person 3's system sources its own lines from Maram's curated data instead). Kept for reference.

2. Collect the learner's chosen word for each of the 3 questions, in order, as a plain list: `["photo", "hurt", "manage"]`

3. Call:
   ```python
   update_learner_profile(
       user_id=user_id, movie_id=movie_id, activity_mode="quiz",
       activity=activity, quiz_answers=["photo", "hurt", "manage"],
   )
   ```

## Mode 2: speaking

`attempt_result` is **not built by this module.** It's the finished JSON
Person 3's system produces after the learner records an attempt (local
Whisper transcription + browser MediaPipe vision) — see her
`INTEGRATION_CONTRACT.md` for the authoritative shape. Example:

```json
{
  "movieId": "50872",
  "lineId": "50872_004",
  "prototypeWordAccuracy": 87,
  "pronunciationScore": null,
  "fluencyScore": null,
  "visualSpeakingCheck": {
    "visualSpeakingDetected": true,
    "mouthMovementPercent": 42
  }
}
```

Hand that JSON straight to:
```python
update_learner_profile(
    user_id=user_id, movie_id=movie_id, activity_mode="speaking",
    attempt_result=that_json,
)
```

`pronunciationScore` and `fluencyScore` are always `null` in Person 3's real
system right now — that's not a bug on either side, her own contract says
to leave them null until a real pronunciation/fluency model exists. The
speaking score is computed only from `prototypeWordAccuracy` (90% weight)
and visual participation (10% weight), matching her own suggested formula
in `COMPUTER_VISION_PLAN.md`.

## Required data files

This module needs a `data/` folder next to `src/`, containing:

| File | Used by | Size |
|---|---|---|
| `movie_language_features.csv` | `recommender.py` | ~5MB |
| `subtitles_clean.csv` | `subtitles_loader.py` (via `activities.py`) | ~257MB |
| `vocabulary_candidates.json` | `activities.py` | ~14MB |
| `word2vec.model` | `activities.py` | ~13MB |
| `difficulty_config.json` | `adaptation.py` | <1KB |

These come from Person 1's and Person 2's work, not from this module. If
you received a code-only zip without a `data/` folder, nothing here will
run until you add these 5 files.

## Performance notes

- **`recommender.py` is self-caching.** The first call to `recommend_movies()`
  loads the model and builds vectors for all ~7300 movies (~60 seconds);
  every call after that reuses it instantly. This only works if your server
  is a long-running process — a serverless/stateless setup (fresh process
  per request) would pay that 60s cost on every cold start.
- **`load_word2vec_model()` in `activities.py` is *not* self-caching.** Load
  it once yourself when your server starts, and pass the same `model`
  object into every `build_full_activity()` call. Loading it per-request
  would reload a 12MB model from disk every single time.

## Tests

```bash
python adaptation_tests.py       # unit tests - grading logic, level up/down/clamped
python -m src.adaptation         # full end-to-end simulation, both modes, real data
```

## Known limitations

These are open items for the team, not bugs in this module:

- No initial placement test is built here — Person 5 is handling that
  separately with random questions for now.
- Person 3's real system can only ever produce 2 real speaking scores
  (word accuracy + visual participation), not the 4 dimensions
  (Pronunciation/Fluency/Pace/Relevance) some earlier frontend planning
  assumed — worth confirming the speaking-result screen reflects what's
  actually available.
- Nothing here has been wired into an actual web-callable API yet — that's
  part of the final integration.
