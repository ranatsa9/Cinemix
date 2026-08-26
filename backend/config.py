import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent

FRONTEND_URLS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get(
        "FRONTEND_URLS",
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
    ).split(",")
    if origin.strip()
]

DATABASE_PATH = Path(
    os.environ.get("DATABASE_PATH", PROJECT_DIR / "cinemix.db")
).expanduser()
