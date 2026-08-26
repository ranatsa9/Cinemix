# Cinemix deployment

## 1. GitHub

Push this repository without any `.env` file. The included `.gitignore` excludes local secrets, build output, caches, databases, and the oversized subtitle source.

## 2. Railway — main API

Create a service from the GitHub repository.

- Dockerfile path: `Dockerfile.api`
- Health-check path: `/health`
- Environment variable after Vercel has a URL:
  - `FRONTEND_URLS=https://YOUR-VERCEL-DOMAIN.vercel.app`
- Optional persistent Railway volume mounted at `/data`:
  - `DATABASE_PATH=/data/cinemix.db`

The first start can take around 30 seconds while the recommender and adaptive NLP model load.

## 3. Railway — speech API

Create a second service from the same GitHub repository.

- Dockerfile path: `Dockerfile.speech`
- Health-check path: `/api/health`
- Environment variables:
  - `ELEVENLABS_API_KEY=...`
  - `ELEVENLABS_VOICE_ID=6iqsVA8buMHSkf9Dq9ZH`
  - `CINEMIX_WHISPER_MODEL=base.en`

The Whisper model downloads on the first transcription request, so the first attempt is slower than later attempts. Use a Railway service with enough memory for faster-whisper.

## 4. Vercel — frontend

Import the same GitHub repository as a Next.js project and add:

- `NEXT_PUBLIC_API_URL=https://YOUR-MAIN-API.up.railway.app`
- `NEXT_PUBLIC_SPEECH_API_URL=https://YOUR-SPEECH-API.up.railway.app`

Deploy, then copy the final Vercel domain into the main Railway service's `FRONTEND_URLS` variable and redeploy that service.

## 5. Production smoke test

1. Open the Vercel URL.
2. Complete onboarding and request recommendations.
3. Confirm movie cards load from the main Railway API.
4. Open a speaking activity and allow camera/microphone access.
5. Confirm a movie line loads.
6. Hear the ElevenLabs reference voice.
7. Record a take and confirm Whisper feedback appears.
8. Confirm the camera analysis remains local and no video is uploaded.

## Secret handling

The ElevenLabs key belongs only in the speech service's Railway environment variables. Do not place it in Vercel, source code, screenshots, GitHub, or any `NEXT_PUBLIC_*` variable.
