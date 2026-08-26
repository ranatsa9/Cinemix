
def score_quiz(activity, answers):
    # activity["quiz"]: the 3 questions built by activities.py, each has "correct_word"
    # answers: the user's chosen word for each question, in the same order
    questions = activity.get("quiz", [])
    if len(questions) == 0:
        return 0

    correct_count = 0
    for question, answer in zip(questions, answers):
        if answer == question["correct_word"]:
            correct_count += 1

    return (correct_count / len(questions)) * 100


def score_speaking(attempt_result):
    word_accuracy = attempt_result.get("prototypeWordAccuracy", 0)

    visual = attempt_result.get("visualSpeakingCheck") or {}
    if visual.get("visualSpeakingDetected"):
        visual_score = visual.get("mouthMovementPercent", 0)
    else:
        visual_score = 0

    # Weights match COMPUTER_VISION_PLAN.md formula
    # (finalScore = speechScore*0.90 + visualParticipationScore*0.10) 
    return round(0.9 * word_accuracy + 0.1 * visual_score, 1)


if __name__ == "__main__":
    from src.activities import build_full_activity, load_word2vec_model
    from src.mocks import mock_attempt_result

    test_movie_id = 7763

    print("Loading Word2Vec model and building a test activity...")
    model = load_word2vec_model()
    activity = build_full_activity(test_movie_id, model)

    # Pretend the user answered every quiz question correctly
    perfect_answers = [q["correct_word"] for q in activity["quiz"]]
    quiz_score = score_quiz(activity, perfect_answers)
    print(f"\nQuiz score with all correct answers: {quiz_score}")

    attempt_result = mock_attempt_result(test_movie_id)
    speaking_score = score_speaking(attempt_result)
    print(f"Attempt result (mock, matches Person 3's real shape): {attempt_result}")
    print(f"Speaking score: {speaking_score}")
