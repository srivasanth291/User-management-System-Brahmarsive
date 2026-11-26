import { useState } from "react";

function ModuleBuilder({ initialModule, onSave, onBack, onDraftChange }) {
  const [module, setModule] = useState({
    moduleTitle: "",
    videoTitle: "",
    videoUrl: "",
    blogText: "",
    ...initialModule,
  });

function handleChange(event) {
  const { name, value } = event.target;

  const updated = {
    ...module,
    [name]: value,
  };

  setModule(updated);
  onDraftChange(updated);
}

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !module.moduleTitle.trim() ||
      !module.videoTitle.trim() ||
      !module.videoUrl.trim() ||
      !module.blogText.trim()
    ) {
      alert("Please fill all module fields.");
      return;
    }

    onSave(module);
  }

  return (
    <div className="module-builder">
      <h2>Create Module</h2>

      <form className="course-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Module Title *</label>
          <input
            type="text"
            name="moduleTitle"
            value={module.moduleTitle}
            onChange={handleChange}
            placeholder="Example: Introduction to Python"
            required
          />
        </div>

        <div className="form-group">
          <label>Video Title *</label>
          <input
            type="text"
            name="videoTitle"
            value={module.videoTitle}
            onChange={handleChange}
            placeholder="Example: Python Basics"
            required
          />
        </div>

        <div className="form-group">
          <label>Video URL *</label>
          <input
            type="url"
            name="videoUrl"
            value={module.videoUrl}
            onChange={handleChange}
            placeholder="https://example.com/video"
            required
          />
        </div>

        <div className="form-group">
          <label>Explanation *</label>
          <textarea
            name="blogText"
            value={module.blogText}
            onChange={handleChange}
            rows="6"
            placeholder="Explain the module content"
            required
          />
        </div>

        <div className="course-form-actions">
          <button type="button" className="cancel-btn" onClick={onBack}>
            Cancel
          </button>

          <button type="submit">Next: Quiz Builder →</button>
        </div>
      </form>
    </div>
  );
}

export default ModuleBuilder;
