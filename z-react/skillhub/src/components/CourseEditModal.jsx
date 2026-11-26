
import { useState } from "react";

function CourseEditModal({ course, staffUsers, onSave, onClose }) {
  const [form, setForm] = useState({
    title: course.title || "",
    category: course.category || "",
    instructorId: String(course.instructorId || ""),
    description: course.description || "",
    thumbnailUrl: course.thumbnailUrl || "",
    modules: (course.modules || []).map((module) => ({
      ...module,
      quizzes: (module.quizzes || []).map((quiz) => ({
        ...quiz,
        options: { ...quiz.options },
      })),
    })),
  });

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function updateModule(index, field, value) {
    setForm((previous) => ({
      ...previous,
      modules: previous.modules.map((module, i) =>
        i === index ? { ...module, [field]: value } : module
      ),
    }));
  }

  function updateQuiz(moduleIndex, quizIndex, field, value) {
    setForm((previous) => ({
      ...previous,
      modules: previous.modules.map((module, i) => {
        if (i !== moduleIndex) return module;

        return {
          ...module,
          quizzes: module.quizzes.map((quiz, j) =>
            j === quizIndex
              ? { ...quiz, [field]: value }
              : quiz
          ),
        };
      }),
    }));
  }

  function updateOption(moduleIndex, quizIndex, option, value) {
    setForm((previous) => ({
      ...previous,
      modules: previous.modules.map((module, i) => {
        if (i !== moduleIndex) return module;

        return {
          ...module,
          quizzes: module.quizzes.map((quiz, j) =>
            j === quizIndex
              ? {
                  ...quiz,
                  options: {
                    ...quiz.options,
                    [option]: value,
                  },
                }
              : quiz
          ),
        };
      }),
    }));
  }

  function addModule() {
    setForm((previous) => ({
      ...previous,
      modules: [
        ...previous.modules,
        {
          moduleTitle: "",
          videoTitle: "",
          videoUrl: "",
          blogText: "",
          quizzes: Array.from({ length: 3 }, () => ({
            question: "",
            options: { A: "", B: "", C: "" },
            correct: "A",
          })),
        },
      ],
    }));
  }

  function removeModule(index) {
    if (!window.confirm("Remove this module?")) return;

    setForm((previous) => ({
      ...previous,
      modules: previous.modules.filter((_, i) => i !== index),
    }));
  }

  function handleImageUpload(event) {
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
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) return;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const result = canvas.toDataURL("image/jpeg", 0.72);

        if (result.length > 650000) {
          alert("Compressed image is too large.");
          return;
        }

        setForm((previous) => ({
          ...previous,
          thumbnailUrl: result,
        }));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSave(event) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.category ||
      !form.instructorId ||
      !form.description.trim()
    ) {
      alert("Please complete all required fields.");
      return;
    }

    if (form.modules.length === 0) {
      alert("A published course needs at least one module.");
      return;
    }

    const selectedInstructor = staffUsers.find(
      (staff) => String(staff.id) === String(form.instructorId)
    );

    if (!selectedInstructor) {
      alert("Please select a valid instructor.");
      return;
    }

    for (const module of form.modules) {
      if (
        !module.moduleTitle?.trim() ||
        !module.videoTitle?.trim() ||
        !module.videoUrl?.trim()
      ) {
        alert("Please complete the module title and video details.");
        return;
      }

      for (const quiz of module.quizzes) {
        if (
          !quiz.question?.trim() ||
          !Object.keys(quiz.options).every(
            (option) => quiz.options?.[option]?.trim()
          ) ||
          !Object.keys(quiz.options).includes(quiz.correct)
        ) {
          alert("Please complete all quiz questions and answers.");
          return;
        }
      }
    }

    try {
      await onSave({ ...form, instructorId: selectedInstructor.id, instructor: selectedInstructor.name });
    } catch (error) {
      alert(error.message || "Unable to save course changes.");
    }
  }

  return (
    <div className="course-edit-overlay">
      <div className="course-edit-modal">
        <div className="course-edit-header">
          <h2>Edit Course</h2>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="course-edit-content">
            <div className="form-group">
              <label>Course Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={updateField}
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
              <label>Instructor *</label>
              <select
                name="instructorId"
                value={form.instructorId}
                onChange={updateField}
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
              <label>Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Thumbnail URL</label>
              <input
                type="url"
                value={
                  form.thumbnailUrl.startsWith("data:")
                    ? ""
                    : form.thumbnailUrl
                }
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    thumbnailUrl: event.target.value,
                  }))
                }
                placeholder="https://example.com/image.png"
              />

              <label>Or Upload JPG / PNG</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleImageUpload}
              />

              {form.thumbnailUrl && (
                <img
                  className="course-edit-thumbnail"
                  src={form.thumbnailUrl}
                  alt="Course thumbnail"
                />
              )}
            </div>

            <h3>Course Modules</h3>

            {form.modules.map((module, moduleIndex) => (
              <div
                className="course-edit-module"
                key={moduleIndex}
              >
                <div className="course-edit-module-title">
                  <h4>Module {moduleIndex + 1}</h4>

                  <button
                    type="button"
                    className="course-edit-remove"
                    onClick={() => removeModule(moduleIndex)}
                  >
                    Remove Module
                  </button>
                </div>

                {[
                  ["moduleTitle", "Module Title"],
                  ["videoTitle", "Video Title"],
                  ["videoUrl", "Video URL"],
                ].map(([field, label]) => (
                  <div className="form-group" key={field}>
                    <label>{label}</label>
                    <input
                      value={module[field] || ""}
                      onChange={(event) =>
                        updateModule(
                          moduleIndex,
                          field,
                          event.target.value
                        )
                      }
                      required
                    />
                  </div>
                ))}

                <div className="form-group">
                  <label>Module Explanation</label>
                  <textarea
                    rows="4"
                    value={module.blogText || ""}
                    onChange={(event) =>
                      updateModule(
                        moduleIndex,
                        "blogText",
                        event.target.value
                      )
                    }
                  />
                </div>

                <h4>Quiz Questions</h4>

                {module.quizzes.map((quiz, quizIndex) => (
                  <div
                    className="course-edit-quiz"
                    key={quizIndex}
                  >
                    <div className="form-group">
                      <label>Question {quizIndex + 1}</label>
                      <input
                        value={quiz.question || ""}
                        onChange={(event) =>
                          updateQuiz(
                            moduleIndex,
                            quizIndex,
                            "question",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    {Object.keys(quiz.options).map((option) => (
                      <div className="form-group" key={option}>
                        <label>Option {option}</label>
                        <input
                          value={quiz.options?.[option] || ""}
                          onChange={(event) =>
                            updateOption(
                              moduleIndex,
                              quizIndex,
                              option,
                              event.target.value
                            )
                          }
                          required
                        />
                      </div>
                    ))}

                    <div className="form-group">
                      <label>Correct Answer</label>
                      <select
                        value={quiz.correct || "A"}
                        onChange={(event) =>
                          updateQuiz(
                            moduleIndex,
                            quizIndex,
                            "correct",
                            event.target.value
                          )
                        }
                      >
                        {Object.keys(quiz.options).map(key => <option key={key} value={key}>Option {key}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <button
              type="button"
              className="course-edit-add"
              onClick={addModule}
            >
              + Add Module
            </button>
          </div>

          <div className="course-edit-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseEditModal;
