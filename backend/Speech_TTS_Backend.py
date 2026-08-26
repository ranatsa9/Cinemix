"""Cinemix Speech / Whisper / Reela backend."""

import json
import os
import csv
import hashlib
import tempfile
import threading

from collections import defaultdict
from http.server import (
    SimpleHTTPRequestHandler,
    ThreadingHTTPServer,
)
from pathlib import Path
from urllib.parse import (
    parse_qs,
    urlparse,
)

import requests

from dotenv import load_dotenv
from faster_whisper import WhisperModel


# =========================================================
# PATHS / ENVIRONMENT
# =========================================================

ROOT = Path(__file__).resolve().parent

load_dotenv(
    ROOT / ".env",
    override=False,
)


# =========================================================
# CONFIG
# =========================================================

MODEL_SIZE = os.environ.get(
    "CINEMIX_WHISPER_MODEL",
    os.environ.get(
        "REELLINGO_WHISPER_MODEL",
        "base.en",
    ),
)

ELEVENLABS_VOICE_ID = os.environ.get(
    "ELEVENLABS_VOICE_ID",
    "",
).strip()

TTS_CACHE = (
    ROOT /
    ".cache" /
    "tts"
)


# =========================================================
# GLOBAL CACHE
# =========================================================

_model = None
_model_lock = threading.Lock()

_movie_catalog = None
_lines_by_movie = None

_recommender = None
_recommender_lock = threading.Lock()


# =========================================================
# RECOMMENDER
# =========================================================

def get_recommender():
    global _recommender

    with _recommender_lock:

        if _recommender is None:

            from backend.services.recommender import (
                MovieRecommender,
            )

            print(
                "Loading Cinemix "
                "hybrid recommender..."
            )

            _recommender = (
                MovieRecommender()
            )

    return _recommender


# =========================================================
# PRACTICE LINES
# =========================================================

def get_practice_data():
    """
    Load the prepared practice-line CSV
    once and cache it in memory.
    """

    global _movie_catalog
    global _lines_by_movie

    if _movie_catalog is not None:
        return (
            _movie_catalog,
            _lines_by_movie,
        )

    movies = {}

    lines = defaultdict(list)

    csv_path = (
        ROOT /
        "data" /
        "practice_lines_top3.csv"
    )

    if not csv_path.exists():

        raise FileNotFoundError(
            f"Practice lines file "
            f"not found: {csv_path}"
        )

    with csv_path.open(
        encoding="utf-8-sig",
        newline="",
    ) as source:

        reader = csv.DictReader(
            source
        )

        for row in reader:

            movie_id = str(
                row.get(
                    "movieId",
                    "",
                )
            ).strip()

            if not movie_id:
                continue

            movie_title = str(
                row.get(
                    "movieTitle",
                    "",
                )
            ).strip()

            imdb_id = str(
                row.get(
                    "imdbId",
                    "",
                )
            ).strip()

            year_raw = str(
                row.get(
                    "year",
                    "",
                )
            ).strip()

            genre = str(
                row.get(
                    "mainGenre",
                    "",
                )
            ).strip()

            line_id = str(
                row.get(
                    "lineId",
                    "",
                )
            ).strip()

            line_text = str(
                row.get(
                    "text",
                    "",
                )
            ).strip()

            level = str(
                row.get(
                    "provisionalLevel",
                    "",
                )
            ).strip()

            quality_raw = str(
                row.get(
                    "qualityScore",
                    "",
                )
            ).strip()

            year = (
                int(year_raw)
                if year_raw.isdigit()
                else year_raw
            )

            quality_score = (
                int(quality_raw)
                if quality_raw.isdigit()
                else None
            )

            movies[movie_id] = {
                "movieId":
                    movie_id,

                "imdbId":
                    imdb_id,

                "title":
                    movie_title,

                "year":
                    year,

                "genre":
                    genre,
            }

            if line_text:

                lines[movie_id].append(
                    {
                        "lineId":
                            line_id,

                        "text":
                            line_text,

                        "level":
                            level,

                        "qualityScore":
                            quality_score,
                    }
                )

    _movie_catalog = sorted(
        movies.values(),
        key=lambda movie:
            movie[
                "title"
            ].lower(),
    )

    _lines_by_movie = dict(
        lines
    )

    total_lines = sum(
        len(movie_lines)
        for movie_lines
        in _lines_by_movie.values()
    )

    print(
        f"Loaded "
        f"{len(_movie_catalog)} movies "
        f"and "
        f"{total_lines} "
        f"practice lines."
    )

    return (
        _movie_catalog,
        _lines_by_movie,
    )


# =========================================================
# WHISPER MODEL
# =========================================================

def get_model():
    global _model

    with _model_lock:

        if _model is None:

            print(
                f"Loading Whisper model: "
                f"{MODEL_SIZE}"
            )

            print(
                "The first run may "
                "download the model."
            )

            _model = WhisperModel(
                MODEL_SIZE,
                device="cpu",
                compute_type="int8",
            )

    return _model


# =========================================================
# HTTP HANDLER
# =========================================================

class ReelLingoHandler(
    SimpleHTTPRequestHandler
):

    # =====================================================
    # INIT
    # =====================================================

    def __init__(
        self,
        *args,
        **kwargs,
    ):

        super().__init__(
            *args,
            directory=str(ROOT),
            **kwargs,
        )

    # =====================================================
    # HEADERS / CORS
    # =====================================================

    def end_headers(self):

        self.send_header(
            "Access-Control-Allow-Origin",
            "*",
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS",
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            (
                "Content-Type, "
                "X-Expected-Text, "
                "X-Exercise-Mode"
            ),
        )

        self.send_header(
            "Cache-Control",
            (
                "no-store, "
                "no-cache, "
                "must-revalidate, "
                "max-age=0"
            ),
        )

        self.send_header(
            "Pragma",
            "no-cache",
        )

        self.send_header(
            "Expires",
            "0",
        )

        super().end_headers()

    # =====================================================
    # OPTIONS
    # =====================================================

    def do_OPTIONS(self):

        self.send_response(204)

        self.end_headers()

    # =====================================================
    # JSON RESPONSE
    # =====================================================

    def send_json(
        self,
        status,
        payload,
    ):

        body = json.dumps(
            payload,
            ensure_ascii=False,
        ).encode(
            "utf-8"
        )

        self.send_response(
            status
        )

        self.send_header(
            "Content-Type",
            (
                "application/json; "
                "charset=utf-8"
            ),
        )

        self.send_header(
            "Content-Length",
            str(
                len(body)
            ),
        )

        self.end_headers()

        self.wfile.write(
            body
        )

    # =====================================================
    # AUDIO RESPONSE
    # =====================================================

    def send_audio(
        self,
        audio,
    ):

        self.send_response(
            200
        )

        self.send_header(
            "Content-Type",
            "audio/mpeg",
        )

        self.send_header(
            "Content-Length",
            str(
                len(audio)
            ),
        )

        self.end_headers()

        self.wfile.write(
            audio
        )

    # =====================================================
    # GET
    # =====================================================

    def do_GET(self):

        parsed = urlparse(
            self.path
        )

        # -------------------------------------------------
        # HEALTH
        # -------------------------------------------------

        if parsed.path in {"/", "/api/health"}:

            self.send_json(
                200,
                {
                    "status":
                        "ok",

                    "transcription":
                        "faster-whisper",

                    "model":
                        MODEL_SIZE,
                },
            )

            return

        # -------------------------------------------------
        # MOVIES
        # -------------------------------------------------

        if (
            parsed.path ==
            "/api/movies"
        ):

            try:

                (
                    catalog,
                    _,
                ) = (
                    get_practice_data()
                )

                self.send_json(
                    200,
                    {
                        "movies":
                            catalog,

                        "count":
                            len(
                                catalog
                            ),
                    },
                )

            except Exception as exc:

                print(
                    "Movies error:",
                    repr(exc),
                )

                self.send_json(
                    500,
                    {
                        "error":
                            (
                                "Could not "
                                "load movies."
                            ),

                        "detail":
                            str(exc),
                    },
                )

            return

        # -------------------------------------------------
        # PRACTICE LINES
        # -------------------------------------------------

        if (
            parsed.path ==
            "/api/lines"
        ):

            movie_id = str(
                parse_qs(
                    parsed.query
                ).get(
                    "movieId",
                    [""],
                )[0]
            ).strip()

            if not movie_id:

                self.send_json(
                    400,
                    {
                        "error":
                            (
                                "movieId "
                                "is required."
                            )
                    },
                )

                return

            try:

                (
                    catalog,
                    lines_by_movie,
                ) = (
                    get_practice_data()
                )

                movie = next(
                    (
                        item
                        for item
                        in catalog
                        if str(
                            item[
                                "movieId"
                            ]
                        ).strip()
                        ==
                        movie_id
                    ),
                    None,
                )

                if not movie:

                    self.send_json(
                        404,
                        {
                            "error":
                                (
                                    f"Movie "
                                    f"{movie_id} "
                                    f"not found."
                                )
                        },
                    )

                    return

                movie_lines = (
                    lines_by_movie.get(
                        movie_id,
                        [],
                    )
                )

                self.send_json(
                    200,
                    {
                        "movie":
                            movie,

                        "lines":
                            movie_lines,

                        "count":
                            len(
                                movie_lines
                            ),
                    },
                )

            except Exception as exc:

                print(
                    "Practice lines error:",
                    repr(exc),
                )

                self.send_json(
                    500,
                    {
                        "error":
                            (
                                "Could not load "
                                "practice lines."
                            ),

                        "detail":
                            str(exc),
                    },
                )

            return

        # -------------------------------------------------
        # FALLBACK
        # -------------------------------------------------

        self.send_json(
            404,
            {"error": "Not found."},
        )

    # =====================================================
    # POST
    # =====================================================

    def do_POST(self):

        # -------------------------------------------------
        # RECOMMENDATION
        # -------------------------------------------------

        if (
            self.path ==
            "/api/recommend"
        ):

            self.generate_recommendations()

            return

        # -------------------------------------------------
        # REELA TTS
        # -------------------------------------------------

        if (
            self.path ==
            "/api/speak"
        ):

            self.generate_reference_speech()

            return

        # -------------------------------------------------
        # WHISPER
        # -------------------------------------------------

        if (
            self.path ==
            "/api/transcribe"
        ):

            self.transcribe_recording()

            return

        # -------------------------------------------------
        # NOT FOUND
        # -------------------------------------------------

        self.send_json(
            404,
            {
                "error":
                    "Not found"
            },
        )

    # =====================================================
    # WHISPER TRANSCRIPTION
    # =====================================================

    def transcribe_recording(self):

        try:

            length = int(
                self.headers.get(
                    "Content-Length",
                    "0",
                )
            )

            if (
                length <= 0
                or
                length >
                15 * 1024 * 1024
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            (
                                "Recording is "
                                "empty or too large."
                            )
                    },
                )

                return

            audio = (
                self.rfile.read(
                    length
                )
            )

            content_type = (
                self.headers.get(
                    "Content-Type",
                    "audio/webm",
                )
            )

            expected_text = (
                self.headers.get(
                    "X-Expected-Text",
                    "",
                )
                .strip()
                [:300]
            )

            exercise_mode = (
                self.headers.get(
                    "X-Exercise-Mode",
                    "line",
                )
            )

            suffix = (
                ".ogg"
                if "ogg"
                in content_type
                else ".webm"
            )

            temp_path = None

            try:

                with (
                    tempfile
                    .NamedTemporaryFile(
                        delete=False,
                        suffix=suffix,
                    )
                ) as recording:

                    recording.write(
                        audio
                    )

                    temp_path = (
                        recording.name
                    )

                segments, info = (
                    get_model()
                    .transcribe(
                        temp_path,

                        language=
                            "en",

                        task=
                            "transcribe",

                        beam_size=
                            5,

                        vad_filter=
                            True,

                        condition_on_previous_text=
                            False,

                        # Do not feed the expected answer back into
                        # Whisper. Doing so can make the recognizer
                        # "correct" a different spoken word into the
                        # target word and create a false 100% score.
                        # The expected text is used only by the exact
                        # word matcher in the frontend after unbiased
                        # transcription.
                        initial_prompt=None,

                        hotwords=None,
                    )
                )

                segment_list = list(
                    segments
                )

                transcript = " ".join(
                    segment.text.strip()
                    for segment
                    in segment_list
                ).strip()

                duration = max(
                    (
                        segment.end
                        for segment
                        in segment_list
                    ),
                    default=0.0,
                )

                self.send_json(
                    200,
                    {
                        "transcript":
                            transcript,

                        "language":
                            info.language,

                        "languageProbability":
                            round(
                                info
                                .language_probability,
                                3,
                            ),

                        "speechDurationSeconds":
                            round(
                                duration,
                                2,
                            ),

                        "model":
                            MODEL_SIZE,
                    },
                )

            finally:

                if temp_path:

                    Path(
                        temp_path
                    ).unlink(
                        missing_ok=True
                    )

        except Exception as exc:

            print(
                "Transcription error:",
                repr(exc),
            )

            self.send_json(
                500,
                {
                    "error":
                        (
                            "Whisper could "
                            "not transcribe "
                            "this recording."
                        ),

                    "detail":
                        str(exc),
                },
            )

    # =====================================================
    # REELA TEXT TO SPEECH
    # =====================================================

    def generate_reference_speech(
        self
    ):

        api_key = (
            os.environ.get(
                "ELEVENLABS_API_KEY",
                "",
            )
            .strip()
        )

        if not api_key:

            self.send_json(
                503,
                {
                    "error":
                        (
                            "Reela is not "
                            "configured."
                        )
                },
            )

            return

        if not ELEVENLABS_VOICE_ID:

            self.send_json(
                503,
                {
                    "error":
                        (
                            "Reela voice ID "
                            "is not configured."
                        )
                },
            )

            return

        try:

            length = int(
                self.headers.get(
                    "Content-Length",
                    "0",
                )
            )

            if (
                length <= 0
                or
                length > 4096
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            (
                                "Speech request "
                                "is empty "
                                "or too large."
                            )
                    },
                )

                return

            payload = json.loads(
                self.rfile.read(
                    length
                )
            )

            text = str(
                payload.get(
                    "text",
                    "",
                )
            ).strip()

            if (
                not text
                or
                len(text) > 500
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            (
                                "Text must contain "
                                "1–500 characters."
                            )
                    },
                )

                return

            cache_key = (
                hashlib
                .sha256(
                    (
                        f"{ELEVENLABS_VOICE_ID}:"
                        f"{text}"
                    ).encode(
                        "utf-8"
                    )
                )
                .hexdigest()
            )

            cache_path = (
                TTS_CACHE /
                f"{cache_key}.mp3"
            )

            if (
                cache_path.exists()
            ):

                self.send_audio(
                    cache_path
                    .read_bytes()
                )

                return

            response = requests.post(
                (
                    "https://api.elevenlabs.io/"
                    "v1/text-to-speech/"
                    f"{ELEVENLABS_VOICE_ID}"
                ),

                headers={
                    "xi-api-key":
                        api_key,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "audio/mpeg",
                },

                json={
                    "text":
                        text,

                    "model_id":
                        "eleven_flash_v2_5",
                },

                timeout=30,
            )

            if not response.ok:

                print(
                    f"ElevenLabs error "
                    f"{response.status_code}: "
                    f"{response.text[:500]}"
                )

                self.send_json(
                    502,
                    {
                        "error":
                            (
                                "Reela could not "
                                "generate audio."
                            )
                    },
                )

                return

            TTS_CACHE.mkdir(
                parents=True,
                exist_ok=True,
            )

            cache_path.write_bytes(
                response.content
            )

            self.send_audio(
                response.content
            )

        except Exception as exc:

            print(
                "Text-to-speech error:",
                repr(exc),
            )

            self.send_json(
                500,
                {
                    "error":
                        (
                            "Reela audio "
                            "generation failed."
                        ),

                    "detail":
                        str(exc),
                },
            )

    # =====================================================
    # RECOMMENDATIONS
    # =====================================================

    def generate_recommendations(
        self
    ):

        try:

            length = int(
                self.headers.get(
                    "Content-Length",
                    "0",
                )
            )

            if (
                length <= 0
                or
                length >
                64 * 1024
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            (
                                "Recommendation "
                                "profile is empty "
                                "or too large."
                            )
                    },
                )

                return

            payload = json.loads(
                self.rfile.read(
                    length
                )
            )

            profile = (
                payload.get(
                    "profile",
                    payload,
                )
            )

            top_n = max(
                1,
                min(
                    int(
                        payload.get(
                            "topN",
                            5,
                        )
                    ),
                    20,
                ),
            )

            recommendations = (
                get_recommender()
                .recommend(
                    profile,
                    top_n=top_n,
                )
            )

            self.send_json(
                200,
                {
                    "recommendations":
                        recommendations,

                    "count":
                        len(
                            recommendations
                        ),

                    "model":
                        (
                            "hybrid-v3-"
                            "word2vec"
                        ),
                },
            )

        except Exception as exc:

            print(
                "Recommendation error:",
                repr(exc),
            )

            self.send_json(
                500,
                {
                    "error":
                        (
                            "The recommendation "
                            "model could not "
                            "complete this request."
                        ),

                    "detail":
                        str(exc),
                },
            )


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    host = os.environ.get(
        "HOST",
        "0.0.0.0",
    )

    port = int(
        os.environ.get(
            "PORT",
            "8001",
        )
    )

    server = ThreadingHTTPServer(
        (
            host,
            port,
        ),
        ReelLingoHandler,
    )

    print(
        "Cinemix Speech backend "
        "is running at "
        f"http://{host}:{port}/"
    )

    print(
        "ElevenLabs configured:",
        bool(
            os.environ.get(
                "ELEVENLABS_API_KEY",
                "",
            ).strip()
        ),
    )

    print(
        "Reela voice ID:",
        (
            ELEVENLABS_VOICE_ID
            if ELEVENLABS_VOICE_ID
            else "NOT CONFIGURED"
        ),
    )

    print(
        "Practice lines file:",
        (
            ROOT /
            "data" /
            "practice_lines_top3.csv"
        ),
    )

    try:

        server.serve_forever()

    except KeyboardInterrupt:

        print(
            "\nStopping Cinemix."
        )
