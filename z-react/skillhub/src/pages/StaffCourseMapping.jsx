import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { useAppSelector } from "../store/hooks";
import { useCourseMappings } from "../context/CourseMappingContext";
import "./AdminCourseMapping.css";
import "./StaffCourseMapping.css";

function StaffCourseMapping() {
  const { currentUser } = useAuth();
  const { users } = useUsers();
  const  courses  = useAppSelector((state) => state.courses.items);
  const { mappings, assignCourse, unassignCourse } = useCourseMappings();

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [message, setMessage] = useState(null);

  const staffId = String(currentUser?.id ?? "");

  const myCourses = courses.filter((course) => {
    const createdByMe = String(course.createdBy ?? "") === staffId;

    const assignedToMe = String(course.instructorId ?? "") === staffId;

    return createdByMe || assignedToMe;
  });

  const myCourseIds = new Set(myCourses.map((course) => String(course.id)));

  const students = users.filter((user) => {
    const role = (user.role || "").toLowerCase();
    const status = (user.status || "Active").toLowerCase();

    return role === "student" && status === "active";
  });

  const myMappings = mappings
    .filter((mapping) => myCourseIds.has(String(mapping.courseId)))
    .map((mapping) => {
      const student = users.find(
        (user) => String(user.id) === String(mapping.studentId),
      );

      const course = myCourses.find(
        (course) => String(course.id) === String(mapping.courseId),
      );

      if (!student || !course) return null;

      return {
        ...mapping,
        student,
        course,
      };
    })
    .filter(Boolean);

  const filteredMappings = myMappings.filter((mapping) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      keyword.length < 3 ||
      (mapping.student.name || "").toLowerCase().includes(keyword) ||
      (mapping.student.email || "").toLowerCase().includes(keyword) ||
      (mapping.course.title || "").toLowerCase().includes(keyword);

    const matchesCourse =
      courseFilter === "All" ||
      String(mapping.courseId) === String(courseFilter);

    return matchesSearch && matchesCourse;
  });

  async function handleAssign(event) {
    event.preventDefault();

    if (!studentId || !courseId) {
      setMessage({
        type: "error",
        text: "Please select a student and course.",
      });
      return;
    }

    if (!myCourseIds.has(String(courseId))) {
      setMessage({
        type: "error",
        text: "You cannot assign this course.",
      });
      return;
    }

    const result = await assignCourse(studentId, courseId);

    setMessage({
      type: result.ok ? "success" : "error",
      text: result.message,
    });

    if (result.ok) {
      setStudentId("");
      setCourseId("");
    }
  }

  async function handleUnassign(mapping) {
    if (!myCourseIds.has(String(mapping.courseId))) {
      return;
    }

    const confirmed = window.confirm(
      `Unassign "${mapping.course.title}" from "${mapping.student.name}"?`,
    );

    if (!confirmed) return;

    const result = await unassignCourse(mapping.id);

    setMessage({
      type: result?.ok === false ? "error" : "success",
      text: result?.message || "Course unassigned successfully.",
    });
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="admin-course-mapping staff-course-mapping">
      <div className="mapping-form-card">
        <h3>Assign Student to Course</h3>

        <form className="mapping-form" onSubmit={handleAssign}>
          <div className="mapping-field">
            <label htmlFor="staffMappingStudent">Select Student</label>

            <select
              id="staffMappingStudent"
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                setMessage(null);
              }}
              required
            >
              <option value="">Choose Student</option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mapping-field">
            <label htmlFor="staffMappingCourse">Select Course</label>

            <select
              id="staffMappingCourse"
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                setMessage(null);
              }}
              required
            >
              <option value="">Choose Course</option>

              {myCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mapping-assign-btn"
            disabled={students.length === 0 || myCourses.length === 0}
          >
            Assign Course
          </button>
        </form>

        {message && (
          <p className={`mapping-message ${message.type}`} role="status">
            {message.text}
          </p>
        )}
      </div>

      <div className="mapping-list-card">
        <div className="mapping-list-header">
          <h3>My Course Assignments ({myMappings.length})</h3>
        </div>

        <div className="mapping-filters">
          <input
            type="search"
            placeholder="Search student or course..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option value="All">All My Courses</option>

            {myCourses.map((course) => (
              <option key={course.id} value={String(course.id)}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {search.trim().length > 0 && search.trim().length < 3 && (
          <p className="mapping-search-hint">
            Enter at least 3 characters to search.
          </p>
        )}

        <div className="mapping-table-wrapper">
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Assigned Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMappings.length > 0 ? (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>{mapping.student.name}</td>
                    <td>{mapping.student.email}</td>
                    <td>{mapping.course.title}</td>
                    <td>{formatDate(mapping.assignedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="mapping-unassign-btn"
                        onClick={() => handleUnassign(mapping)}
                      >
                        Unassign
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="mapping-empty">
                    No course assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StaffCourseMapping;
