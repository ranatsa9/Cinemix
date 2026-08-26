from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from backend.adaptive.src.adaptation import update_learner_profile


router = APIRouter()


class QuizActivity(BaseModel):
    quiz: List[Dict[str, Any]]


class AdaptiveUpdateRequest(BaseModel):
    user_id: str
    movie_id: int
    activity_mode: Literal["quiz", "speaking"]

    activity: Optional[Dict[str, Any]] = None
    quiz_answers: Optional[List[str]] = None
    attempt_result: Optional[Dict[str, Any]] = None

    enjoyment_rating: Optional[int] = None


@router.post("/adaptive/update")
def adaptive_update(data: AdaptiveUpdateRequest):
    result = update_learner_profile(
        user_id=data.user_id,
        movie_id=data.movie_id,
        activity_mode=data.activity_mode,
        activity=data.activity,
        quiz_answers=data.quiz_answers,
        attempt_result=data.attempt_result,
        enjoyment_rating=data.enjoyment_rating,
    )

    return {
        "activity_score": result["activity_score"],
        "level_before": result["level_before"],
        "level_after": result["level_after"],
        "next_recommendations": result["next_recommendations"],
        "profile": result["profile"],
    }