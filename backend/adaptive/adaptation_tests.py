# checks that the scoring and adaptation logic behaves correctly.

from backend.adaptive.src.scoring import score_quiz, score_speaking
from backend.adaptive.src.adaptation import adapt_level


def test_score_quiz_all_correct():
    activity = {
        "quiz": [
            {"correct_word": "cat"},
            {"correct_word": "dog"},
        ]
    }
    answers = ["cat", "dog"]

    assert score_quiz(activity, answers) == 100
    print("test_score_quiz_all_correct passed")


def test_score_quiz_all_wrong():
    activity = {
        "quiz": [
            {"correct_word": "cat"},
            {"correct_word": "dog"},
        ]
    }
    answers = ["fish", "bird"]

    assert score_quiz(activity, answers) == 0
    print("test_score_quiz_all_wrong passed")


def test_score_quiz_partial_credit():
    activity = {
        "quiz": [
            {"correct_word": "cat"},
            {"correct_word": "dog"},
            {"correct_word": "bird"},
        ]
    }

    # 1 out of 3 correct -> 100/3
    answers = ["cat", "wrong", "wrong"]

    score = score_quiz(activity, answers)

    assert round(score, 2) == round(100 / 3, 2)
    print("test_score_quiz_partial_credit passed")


def test_score_speaking_blends_word_accuracy_and_visual():
    # Match real contract shape (INTEGRATION_CONTRACT.md).
    # pronunciationScore/fluencyScore are null in the real system too.
    attempt_result = {
        "prototypeWordAccuracy": 90,
        "pronunciationScore": None,
        "fluencyScore": None,
        "visualSpeakingCheck": {
            "visualSpeakingDetected": True,
            "mouthMovementPercent": 50,
        },
    }

    # 0.9 * 90 + 0.1 * 50 = 86
    assert score_speaking(attempt_result) == 86
    print("test_score_speaking_blends_word_accuracy_and_visual passed")


def test_score_speaking_ignores_visual_when_not_detected():
    attempt_result = {
        "prototypeWordAccuracy": 90,
        "pronunciationScore": None,
        "fluencyScore": None,
        "visualSpeakingCheck": {
            "visualSpeakingDetected": False,
            "mouthMovementPercent": 50,
        },
    }

    # 0.9 * 90 + 0.1 * 0 = 81
    assert score_speaking(attempt_result) == 81
    print("test_score_speaking_ignores_visual_when_not_detected passed")


def test_adapt_level_raises_on_high_score():
    assert adapt_level("Beginner", 90) == "Intermediate"
    print("test_adapt_level_raises_on_high_score passed")


def test_adapt_level_lowers_on_low_score():
    assert adapt_level("Intermediate", 20) == "Beginner"
    print("test_adapt_level_lowers_on_low_score passed")


def test_adapt_level_stays_on_middle_score():
    assert adapt_level("Intermediate", 60) == "Intermediate"
    print("test_adapt_level_stays_on_middle_score passed")


def test_adapt_level_cannot_go_above_advanced():
    assert adapt_level("Advanced", 100) == "Advanced"
    print("test_adapt_level_cannot_go_above_advanced passed")


def test_adapt_level_cannot_go_below_beginner():
    assert adapt_level("Beginner", 0) == "Beginner"
    print("test_adapt_level_cannot_go_below_beginner passed")


if __name__ == "__main__":
    test_score_quiz_all_correct()
    test_score_quiz_all_wrong()
    test_score_quiz_partial_credit()
    test_score_speaking_blends_word_accuracy_and_visual()
    test_score_speaking_ignores_visual_when_not_detected()
    test_adapt_level_raises_on_high_score()
    test_adapt_level_lowers_on_low_score()
    test_adapt_level_stays_on_middle_score()
    test_adapt_level_cannot_go_above_advanced()
    test_adapt_level_cannot_go_below_beginner()

    print("\nAll tests passed!")