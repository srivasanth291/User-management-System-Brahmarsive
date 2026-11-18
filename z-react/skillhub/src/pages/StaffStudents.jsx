
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { useCourses } from "../context/CourseContext";
import { useCourseMappings } from "../context/CourseMappingContext";
import "./StaffStudents.css";

function StaffStudents() {
  const { currentUser } = useAuth();
  const { users, inviteUser } = useUsers();
  const { courses } = useCourses();
  const { mappings } = useCourseMappings();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const staffId = String(currentUser?.id ?? "");

  const staffRecord = users.find(
    (user) => String(user.id) === staffId
  );

  const permissions = staffRecord?.permissions || [];

  const canAddStudent = Array.isArray(permissions)
    ? permissions.some((permission) =>
        ["Add Student", "Manage Users"].includes(permission)
      )
    : permissions.addStudent === true ||
      permissions.manageUsers === true;

  const myCourses = courses.filter(
    (course) =>
      String(course.createdBy ?? "") === staffId ||
      String(course.instructorId ?? "") === staffId
  );

  const myCourseIds = new Set(
    myCourses.map((course) => String(course.id))
  );

  const myMappings = mappings.filter((mapping) =>
    myCourseIds.has(String(mapping.courseId))
  );

  const assignedStudentIds = new Set(
    myMappings.map((mapping) => String(mapping.studentId))
  );

  const myStudents = users.filter((user) => {
    const isStudent =
      (user.role || "").toLowerCase() === "student";

    const isAssigned = assignedStudentIds.has(
      String(user.id)
    );

    const invitedByMe =
      String(user.invitedById ?? user.invitedBy ?? "") === staffId;

    return isStudent && (isAssigned || invitedByMe);
  });

  const filteredStudents = myStudents.filter((student) => {
    const keyword = search.trim().toLowerCase();

    if (keyword.length < 3) {
      return true;
    }

    return (
      (student.name || "").toLowerCase().includes(keyword) ||
      (student.email || "").toLowerCase().includes(keyword)
    );
  });

  function getAssignedCourses(studentId) {
    const courseIds = new Set(
      myMappings
        .filter(
          (mapping) =>
            String(mapping.studentId) === String(studentId)
        )
        .map((mapping) => String(mapping.courseId))
    );

    return myCourses.filter((course) =>
      courseIds.has(String(course.id))
    );
  }

  async function handleInvite(event) {
    event.preventDefault();

    if (!canAddStudent) {
      setMessage("You do not have permission to add students.");
      return;
    }

    const studentName = name.trim();
    const studentEmail = email.trim().toLowerCase();

    if (!studentName || !studentEmail) {
      setMessage("Please enter student name and email.");
      return;
    }

    const exists = users.some(
      (user) =>
        (user.email || "").toLowerCase() === studentEmail
    );

    if (exists) {
      setMessage("This email is already registered or invited.");
      return;
    }

    if (typeof inviteUser !== "function") {
      setMessage("Student invitation is not available in UserContext.");
      return;
    }

    try {
      const result = await inviteUser({
        name: studentName,
        email: studentEmail,
        role: "student",
        invitedById: currentUser.id,
      });

      if (result?.ok === false || result?.success === false) {
        setMessage(result.message || "Unable to create invitation.");
        return;
      }

      setMessage("Student invitation created as Pending.");
      setName("");
      setEmail("");
      setShowModal(false);
    } catch (error) {
      setMessage(error.message || "Unable to invite student.");
    }
  }

  return (
    <div className="staff-students-page">
      <div className="staff-students-header">
        <div>
          <h2>Assigned Students</h2>
          <p>Students assigned to your courses</p>
        </div>

        {canAddStudent && (
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setShowModal(true);
            }}
          >
            + Invite Student
          </button>
        )}
      </div>

      <div className="staff-students-summary">
        <div>
          <span>Total Students</span>
          <h3>{myStudents.length}</h3>
        </div>

        <div>
          <span>My Courses</span>
          <h3>{myCourses.length}</h3>
        </div>

        <div>
          <span>Active Students</span>
          <h3>
            {
              myStudents.filter(
                (student) =>
                  (student.status || "Active").toLowerCase() ===
                  "active"
              ).length
            }
          </h3>
        </div>
      </div>

      <div className="staff-students-panel">
        <div className="staff-students-filters">
          <h3>Student List</h3>

          <input
            type="search"
            placeholder="Search students..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {message && (
          <p className="staff-student-message" role="status">
            {message}
          </p>
        )}

        <div className="staff-students-table-wrapper">
          <table className="staff-students-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Assigned Courses</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const assignedCourses = getAssignedCourses(
                    student.id
                  );

                  return (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>
                        {assignedCourses.length > 0
                          ? assignedCourses
                              .map((course) => course.title)
                              .join(", ")
                          : "Not assigned"}
                      </td>
                      <td>
                        <span className="staff-student-status">
                          {student.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="staff-students-empty">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && canAddStudent && (
        <div className="staff-student-overlay">
          <div className="staff-student-modal">
            <div className="staff-student-modal-header">
              <h3>Invite Student</h3>

              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInvite}>
              <div className="staff-student-field">
                <label>Student Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="staff-student-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="staff-student-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit">
                  Invite Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffStudents;
