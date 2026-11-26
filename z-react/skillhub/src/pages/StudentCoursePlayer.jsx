
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppSelector } from "../store/hooks";
import { useCourseMappings } from "../context/CourseMappingContext";
import "./StudentCoursePlayer.css";
import { api, postJson } from "../api/client";

function emptyProgress() { return { selectedModule: 0, completedModules: [], scores: {} }; }

function getVideoUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === "youtu.be" || host === "www.youtu.be") {
      const videoId = parsed.pathname.slice(1);
      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : "";
    }

    if (host === "youtube.com" || host === "www.youtube.com") {
      if (parsed.pathname === "/watch") {
        const videoId = parsed.searchParams.get("v");

        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : "";
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const videoId = parsed.pathname.split("/")[2];

        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : "";
      }
    }

    if (host === "vimeo.com" || host === "www.vimeo.com") {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];

      if (/^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return url;
    }

    return "";
  } catch {
    return "";
  }
}

function StudentCoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const courses = useAppSelector((state) => state.courses.items);
  const { mappings } = useCourseMappings();

  const studentId = String(currentUser?.id ?? "");

  const course = courses.find(
    (item) => String(item.id) === String(courseId)
  );

  const isAssigned = mappings.some(
    (item) =>
      String(item.studentId) === studentId &&
      String(item.courseId) === String(courseId)
  );

  const modules = course?.modules || [];
  const storageKey = `skillhub_progress_${studentId}_${courseId}`;

  const [progressState, setProgressState] = useState(() => ({
    key: storageKey,
    data: emptyProgress(),
  }));

  const [answersState, setAnswersState] = useState({
    key: storageKey,
    moduleIndex: 0,
    answers: {},
  });

  const [quizResult, setQuizResult] = useState(null);

  const progress =
    progressState.key === storageKey
      ? progressState.data
      : emptyProgress();

  const selectedIndex = Math.min(
    Math.max(Number(progress.selectedModule) || 0, 0),
    Math.max(modules.length - 1, 0)
  );

  const selectedModule = modules[selectedIndex];
  const quizzes = selectedModule?.quizzes || [];

  const answers =
    answersState.key === storageKey &&
    answersState.moduleIndex === selectedIndex
      ? answersState.answers
      : {};

  const completedModules = [
    ...new Set(progress.completedModules),
  ].filter(
    (index) =>
      Number.isInteger(index) &&
      index >= 0 &&
      index < modules.length
  );

  const completedCount = completedModules.length;

  const percentage = modules.length
    ? Math.round((completedCount / modules.length) * 100)
    : 0;

  const currentModuleCompleted =
    completedModules.includes(selectedIndex);

  useEffect(() => {
    setProgressState({
      key: storageKey,
      data: emptyProgress(),
    });

    setAnswersState({
      key: storageKey,
      moduleIndex: 0,
      answers: {},
    });

    setQuizResult(null);
  }, [storageKey]);

  useEffect(() => {
    if (!isAssigned || !course) return;
    let active = true;
    api(`/api/courses/${courseId}/progress`).then(result => {
      if (!active) return;
      const completedModules = (result.modules || []).flatMap((module, index) => module.completed ? [index] : []);
      setProgressState(previous => ({key: storageKey, data: {
        selectedModule: previous.key === storageKey ? previous.data.selectedModule : 0,
        completedModules, scores: {}
      }}));
    }).catch(error => { if (active) setQuizResult({message:error.message,error:true}); });
    return () => { active = false; };
  }, [courseId, isAssigned, course?.id, storageKey]);

  function updateProgress(updater) {
    setProgressState((previous) => {
      const current =
        previous.key === storageKey
          ? previous.data
          : emptyProgress();

      const updated = updater(current);

      return {
        key: storageKey,
        data: updated,
      };
    });
  }

  function selectModule(index) {
    if (index < 0 || index >= modules.length) return;

    updateProgress((previous) => ({
      ...previous,
      selectedModule: index,
    }));

    setAnswersState({
      key: storageKey,
      moduleIndex: index,
      answers: {},
    });

    setQuizResult(null);
  }

  function handleAnswer(questionIndex, option) {
    setAnswersState((previous) => {
      const previousAnswers =
        previous.key === storageKey &&
        previous.moduleIndex === selectedIndex
          ? previous.answers
          : {};

      return {
        key: storageKey,
        moduleIndex: selectedIndex,
        answers: {
          ...previousAnswers,
          [questionIndex]: option,
        },
      };
    });

    setQuizResult(null);
  }

  async function submitQuiz() {
    if (!quizzes.length) return;
    if (quizzes.some((_, index) => !answers[index])) {
      setQuizResult({message: "Please answer all questions first.", error:true}); return;
    }
    try {
      const submitted = Object.fromEntries(quizzes.map((q, index) => [q.id, q.optionIds[answers[index]]]));
      const result = await api(`/api/modules/${selectedModule.id}/quiz/submit`, postJson({answers: submitted}));
      const passed = result.score >= 70;
      if (passed) await api(`/api/modules/${selectedModule.id}/complete`,postJson({}));
      setQuizResult({message:`Your score: ${result.correctAnswers}/${result.totalQuestions} (${result.score}%). ${passed ? 'Module completed!' : 'Minimum 70% required. Try again.'}`,error:!passed});
      updateProgress(previous => ({...previous, scores:{...previous.scores,[selectedIndex]:result.score},completedModules:passed ? [...new Set([...previous.completedModules,selectedIndex])] : previous.completedModules}));
    } catch(error) { setQuizResult({message:error.message,error:true}); }
  }

  async function completeModule() {
    try {
      await api(`/api/modules/${selectedModule.id}/complete`,postJson({}));
      updateProgress(previous => ({...previous,completedModules:[...new Set([...previous.completedModules,selectedIndex])]}));
      setQuizResult({message:'Module completed!',error:false});
    } catch(error) { setQuizResult({message:error.message,error:true}); }
  }

  if (!course || !isAssigned) {
    return (
      <div className="student-player-empty">
        <h2>Course not available</h2>
        <p>This course is not assigned to your account.</p>

        <button
          type="button"
          onClick={() => navigate("/student/courses")}
        >
          Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className="student-course-player">
      <div className="student-player-header">
        <button
          type="button"
          onClick={() => navigate("/student/courses")}
        >
          ← Back
        </button>

        <div>
          <h2>{course.title}</h2>
          <p>
            {completedCount} of {modules.length} modules completed
          </p>
        </div>

        <strong>{percentage}% Complete</strong>
      </div>

      <div className="student-player-progress">
        <div style={{ width: `${percentage}%` }} />
      </div>

      <div className="student-player-layout">
        <aside className="student-module-sidebar">
          <h3>Course Modules</h3>

          {modules.map((module, index) => {
            const completed = completedModules.includes(index);

            return (
              <button
                type="button"
                key={index}
                className={`student-module-item ${
                  selectedIndex === index ? "active" : ""
                } ${completed ? "completed" : ""}`}
                onClick={() => selectModule(index)}
              >
                <span>{completed ? "✓" : "▶"}</span>

                <span>
                  <strong>Module {index + 1}</strong>
                  <small>{module.moduleTitle}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <main className="student-lesson-content">
          {selectedModule ? (
            <>
              <h2>{selectedModule.moduleTitle}</h2>

              <p className="student-lesson-subtitle">
                {selectedModule.videoTitle}
              </p>

              <div className="student-video-container">
                {selectedModule.videoUrl &&
                getVideoUrl(selectedModule.videoUrl) ? (
                  <iframe
                    key={`${courseId}-${selectedIndex}`}
                    src={getVideoUrl(selectedModule.videoUrl)}
                    title={
                      selectedModule.videoTitle || "Lesson Video"
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <p>No lesson video available.</p>
                )}
              </div>

              <section className="student-lesson-section">
                <h3>Lesson Explanation</h3>

                <p>
                  {selectedModule.blogText ||
                    "No explanation available."}
                </p>
              </section>

              <section className="student-lesson-section">
                <h3>Module Quiz</h3>

                {quizzes.length > 0 ? (
                  <>
                    {quizzes.map((quiz, questionIndex) => (
                      <div
                        className="student-quiz-question"
                        key={questionIndex}
                      >
                        <h4>
                          {questionIndex + 1}. {quiz.question}
                        </h4>

                        {Object.entries(quiz.options || {}).map(
                          ([option, value]) => (
                            <label key={option}>
                              <input
                                type="radio"
                                name={`question-${selectedIndex}-${questionIndex}`}
                                value={option}
                                checked={
                                  answers[questionIndex] === option
                                }
                                onChange={() =>
                                  handleAnswer(
                                    questionIndex,
                                    option
                                  )
                                }
                              />

                              {option}. {value}
                            </label>
                          )
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className="student-primary-btn"
                      onClick={submitQuiz}
                    >
                      Submit Quiz
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="student-primary-btn"
                    onClick={completeModule}
                    disabled={currentModuleCompleted}
                  >
                    {currentModuleCompleted
                      ? "Module Completed ✓"
                      : "Mark Module Complete"}
                  </button>
                )}

                {quizResult && (
                  <p
                    className={
                      quizResult.error
                        ? "student-quiz-result error"
                        : "student-quiz-result success"
                    }
                    role="status"
                  >
                    {quizResult.message}
                  </p>
                )}
              </section>

              <div className="student-lesson-navigation">
                <button
                  type="button"
                  disabled={selectedIndex === 0}
                  onClick={() =>
                    selectModule(selectedIndex - 1)
                  }
                >
                  ← Previous Module
                </button>

                <button
                  type="button"
                  disabled={
                    selectedIndex === modules.length - 1 ||
                    !currentModuleCompleted
                  }
                  onClick={() =>
                    selectModule(selectedIndex + 1)
                  }
                >
                  Next Module →
                </button>
              </div>
            </>
          ) : (
            <p>No modules available in this course.</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentCoursePlayer;
