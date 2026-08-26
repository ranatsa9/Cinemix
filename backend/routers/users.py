from fastapi import APIRouter
from pydantic import BaseModel

from backend.database import get_connection

router = APIRouter()


class UserData(BaseModel):
    english_level: str
    learning_goal: str
    favorite_genre: str


@router.post("/users")
def create_user(user: UserData):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO users (english_level, learning_goal, favorite_genre)
        VALUES (?, ?, ?)
        """,
        (
            user.english_level,
            user.learning_goal,
            user.favorite_genre,
        ),
    )

    connection.commit()
    user_id = cursor.lastrowid
    connection.close()

    return {
        "message": "User saved successfully",
        "user_id": user_id,
    }
@router.get("/users")
def get_users():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()

    connection.close()

    return [dict(user) for user in users]