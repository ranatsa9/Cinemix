from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Query


router = APIRouter()


DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "movie_catalogue.csv"
)


def load_movies():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Movie catalogue not found: {DATA_PATH}"
        )

    df = pd.read_csv(
        DATA_PATH,
        engine="python",
        on_bad_lines="skip",
    )

    # Make sure important fields exist
    required_columns = [
        "movieId",
        "clean_title",
        "poster_url",
    ]

    for column in required_columns:
        if column not in df.columns:
            raise ValueError(
                f"Missing required column: {column}"
            )

    # Remove rows without usable movie information
    df = df.dropna(
        subset=[
            "movieId",
            "clean_title",
            "poster_url",
        ]
    )

    # Remove empty / invalid poster URLs
    df["poster_url"] = (
        df["poster_url"]
        .astype(str)
        .str.strip()
    )

    df = df[
        (df["poster_url"] != "")
        & (df["poster_url"].str.lower() != "nan")
    ]

    return df


@router.get("/movies")
def get_movies(
    genre: str | None = Query(
        default=None,
        description="Optional genre filter, e.g. Comedy or Action",
    ),
    limit: int = Query(
        default=40,
        ge=1,
        le=100,
    ),
):
    df = load_movies()

    # Filter by genre if requested
    if genre:
        if "genres" in df.columns:
            df = df[
                df["genres"]
                .fillna("")
                .astype(str)
                .str.contains(
                    genre,
                    case=False,
                    regex=False,
                )
            ]

    # Prefer popular / well-rated movies
    sort_columns = []

    if "popularity" in df.columns:
        df["popularity"] = pd.to_numeric(
            df["popularity"],
            errors="coerce",
        ).fillna(0)

        sort_columns.append("popularity")

    if "vote_average" in df.columns:
        df["vote_average"] = pd.to_numeric(
            df["vote_average"],
            errors="coerce",
        ).fillna(0)

        sort_columns.append("vote_average")

    if sort_columns:
        df = df.sort_values(
            by=sort_columns,
            ascending=False,
        )

    df = df.head(limit)

    movies = []

    for _, row in df.iterrows():

        movie_id = int(row["movieId"])

        title = str(
            row.get(
                "clean_title",
                row.get("title", "Unknown Movie"),
            )
        )

        year = row.get("year", None)

        if pd.isna(year):
            year = None
        else:
            try:
                year = int(year)
            except (ValueError, TypeError):
                year = None

        genres = str(
            row.get("genres", "")
        )

        genre_list = [
            g.strip()
            for g in genres.split("|")
            if g.strip()
        ]

        overview = row.get(
            "overview",
            "",
        )

        if pd.isna(overview):
            overview = ""

        runtime = row.get(
            "runtime",
            None,
        )

        if pd.isna(runtime):
            runtime = None
        else:
            try:
                runtime = int(float(runtime))
            except (ValueError, TypeError):
                runtime = None

        popularity = row.get(
            "popularity",
            0,
        )

        vote_average = row.get(
            "vote_average",
            0,
        )

        movies.append(
            {
                "movie_id": movie_id,
                "title": title,
                "year": year,
                "genres": genre_list,
                "poster_url": str(
                    row["poster_url"]
                ),
                "overview": str(overview),
                "runtime": runtime,
                "popularity": float(popularity),
                "vote_average": float(vote_average),
            }
        )

    return {
        "count": len(movies),
        "movies": movies,
    }