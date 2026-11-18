import CourseViewModal from "../components/CourseViewModal";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCourses } from "../context/CourseContext";
import { useUsers } from "../context/UserContext";
import ModuleBuilder from "../components/ModuleBuilder";
import QuizBuilder from "../components/QuizzBuilder";
import "./AdminCourses.css";
import CourseEditModal from "../components/CourseEditModal";

const DRAFT_KEY = "skillhub_course_draft";

const emptyCourseForm = {
  title: "",
  category: "",
  instructorId: "",
  thumbnailUrl: "",
  description: "",
};

function getSavedDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);

    if (!saved) {
      return null;
    }

    const draft = JSON.parse(saved);

    return {
      courseForm: {
        ...emptyCourseForm,
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

function AdminCourses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { courses, addCourse, updateCourse, deleteCourse } = useCourses();
  const { users } = useUsers();

  const showCreateForm = searchParams.get("create") === "true";

  const [courseTab, setCourseTab] = useState("All");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [savedDraft] = useState(getSavedDraft);

  const [step, setStep] = useState(savedDraft?.step || 1);

  const [courseForm, setCourseForm] = useState(
    savedDraft?.courseForm || { ...emptyCourseForm },
  );
  const [thumbnailMode, setThumbnailMode] = useState(
    savedDraft?.courseForm?.thumbnailUrl?.startsWith("data:image/")
      ? "upload"
      : "url",
  );
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState(savedDraft?.modules || []);

  const [moduleData, setModuleData] = useState(savedDraft?.moduleData || null);

  const [quizData, setQuizData] = useState(savedDraft?.quizData || null);

  const staffUsers = users.filter((user) => {
    const role = (user.role || "").toLowerCase();
    const status = (user.status || "Active").toLowerCase();

    return role === "staff" && status === "active";
  });
  const [editingCourse, setEditingCourse] = useState(null);

  const hasDraft =
    Object.values(courseForm).some(
      (value) => String(value ?? "").trim() !== "",
    ) ||
    modules.length > 0 ||
    moduleData !== null ||
    quizData !== null;

  useEffect(() => {
    try {
      if (!hasDraft) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }

      const draft = {
        courseForm,
        modules,
        moduleData,
        quizData,
        step,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error("Draft saving failed:", error);
    }
  }, [courseForm, modules, moduleData, quizData, step, hasDraft]);

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

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Please select a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be below 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(1, 900 / image.width, 600 / image.height);

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          alert("Unable to process image.");
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedImage = canvas.toDataURL("image/jpeg", 0.72);

        if (compressedImage.length > 650000) {
          alert("Image is too large to save as a browser draft.");
          return;
        }

        setCourseForm((previous) => ({
          ...previous,
          thumbnailUrl: compressedImage,
        }));
      };

      image.onerror = () => {
        alert("Unable to read the selected image.");
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      alert("Image upload failed.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !courseForm.title.trim() ||
      !courseForm.category ||
      !courseForm.instructorId ||
      !courseForm.description.trim()
    ) {
      alert("Please fill all required fields.");
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

    const completedModule = {
      ...moduleData,
      quizzes,
    };

    setModules((previous) => [...previous, completedModule]);

    setModuleData(null);
    setQuizData(null);
    setStep(4);
  }

  function handleModuleBack() {
    if (modules.length > 0) {
      setStep(4);
    } else {
      setStep(1);
    }
  }

  function handleAddNextModule() {
    setStep(2);
  }

  function handlePublishCourse() {
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
      alert("Please add at least one module.");
      return;
    }

    const selectedInstructor = staffUsers.find(
      (staff) => String(staff.id) === String(courseForm.instructorId),
    );

    if (!selectedInstructor) {
      alert("Please select an active staff instructor.");
      setStep(1);
      return;
    }

    const incompleteModule =
      moduleData &&
      Object.values(moduleData).some(
        (value) => String(value ?? "").trim() !== "",
      );

    if (incompleteModule || quizData !== null) {
      const confirmed = window.confirm(
        "You have an unfinished module. Publish only the saved modules?",
      );

      if (!confirmed) {
        return;
      }
    }

    const newCourse = {
      title: courseForm.title.trim(),
      category: courseForm.category,
      instructorId: selectedInstructor.id,
      instructor: selectedInstructor.name,
      thumbnailUrl: courseForm.thumbnailUrl.trim(),
      description: courseForm.description.trim(),
      modules,
    };

    addCourse(newCourse);

    setCourseForm({ ...emptyCourseForm });
    setModules([]);
    setModuleData(null);
    setQuizData(null);
    setStep(1);
    setCourseTab("Published");

    localStorage.removeItem(DRAFT_KEY);

    navigate("/admin/courses");

    alert("Course published successfully!");
  }
  function handleEditCourse(updatedCourse) {
    if (!editingCourse) return;

    updateCourse(editingCourse.id, updatedCourse);
    setEditingCourse(null);

    alert("Course updated successfully!");
  }

  function handleDeleteCourse(course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`,
    );

    if (!confirmed) return;

    deleteCourse(course.id);
    alert("Course deleted successfully!");
  }

  const draftCourse = hasDraft
    ? {
        id: "current-draft",
        title: courseForm.title.trim() || "Untitled Course",
        category: courseForm.category || "Uncategorized",
        instructor:
          staffUsers.find(
            (staff) => String(staff.id) === String(courseForm.instructorId),
          )?.name || "Not assigned",
        thumbnailUrl: courseForm.thumbnailUrl,
        modules,
        isDraft: true,
      }
    : null;

  const allCourses = [
    ...courses.map((course) => ({
      ...course,
      isDraft: false,
    })),
    ...(draftCourse ? [draftCourse] : []),
  ];

  const categories = [
    ...new Set(allCourses.map((course) => course.category).filter(Boolean)),
  ];

  const filteredCourses = allCourses.filter((course) => {
    const keyword = search.trim().toLowerCase();
    const title = (course.title || "").toLowerCase();

    const matchesTab =
      courseTab === "All" ||
      (courseTab === "Published" && !course.isDraft) ||
      (courseTab === "Draft" && course.isDraft);

    const matchesSearch = keyword.length < 3 || title.includes(keyword);

    const matchesCategory =
      categoryFilter === "All" || course.category === categoryFilter;

    return matchesTab && matchesSearch && matchesCategory;
  });

  if (showCreateForm) {
    return (
      <div className="admin-courses">
        {step === 1 && (
          <>
            <div className="courses-toolbar">
              <h2>Create New Course</h2>

              <button type="button" onClick={() => navigate("/admin/courses")}>
                Back to Courses
              </button>
            </div>

            <form className="course-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="courseTitle">Course Title *</label>

                <input
                  id="courseTitle"
                  type="text"
                  name="title"
                  value={courseForm.title}
                  onChange={handleChange}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="courseCategory">Category *</label>

                <select
                  id="courseCategory"
                  name="category"
                  value={courseForm.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Python">Python</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Computer Basics">Computer Basics</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="courseInstructor">Instructor *</label>

                <select
                  id="courseInstructor"
                  name="instructorId"
                  value={courseForm.instructorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Instructor</option>

                  {staffUsers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course Thumbnail</label>

                <div className="thumbnail-options">
                  <button
                    type="button"
                    className={thumbnailMode === "url" ? "selected" : ""}
                    onClick={() => changeThumbnailMode("url")}
                  >
                    Image URL
                  </button>

                  <button
                    type="button"
                    className={thumbnailMode === "upload" ? "selected" : ""}
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
                    placeholder="https://example.com/course-image.jpg"
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
                <label htmlFor="courseDescription">Description *</label>

                <textarea
                  id="courseDescription"
                  name="description"
                  value={courseForm.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Enter course description"
                  required
                />
              </div>

              <p className="course-draft-note">
                Your course is automatically saved as a draft.
              </p>

              <div className="course-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate("/admin/courses")}
                >
                  Back to Courses
                </button>

                <button type="submit">Next: Module Builder →</button>
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
            onBack={handleModuleBack}
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

              <button type="button" onClick={() => navigate("/admin/courses")}>
                Back to Courses
              </button>
            </div>

            <p>
              Course: <strong>{courseForm.title}</strong>
            </p>

            <p>Total Modules: {modules.length}</p>

            <div className="saved-modules">
              {modules.map((module, index) => (
                <div className="saved-module-card" key={index}>
                  <h3>
                    Module {index + 1}: {module.moduleTitle}
                  </h3>

                  <p>Video: {module.videoTitle}</p>

                  <p>Quiz Questions: {module.quizzes?.length || 0}</p>
                </div>
              ))}
            </div>

            <div className="course-form-actions">
              <button type="button" onClick={() => setStep(1)}>
                Edit Course Details
              </button>

              <button type="button" onClick={handleAddNextModule}>
                + Add Next Module
              </button>

              <button type="button" onClick={handlePublishCourse}>
                Publish Course
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-courses">
      <div className="courses-toolbar">
        <div
          className="course-status-tabs"
          role="tablist"
          aria-label="Course status"
        >
          {["All", "Published", "Draft"].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={courseTab === tab}
              className={courseTab === tab ? "active" : ""}
              onClick={() => setCourseTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/courses?create=true")}
        >
          + Create Course
        </button>
      </div>

      <div className="courses-filters">
        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="All">All Categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {search.trim().length > 0 && search.trim().length < 3 && (
        <p className="courses-search-hint">
          Enter at least 3 characters to search.
        </p>
      )}

      {filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <div className="course-item" key={course.id}>
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} />
              ) : (
                <div className="course-image-placeholder">📚</div>
              )}

              <div className="course-details">
                {course.isDraft && (
                  <span className="course-draft-badge">Draft</span>
                )}

                <h3>{course.title}</h3>
                <p>{course.category}</p>

                <span>Instructor: {course.instructor}</span>
                {!course.isDraft && (
                  <div className="course-card-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingCourse(course)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-course-btn"
                      onClick={() => handleDeleteCourse(course)}
                    >
                      Delete
                    </button>
                  </div>
                )}
                {course.isDraft && (
                  <>
                    <p className="draft-module-count">
                      Saved Modules: {course.modules.length}
                    </p>

                    <button
                      type="button"
                      className="resume-course-btn"
                      onClick={() => navigate("/admin/courses?create=true")}
                    >
                      Resume Editing
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="courses-empty">
          {courseTab === "Draft"
            ? "No draft courses available."
            : "No matching courses found."}
        </div>
      )}

      {selectedCourse && (
        <CourseViewModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          staffUsers={staffUsers}
          onSave={handleEditCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </div>
  );
}

export default AdminCourses;
