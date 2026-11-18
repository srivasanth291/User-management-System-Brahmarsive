import { useState } from "react";

const emptyQuestion = () => ({
  question: "",
  options: {
    A: "",
    B: "",
    C: "",
  },
  correct: "",
});

function QuizBuilder({ initialQuizzes, onSave, onBack, onDraftChange }) {
  const [quizzes, setQuizzes] = useState(
    () => initialQuizzes || [emptyQuestion(), emptyQuestion(), emptyQuestion()],
  );

function handleQuestionChange(index, value) {
  const updated = quizzes.map((quiz, i) =>
    i === index
      ? { ...quiz, question: value }
      : quiz
  );

  setQuizzes(updated);
  onDraftChange(updated);
}

function handleOptionChange(index, option, value) {
  const updated = quizzes.map((quiz, i) =>
    i === index
      ? {
          ...quiz,
          options: {
            ...quiz.options,
            [option]: value,
          },
        }
      : quiz
  );

  setQuizzes(updated);
  onDraftChange(updated);
}

function handleCorrectChange(index, value) {
  const updated = quizzes.map((quiz, i) =>
    i === index
      ? { ...quiz, correct: value }
      : quiz
  );

  setQuizzes(updated);
  onDraftChange(updated);
}

  function handleSubmit(event) {
    event.preventDefault();

    const isValid = quizzes.every(
      (quiz) =>
        quiz.question.trim() &&
        quiz.options.A.trim() &&
        quiz.options.B.trim() &&
        quiz.options.C.trim() &&
        quiz.correct,
    );

    if (!isValid) {
      alert("Please complete all three quiz questions.");
      return;
    }

    onSave(quizzes);
  }

  return (
    <div className="quiz-builder">
      <h2>Quiz Builder</h2>
      <p>Add three questions for this module.</p>

      <form className="course-form" onSubmit={handleSubmit}>
        {quizzes.map((quiz, index) => (
          <div className="quiz-question" key={index}>
            <h3>Question {index + 1}</h3>

            <div className="form-group">
              <label>Question *</label>
              <input
                type="text"
                value={quiz.question}
                onChange={(event) =>
                  handleQuestionChange(index, event.target.value)
                }
                placeholder="Enter your question"
                required
              />
            </div>

            {["A", "B", "C"].map((option) => (
              <div className="form-group" key={option}>
                <label>Option {option} *</label>
                <input
                  type="text"
                  value={quiz.options[option]}
                  onChange={(event) =>
                    handleOptionChange(index, option, event.target.value)
                  }
                  placeholder={`Enter option ${option}`}
                  required
                />
              </div>
            ))}

            <div className="correct-answer">
              <label>Correct Answer *</label>

              <div className="answer-options">
                {["A", "B", "C"].map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      value={option}
                      checked={quiz.correct === option}
                      onChange={() => handleCorrectChange(index, option)}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="course-form-actions">
          <button type="button" className="cancel-btn" onClick={onBack}>
            Back to Module
          </button>

          <button type="submit">Save Module</button>
        </div>
      </form>
    </div>
  );
}

export default QuizBuilder;
