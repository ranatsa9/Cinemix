# Cinemix audio clips

Place project-owned MP3 excerpts in this directory and register each one in
`manifest.json`:

```json
{
  "clips": [
    {
      "clipId": "movie-line-001",
      "movieId": "123",
      "movieTitle": "Example Movie",
      "text": "The exact dialogue spoken in the clip.",
      "file": "movie-line-001.mp3",
      "seconds": 4.2
    }
  ]
}
```

Set the matching row in `backend/data/practice_lines_top3.csv` to
`clipAvailable=True` and give it the same `clipId`. The speaking screen then
plays the registered clip first. If it is missing or cannot be loaded, Cinemix
automatically falls back to ElevenLabs and then browser speech synthesis.

Only commit audio that the project owns or has permission to distribute.
