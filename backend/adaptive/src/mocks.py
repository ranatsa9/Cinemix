import random

def mock_attempt_result(movie_id, line_id=None):
    return {
        "movieId": str(movie_id),
        "lineId": line_id or f"{movie_id}_001",
        "expectedText": "You must not let anyone define your limits.",
        "transcript": "You must not let anyone define your limits.",
        "prototypeWordAccuracy": round(random.uniform(55, 95), 1),
        "pronunciationScore": None,
        "fluencyScore": None,
        "missingWords": [],
        "extraWords": [],
        "visualSpeakingCheck": {
            "enabled": True,
            "faceVisiblePercent": round(random.uniform(70, 99), 1),
            "mouthMovementPercent": round(random.uniform(30, 80), 1),
            "maxJawOpen": round(random.uniform(0.2, 0.7), 2),
            "visualSpeakingDetected": True,
        },
        "skippedWords": [],
        "attemptNumber": 1,
    }


if __name__ == "__main__":
    import json

    print("mock_attempt_result (matches Person 3's real contract shape):")
    print(json.dumps(mock_attempt_result(7763), indent=2))
