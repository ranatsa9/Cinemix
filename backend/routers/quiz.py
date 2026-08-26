from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()


class QuizAnswer(BaseModel):
    question_id: int
    selected_answer: str
    correct_answer: str


class QuizRequest(BaseModel):
    movie_id: int
    answers: List[QuizAnswer]


@router.post("/quiz")
def submit_quiz(data: QuizRequest):
    correct = sum(
        1
        for answer in data.answers
        if answer.selected_answer == answer.correct_answer
    )

    total = len(data.answers)

    score = round((correct / total) * 100) if total > 0 else 0

    return {
        "movie_id": data.movie_id,
        "correct": correct,
        "total": total,
        "score": score,
        "message": "Temporary quiz endpoint. Real quiz logic will be connected later."
    }