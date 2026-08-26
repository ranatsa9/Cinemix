from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SpeakingRequest(BaseModel):
    movie_id: int
    transcript: str


@router.post("/speaking")
def analyze_speaking(data: SpeakingRequest):
    return {
        "movie_id": data.movie_id,
        "pronunciation": 67,
        "fluency": 59,
        "pace": 78,
        "relevance": 75,
        "overall": 68,
        "feedback": [
            "Focus on enunciating key words a little more clearly.",
            "Try reducing long pauses to improve fluency.",
            "Try connecting your answer more directly to the question."
        ],
        "message": "Temporary speaking endpoint. Real speaking analysis will be connected later."
    }