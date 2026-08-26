from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers.health import router as health_router
from backend.routers.users import router as users_router
from backend.routers.recommend import router as recommend_router
from backend.routers.quiz import router as quiz_router
from backend.routers.speaking import router as speaking_router
from backend.routers.movies import router as movies_router
from backend.routers.adaptive import router as adaptive_router
from backend.routers.adaptive_activity import router as adaptive_activity_router
from backend.routers.adaptive_vocabulary import router as adaptive_vocabulary_router

from backend.config import FRONTEND_URLS
from backend.database import create_tables




app = FastAPI()


# Create database tables when the backend starts
create_tables()


# Allow the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(health_router)
app.include_router(users_router)
app.include_router(recommend_router)
app.include_router(quiz_router)
app.include_router(speaking_router)
app.include_router(movies_router)
app.include_router(adaptive_router)
app.include_router(adaptive_activity_router)
app.include_router(adaptive_vocabulary_router)

# Home endpoint
@app.get("/")
def home():
    return {"message": "Cinemix backend is running"}
