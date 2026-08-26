# Cinemix

**Level up your English, one scene at a time.**

Cinemix is an adaptive movie recommendation and language-learning experience. It recommends films using the learner's English level and taste, then reinforces learning through real subtitle vocabulary, speaking practice, local browser vision, and adaptive feedback.

## Architecture

- **Frontend:** Next.js 16, React 19, MediaPipe browser vision
- **Main API:** FastAPI, hybrid recommender, adaptive learning, SQLite
- **Speech API:** faster-whisper transcription and ElevenLabs reference voice
- **Data:** movie catalogue, language features, Word2Vec model, vocabulary candidates, and prepared practice lines

The production deployment uses three services:

1. Vercel — Next.js frontend
2. Railway — main FastAPI service (`Dockerfile.api`)
3. Railway — speech service (`Dockerfile.speech`)

## Local development

Use Node.js 20.9 or newer and Python 3.12.

```bash
npm install
npm run dev
```

Main API:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-main.txt
python -m spacy download en_core_web_md
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Speech API:

```bash
python -m venv .venv-speech
source .venv-speech/bin/activate
pip install -r backend/requirements-speech.txt
PORT=8001 python -m backend.Speech_TTS_Backend
```

Copy `.env.example` to the appropriate platform settings. Never commit the real ElevenLabs key.

## Verified before deployment

- Next.js production build passes
- Main API health, movie catalogue, recommendation, and CORS checks pass
- Speech API health, movie-line lookup, and CORS checks pass
- Public speech routes do not expose backend files
- Real `.env` files and API keys are excluded from Git

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact Vercel and Railway setup.


Project google drive 
https://drive.google.com/drive/folders/13OXh9sDsF7TOkBP7OdiQohPV-Dzxi1sY

Deployment link
https://cinemix-murex.vercel.app/


