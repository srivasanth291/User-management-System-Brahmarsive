
import { useState } from "react";
import { useUsers } from "../context/useUsers";
import { useAppSelector } from "../store/hooks";
import { useCourseMappings } from "../context/useCourseMappings";
import "./AdminCourseMapping.css";

function AdminCourseMapping() {
  const { users } = useUsers();
  const courses = useAppSelector((state) => state.courses.items);
  const { mappings, assignCourse, unassignCourse } = useCourseMappings();

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [message, setMessage] = useState(null);

  const students = users.filter(
    (user) =>
      (user.role || "").toLowerCase() === "student" &&
      (user.status || "Active").toLowerCase() === "active"
  );

  const assignedCourses = mappings
    .map((mapping) => {
      const student = users.find(
        (user) => String(user.id) === String(mapping.studentId)
      );

      const course = courses.find(
        (item) => String(item.id) === String(mapping.courseId)
      );

      if (!student || !course) return null;

      return { ...mapping, student, course };
    })
    .filter(Boolean);

  const filteredMappings = assignedCourses.filter((mapping) => {
    const keyword = search.trim().toLowerCase();

    const searchableText = [
      mapping.student.name,
      mapping.student.email,
      mapping.course.title,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      keyword.length < 3 || searchableText.includes(keyword);

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
    const confirmed = window.confirm(
      `Unassign "${mapping.course.title}" from "${mapping.student.name}"?`
    );

    if (!confirmed) return;

    const result = await unassignCourse(mapping.id);

    setMessage({
      type: result.ok ? "success" : "error",
      text: result.message,
    });
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="admin-course-mapping">
      <div className="mapping-header">
        <h2>Course Mapping</h2>
        <p>Assign published courses to students and manage enrollments.</p>
      </div>

      <div className="mapping-form-card">
        <h3>Assign Course</h3>

        <form className="mapping-form" onSubmit={handleAssign}>
          <div className="mapping-field">
            <label htmlFor="mappingStudent">Select Student</label>

            <select
              id="mappingStudent"
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
            <label htmlFor="mappingCourse">Select Course</label>

            <select
              id="mappingCourse"
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                setMessage(null);
              }}
              required
            >
              <option value="">Choose Course</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mapping-assign-btn"
            disabled={students.length === 0 || courses.length === 0}
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
          <h3>Assigned Courses ({assignedCourses.length})</h3>
        </div>

        <div className="mapping-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student or course..."
          />

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option value="All">All Courses</option>

            {courses.map((course) => (
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
                <th>Instructor</th>
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
                    <td>{mapping.course.instructor || "Not assigned"}</td>
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
                  <td colSpan="6" className="mapping-empty">
                    No course mappings found.
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

export default AdminCourseMapping