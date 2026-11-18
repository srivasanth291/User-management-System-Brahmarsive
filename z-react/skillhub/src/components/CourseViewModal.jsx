
import { useEffect } from "react";

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidImageSource(value) {
  return (
    isValidUrl(value) ||
    /^data:image\/(jpeg|png|webp);base64,/.test(value || "")
  );
}

function CourseViewModal({ course, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!course) {
    return null;
  }

  const modules = Array.isArray(course.modules)
    ? course.modules
    : [];

  return (
    <div
      className="course-view-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="course-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-view-title"
      >
        <div className="course-view-header">
          <h2 id="course-view-title">Course Details</h2>

          <button
            type="button"
            className="course-view-close"
            onClick={onClose}
            aria-label="Close course details"
          >
            ×
          </button>
        </div>

        <div className="course-view-content">
         {course.thumbnailUrl && isValidImageSource(course.thumbnailUrl) ? (
            <img
              className="course-view-thumbnail"
              src={course.thumbnailUrl}
              alt={course.title}
            />
          ) : (
            <div className="course-view-placeholder">
              📚
            </div>
          )}

          <h2 className="course-view-name">
            {course.title}
          </h2>

          <div className="course-view-details">
            <div>
              <strong>Category</strong>
              <p>{course.category || "Not specified"}</p>
            </div>

            <div>
              <strong>Instructor</strong>
              <p>{course.instructor || "Not assigned"}</p>
            </div>

            <div>
              <strong>Total Modules</strong>
              <p>{modules.length}</p>
            </div>
          </div>

          <div className="course-view-description">
            <h3>Course Description</h3>
            <p>{course.description || "No description available."}</p>
          </div>

          <div className="course-view-modules">
            <h3>Course Modules ({modules.length})</h3>

            {modules.length === 0 ? (
              <p>No modules available for this course.</p>
            ) : (
              modules.map((module, moduleIndex) => {
                const quizzes = Array.isArray(module.quizzes)
                  ? module.quizzes
                  : [];

                return (
                  <div
                    className="course-view-module"
                    key={moduleIndex}
                  >
                    <h4>
                      Module {moduleIndex + 1}:{" "}
                      {module.moduleTitle || "Untitled Module"}
                    </h4>

                    <div className="course-view-video">
                      <strong>Video Title</strong>

                      <p>
                        {module.videoTitle || "Not available"}
                      </p>

                      {isValidUrl(module.videoUrl) && (
                        <a
                          href={module.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Watch Video ↗
                        </a>
                      )}
                    </div>

                    <div className="course-view-explanation">
                      <strong>Explanation</strong>

                      <p>
                        {module.blogText ||
                          "No explanation available."}
                      </p>
                    </div>

                    <div className="course-view-quiz-section">
                      <h4>Quiz Questions ({quizzes.length})</h4>

                      {quizzes.length === 0 ? (
                        <p>No quizzes available.</p>
                      ) : (
                        quizzes.map((quiz, quizIndex) => (
                          <div
                            className="course-view-quiz"
                            key={quizIndex}
                          >
                            <h5>
                              {quizIndex + 1}.{" "}
                              {quiz.question || "Untitled Question"}
                            </h5>

                            {["A", "B", "C"].map((option) => (
                              <p
                                key={option}
                                className={
                                  quiz.correct === option
                                    ? "course-view-correct"
                                    : ""
                                }
                              >
                                {option}.{" "}
                                {quiz.options?.[option] || "—"}

                                {quiz.correct === option && (
                                  <span> ✓ Correct Answer</span>
                                )}
                              </p>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="course-view-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseViewModal;
