
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { useCourses } from "../context/CourseContext";
import CourseViewModal from "../components/CourseViewModal";
import CourseEditModal from "../components/CourseEditModal";
import "./AdminCourses.css";
import "./StaffCourses.css";

function StaffCourses() {
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { users } = useUsers();
  const { courses, updateCourse, deleteCourse } = useCourses();

  const [search, setSearch] = useState("");
  const [courseTab, setCourseTab] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  const staffId = String(currentUser?.id ?? "");

  const staff = users.find(
    (user) => String(user.id) === staffId
  );

  const permissions = staff?.permissions || [];

  const isActiveStaff =
    String(staff?.role || "").toLowerCase() === "staff" &&
    String(staff?.status || "Active").toLowerCase() === "active";

  const canCreate =
    isActiveStaff &&
    (Array.isArray(permissions)
      ? permissions.includes("Create Course")
      : permissions.createCourse === true);

  function isOwnCourse(course) {
    return (
      isActiveStaff &&
      String(course.createdBy ?? "") === staffId
    );
  }

  const myCourses = courses.filter(
    (course) =>
      String(course.createdBy ?? "") === staffId ||
      String(course.instructorId ?? "") === staffId
  );

  const draftKey = `skillhub_staff_course_draft_${staffId}`;

  let draft = null;

  if (canCreate) {
    try {
      const saved = localStorage.getItem(draftKey);

      if (saved) {
        const parsed = JSON.parse(saved);

        const hasContent =
          Object.values(parsed.courseForm || {}).some(
            (value) => String(value ?? "").trim() !== ""
          ) ||
          (parsed.modules || []).length > 0 ||
          parsed.moduleData != null ||
          parsed.quizData != null;

        if (hasContent) {
          draft = {
            id: `staff-draft-${staffId}`,
            title:
              parsed.courseForm?.title?.trim() ||
              "Untitled Course",
            category:
              parsed.courseForm?.category ||
              "Uncategorized",
            thumbnailUrl:
              parsed.courseForm?.thumbnailUrl || "",
            instructor:
              staff?.name || currentUser?.name,
            modules: parsed.modules || [],
            isDraft: true,
          };
        }
      }
    } catch (error) {
      console.error("Unable to load draft:", error);
    }
  }

  const allCourses = [
    ...myCourses.map((course) => ({
      ...course,
      isDraft: false,
    })),
    ...(draft ? [draft] : []),
  ];

  const filteredCourses = allCourses.filter((course) => {
    const createdByMe = isOwnCourse(course);

    const matchesTab =
      courseTab === "All" ||
      (courseTab === "Created" &&
        !course.isDraft &&
        createdByMe) ||
      (courseTab === "Assigned" &&
        !course.isDraft &&
        !createdByMe) ||
      (courseTab === "Draft" && course.isDraft);

    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      keyword.length < 3 ||
      (course.title || "")
        .toLowerCase()
        .includes(keyword);

    return matchesTab && matchesSearch;
  });

  function handleCreateCourse() {
    if (!canCreate) {
      alert("You do not have permission to create courses.");
      return;
    }

    navigate("/staff/courses/create");
  }

  function handleEditCourse(updatedData) {
    if (!editingCourse) return;

    const originalCourse = courses.find(
      (course) =>
        String(course.id) === String(editingCourse.id)
    );

    if (!originalCourse || !isOwnCourse(originalCourse)) {
      alert("You can only edit courses created by you.");
      setEditingCourse(null);
      return;
    }

    if (typeof updateCourse !== "function") {
      alert("Course update function is unavailable.");
      return;
    }

    updateCourse(originalCourse.id, {
      ...updatedData,
      instructorId: originalCourse.instructorId,
      instructor: originalCourse.instructor,
      createdBy: originalCourse.createdBy,
    });

    setEditingCourse(null);
    alert("Course updated successfully!");
  }

  function handleDeleteCourse(course) {
    const originalCourse = courses.find(
      (item) => String(item.id) === String(course.id)
    );

    if (!originalCourse || !isOwnCourse(originalCourse)) {
      alert("You can only delete courses created by you.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${originalCourse.title}"?`
    );

    if (!confirmed) return;

    if (typeof deleteCourse !== "function") {
      alert("Course delete function is unavailable.");
      return;
    }

    deleteCourse(originalCourse.id);

    setSelectedCourse(null);
    setEditingCourse(null);

    alert("Course deleted successfully!");
  }

  const editInstructor = editingCourse
    ? users.find(
        (user) =>
          String(user.id) ===
          String(editingCourse.instructorId)
      )
    : null;

  return (
    <div className="staff-courses-page admin-courses">
      <div className="courses-toolbar">
        <div className="course-status-tabs">
          {["All", "Created", "Assigned", "Draft"].map(
            (tab) => (
              <button
                key={tab}
                type="button"
                className={
                  courseTab === tab ? "active" : ""
                }
                onClick={() => setCourseTab(tab)}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleCreateCourse}
          >
            + Create Course
          </button>
        )}
      </div>

      <div className="courses-filters">
        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      {search.trim().length > 0 &&
        search.trim().length < 3 && (
          <p className="courses-search-hint">
            Enter at least 3 characters to search.
          </p>
        )}

      {filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <div
              className="course-item"
              key={course.id}
            >
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                />
              ) : (
                <div className="course-image-placeholder">
                  📚
                </div>
              )}

              <div className="course-details">
                {course.isDraft && (
                  <span className="course-draft-badge">
                    Draft
                  </span>
                )}

                <h3>{course.title}</h3>

                <p>{course.category}</p>

                <span>
                  Instructor: {course.instructor}
                </span>

                <p>
                  Modules: {course.modules?.length || 0}
                </p>

                {course.isDraft ? (
                  <button
                    type="button"
                    className="resume-course-btn"
                    onClick={handleCreateCourse}
                  >
                    Resume Editing
                  </button>
                ) : (
                  <div className="course-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCourse(course)
                      }
                    >
                      View
                    </button>

                    {isOwnCourse(course) && (
                      <>
                        <button
                          type="button"
                          className="staff-edit-course-btn"
                          onClick={() =>
                            setEditingCourse(course)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-course-btn"
                          onClick={() =>
                            handleDeleteCourse(course)
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
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
          onClose={() =>
            setSelectedCourse(null)
          }
        />
      )}

      {editingCourse &&
        isOwnCourse(editingCourse) && (
          <CourseEditModal
            course={editingCourse}
            staffUsers={
              editInstructor
                ? [editInstructor]
                : []
            }
            onSave={handleEditCourse}
            onClose={() =>
              setEditingCourse(null)
            }
          />
        )}
    </div>
  );
}

export default StaffCourses;
