import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateCourse } from "../store/slices/coursesSlice";
import CourseViewModal from "../components/CourseViewModal";
import CourseEditModal from "../components/CourseEditModal";
import "./AdminCourses.css";
import "./StaffCourses.css";

function StaffCourses() {
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { users } = useUsers();
  const courses = useAppSelector((state) => state.courses.items);
  const dispatch = useAppDispatch();

  const [search, setSearch] = useState("");
  const [courseTab, setCourseTab] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  const staffId = String(currentUser?.id ?? "");

  const staff = users.find((user) => String(user.id) === staffId);

  // The server authorizes staff course creation by role; fine-grained
  // permissions are not stored by the backend yet.
  const isActiveStaff = currentUser?.role === "staff";
  const canCreate = isActiveStaff;

  function isOwnCourse(course) {
    return isActiveStaff && String(course.createdBy ?? "") === staffId;
  }

  const myCourses = courses.filter(
    (course) =>
      String(course.createdBy ?? "") === staffId ||
      String(course.instructorId ?? "") === staffId,
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
            (value) => String(value ?? "").trim() !== "",
          ) ||
          (parsed.modules || []).length > 0 ||
          parsed.moduleData != null ||
          parsed.quizData != null;

        if (hasContent) {
          draft = {
            id: `staff-draft-${staffId}`,
            title: parsed.courseForm?.title?.trim() || "Untitled Course",
            category: parsed.courseForm?.category || "Uncategorized",
            thumbnailUrl: parsed.courseForm?.thumbnailUrl || "",
            instructor: staff?.name || currentUser?.name,
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
      isDraft: String(course.status || "").toLowerCase() === "draft",
    })),
    ...(draft ? [draft] : []),
  ];

  const filteredCourses = allCourses.filter((course) => {
    const createdByMe = isOwnCourse(course);

    const matchesTab =
      courseTab === "All" ||
      (courseTab === "Created" && !course.isDraft && createdByMe) ||
      (courseTab === "Assigned" && !course.isDraft && !createdByMe) ||
      (courseTab === "Draft" && course.isDraft);
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      keyword.length < 3 ||
      (course.title || "").toLowerCase().includes(keyword);

    return matchesTab && matchesSearch;
  });

  function handleCreateCourse() {
    if (!canCreate) {
      alert("You do not have permission to create courses.");
      return;
    }

    navigate("/staff/courses/create");
  }

  async function handleEditCourse(updatedData) {
    if (!editingCourse) return;

    const originalCourse = courses.find(
      (course) => String(course.id) === String(editingCourse.id),
    );

    if (!originalCourse || !isOwnCourse(originalCourse)) {
      alert("You can only edit courses created by you.");
      setEditingCourse(null);
      return;
    }

    await dispatch(
      updateCourse({
        id: originalCourse.id,
        changes: {
          ...updatedData,
          instructorId: originalCourse.instructorId,
          instructor: originalCourse.instructor,
          createdBy: originalCourse.createdBy,
        },
      }),
    ).unwrap();
    setEditingCourse(null);
    alert("Course updated successfully!");
  }

  async function handleDeleteCourse(course) {
    const originalCourse = courses.find(
      (item) => String(item.id) === String(course.id),
    );

    if (!originalCourse || !isOwnCourse(originalCourse)) {
      alert("You can only manage courses created by you.");
      return;
    }

    if (!window.confirm(`Move "${course.title}" to Draft?`)) {
      return;
    }

    try {
      await dispatch(
        updateCourse({
          id: originalCourse.id,
          changes: { status: "draft" },
        }),
      ).unwrap();

      setSelectedCourse(null);
      setEditingCourse(null);
      setCourseTab("Draft");

      alert("Course moved to Draft successfully!");
    } catch (error) {
      alert(error?.message || "Unable to move course to Draft.");
    }
  }
  async function handlePublishCourse(course) {
    if (!isOwnCourse(course)) {
      alert("Only the course creator can publish this course.");
      return;
    }

    if (!window.confirm(`Publish "${course.title}"?`)) {
      return;
    }

    try {
      await dispatch(
        updateCourse({
          id: course.id,
          changes: { status: "published" },
        }),
      ).unwrap();

      setCourseTab("Created");
      alert("Course published successfully!");
    } catch (error) {
      alert(error?.message || "Unable to publish course.");
    }
  }

  const editInstructor = editingCourse
    ? users.find(
        (user) => String(user.id) === String(editingCourse.instructorId),
      )
    : null;

  return (
    <div className="staff-courses-page admin-courses">
      <div className="courses-toolbar">
        <div className="course-status-tabs">
          {["All", "Created", "Assigned", "Draft"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={courseTab === tab ? "active" : ""}
              onClick={() => setCourseTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {canCreate && (
          <button type="button" onClick={handleCreateCourse}>
            + Create Course
          </button>
        )}
      </div>

      <div className="courses-filters">
        <input
          type="search"
          placeholder="Search courses..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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

                <span>
                  Instructor:{" "}
                  {users.find(
                    (user) => String(user.id) === String(course.instructorId),
                  )?.name ||
                    course.instructor ||
                    "Not assigned"}
                </span>

                <p>Modules: {course.modules?.length || 0}</p>
                {course.isDraft ? (
                  <div className="course-card-actions">
                    {String(course.id).startsWith("staff-draft-") ? (
                      <button type="button" onClick={handleCreateCourse}>
                        Resume Editing
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedCourse(course)}
                        >
                          View
                        </button>

                        {isOwnCourse(course) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingCourse(course)}
                            >
                              Edit Course
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePublishCourse(course)}
                            >
                              Publish
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="course-card-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                    >
                      View
                    </button>

                    {isOwnCourse(course) && (
                      <>
                        <button
                          type="button"
                          className="staff-edit-course-btn"
                          onClick={() => setEditingCourse(course)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-course-btn"
                          onClick={() => handleDeleteCourse(course)}
                        >
                          Move to Draft
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
          onClose={() => setSelectedCourse(null)}
        />
      )}

      {editingCourse && isOwnCourse(editingCourse) && (
        <CourseEditModal
          course={editingCourse}
          staffUsers={editInstructor ? [editInstructor] : []}
          onSave={handleEditCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </div>
  );
}

export default StaffCourses;
