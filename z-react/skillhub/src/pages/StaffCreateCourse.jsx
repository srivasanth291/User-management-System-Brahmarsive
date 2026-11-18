
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { useCourses } from "../context/CourseContext";
import ModuleBuilder from "../components/ModuleBuilder";
import QuizBuilder from "../components/QuizzBuilder";
import "./AdminCourses.css";

const emptyForm = {
  title: "",
  category: "",
  thumbnailUrl: "",
  description: "",
};

function loadDraft(key) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) return null;

    const draft = JSON.parse(saved);

    return {
      courseForm: {
        ...emptyForm,
        ...draft.courseForm,
      },
      modules: Array.isArray(draft.modules) ? draft.modules : [],
      moduleData: draft.moduleData || null,
      quizData: draft.quizData || null,
      step: [1, 2, 3, 4].includes(draft.step) ? draft.step : 1,
    };
  } catch {
    return null;
  }
}

function StaffCreateCourse() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { users } = useUsers();
  const { addCourse } = useCourses();

  const staffId = String(currentUser?.id ?? "");
  const draftKey = `skillhub_staff_course_draft_${staffId}`;

  const staff = users.find(
    (user) => String(user.id) === staffId
  );

  const permissions = staff?.permissions || [];

  const canCreate =
    (staff?.role || "").toLowerCase() === "staff" &&
    (staff?.status || "Active").toLowerCase() === "active" &&
    (Array.isArray(permissions)
      ? permissions.includes("Create Course")
      : permissions.createCourse === true);

  const [savedDraft] = useState(() => loadDraft(draftKey));

  const [step, setStep] = useState(savedDraft?.step || 1);

  const [courseForm, setCourseForm] = useState(
    savedDraft?.courseForm || { ...emptyForm }
  );

  const [modules, setModules] = useState(
    savedDraft?.modules || []
  );

  const [moduleData, setModuleData] = useState(
    savedDraft?.moduleData || null
  );

  const [quizData, setQuizData] = useState(
    savedDraft?.quizData || null
  );

  const [thumbnailMode, setThumbnailMode] = useState(
    savedDraft?.courseForm?.thumbnailUrl?.startsWith("data:image/")
      ? "upload"
      : "url"
  );

  const hasDraft =
    Object.values(courseForm).some(
      (value) => String(value ?? "").trim() !== ""
    ) ||
    modules.length > 0 ||
    moduleData !== null ||
    quizData !== null;

  useEffect(() => {
    if (!canCreate) return;

    try {
      if (!hasDraft) {
        localStorage.removeItem(draftKey);
        return;
      }

      localStorage.setItem(
        draftKey,
        JSON.stringify({
          courseForm,
          modules,
          moduleData,
          quizData,
          step,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Unable to save staff draft:", error);
    }
  }, [
    canCreate,
    draftKey,
    hasDraft,
    courseForm,
    modules,
    moduleData,
    quizData,
    step,
  ]);

  function handleChange(event) {
    const { name, value } = event.target;

    setCourseForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function changeThumbnailMode(mode) {
    setThumbnailMode(mode);

    setCourseForm((previous) => ({
      ...previous,
      thumbnailUrl: "",
    }));
  }

  function handleThumbnailUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only JPG and PNG images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Maximum image size is 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(
          1,
          900 / image.width,
          600 / image.height
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(
          1,
          Math.round(image.width * scale)
        );

        canvas.height = Math.max(
          1,
          Math.round(image.height * scale)
        );

        const context = canvas.getContext("2d");

        if (!context) {
          alert("Unable to process image.");
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const result = canvas.toDataURL("image/jpeg", 0.72);

        if (result.length > 650000) {
          alert("Image is too large for browser storage.");
          return;
        }

        setCourseForm((previous) => ({
          ...previous,
          thumbnailUrl: result,
        }));
      };

      image.onerror = () => {
        alert("Unable to read image.");
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      alert("Unable to upload image.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleCourseSubmit(event) {
    event.preventDefault();

    if (
      !courseForm.title.trim() ||
      !courseForm.category ||
      !courseForm.description.trim()
    ) {
      alert("Please complete all required fields.");
      return;
    }

    setStep(2);
  }

  function handleModuleSave(module) {
    setModuleData(module);
    setStep(3);
  }

  function handleQuizSave(quizzes) {
    if (!moduleData) {
      alert("Please complete module details first.");
      return;
    }

    if (!Array.isArray(quizzes) || quizzes.length !== 3) {
      alert("Each module must have 3 quiz questions.");
      return;
    }

    setModules((previous) => [
      ...previous,
      {
        ...moduleData,
        quizzes,
      },
    ]);

    setModuleData(null);
    setQuizData(null);
    setStep(4);
  }

  function handlePublish() {
    if (!canCreate) {
      alert("You do not have permission to create courses.");
      return;
    }

    if (
      !courseForm.title.trim() ||
      !courseForm.category ||
      !courseForm.description.trim()
    ) {
      alert("Please complete course details.");
      setStep(1);
      return;
    }

    if (modules.length === 0) {
      alert("Add at least one module before publishing.");
      return;
    }

    if (moduleData || quizData) {
      const confirmed = window.confirm(
        "You have an unfinished module. Publish only saved modules?"
      );

      if (!confirmed) return;
    }

    const newCourse = {
      title: courseForm.title.trim(),
      category: courseForm.category,
      description: courseForm.description.trim(),
      thumbnailUrl: courseForm.thumbnailUrl.trim(),
      instructorId: staff.id,
      instructor: staff.name,
      createdBy: staff.id,
      modules,
    };

    try {
      addCourse(newCourse);

      localStorage.removeItem(draftKey);

      setCourseForm({ ...emptyForm });
      setModules([]);
      setModuleData(null);
      setQuizData(null);
      setStep(1);

      alert("Course published successfully!");

      navigate("/staff/courses");
    } catch (error) {
      console.error("Course publishing failed:", error);
      alert("Unable to publish course.");
    }
  }

  if (!canCreate) {
    return (
      <div className="admin-courses">
        <div className="courses-toolbar">
          <h2>Access Denied</h2>
          <button
            type="button"
            onClick={() => navigate("/staff/courses")}
          >
            Back to Courses
          </button>
        </div>

        <div className="courses-empty">
          You do not have Create Course permission.
          Please contact your Admin.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-courses">
      {step === 1 && (
        <>
          <div className="courses-toolbar">
            <h2>Create Course</h2>

            <button
              type="button"
              onClick={() => navigate("/staff/courses")}
            >
              Back to Courses
            </button>
          </div>

          <form
            className="course-form"
            onSubmit={handleCourseSubmit}
          >
            <div className="form-group">
              <label htmlFor="staffCourseTitle">
                Course Title *
              </label>

              <input
                id="staffCourseTitle"
                name="title"
                value={courseForm.title}
                onChange={handleChange}
                placeholder="Enter course title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="staffCategory">
                Category *
              </label>

              <select
                id="staffCategory"
                name="category"
                value={courseForm.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Web Development">
                  Web Development
                </option>
                <option value="Python">Python</option>
                <option value="UI/UX">UI/UX</option>
                <option value="Computer Basics">
                  Computer Basics
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Instructor</label>

              <input
                value={staff.name}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Course Thumbnail</label>

              <div className="thumbnail-options">
                <button
                  type="button"
                  className={
                    thumbnailMode === "url" ? "selected" : ""
                  }
                  onClick={() => changeThumbnailMode("url")}
                >
                  Image URL
                </button>

                <button
                  type="button"
                  className={
                    thumbnailMode === "upload" ? "selected" : ""
                  }
                  onClick={() => changeThumbnailMode("upload")}
                >
                  Upload Image
                </button>
              </div>

              {thumbnailMode === "url" ? (
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={courseForm.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/course.jpg"
                />
              ) : (
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleThumbnailUpload}
                />
              )}

              {courseForm.thumbnailUrl && (
                <div className="thumbnail-preview">
                  <p>Thumbnail Preview</p>

                  <img
                    src={courseForm.thumbnailUrl}
                    alt="Course thumbnail preview"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="staffDescription">
                Description *
              </label>

              <textarea
                id="staffDescription"
                name="description"
                value={courseForm.description}
                onChange={handleChange}
                placeholder="Enter course description"
                rows="5"
                required
              />
            </div>

            <p className="course-draft-note">
              Your course will be saved automatically as a draft.
            </p>

            <div className="course-form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/staff/courses")}
              >
                Back to Courses
              </button>

              <button type="submit">
                Next: Module Builder →
              </button>
            </div>
          </form>
        </>
      )}

      {step === 2 && (
        <ModuleBuilder
          key={modules.length}
          initialModule={moduleData}
          onDraftChange={setModuleData}
          onSave={handleModuleSave}
          onBack={() =>
            setStep(modules.length > 0 ? 4 : 1)
          }
        />
      )}

      {step === 3 && (
        <QuizBuilder
          initialQuizzes={quizData}
          onDraftChange={setQuizData}
          onSave={handleQuizSave}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <div className="module-summary">
          <div className="courses-toolbar">
            <h2>Course Draft</h2>

            <button
              type="button"
              onClick={() => navigate("/staff/courses")}
            >
              Back to Courses
            </button>
          </div>

          <p>
            Course: <strong>{courseForm.title}</strong>
          </p>

          <p>Saved Modules: {modules.length}</p>

          <div className="saved-modules">
            {modules.map((module, index) => (
              <div
                className="saved-module-card"
                key={index}
              >
                <h3>
                  Module {index + 1}: {module.moduleTitle}
                </h3>

                <p>Video: {module.videoTitle}</p>

                <p>
                  Quiz Questions: {module.quizzes?.length || 0}
                </p>
              </div>
            ))}
          </div>

          <div className="course-form-actions">
            <button
              type="button"
              onClick={() => setStep(1)}
            >
              Edit Course Details
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
            >
              + Add Next Module
            </button>

            <button
              type="button"
              onClick={handlePublish}
            >
              Publish Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffCreateCourse;
