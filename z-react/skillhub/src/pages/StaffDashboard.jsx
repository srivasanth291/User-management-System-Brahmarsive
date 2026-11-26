import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useAppSelector } from "../store/hooks";
import { useCourseMappings } from "../context/useCourseMappings";
import "./StaffDashboard.css";

function StaffDashboard() {
  const { currentUser } = useAuth();
  const courses = useAppSelector((state) => state.courses.items);
  const { mappings } = useCourseMappings();

  const staffId = String(currentUser?.id ?? "");

  const myCourses = courses.filter((course) => {
    return (
      String(course.createdBy ?? "") === staffId ||
      String(course.instructorId ?? "") === staffId
    );
  });

  const createdCourses = myCourses.filter(
    (course) => String(course.createdBy ?? "") === staffId
  );

  const assignedCourses = myCourses.filter(
    (course) =>
      String(course.instructorId ?? "") === staffId &&
      String(course.createdBy ?? "") !== staffId
  );

  const myCourseIds = new Set(
    myCourses.map((course) => String(course.id))
  );

  const myMappings = mappings.filter((mapping) =>
    myCourseIds.has(String(mapping.courseId))
  );

  const totalStudents = new Set(
    myMappings.map((mapping) => String(mapping.studentId))
  ).size;

  const recentCourses = myCourses.slice(0, 4);

  return (
    <div className="staff-dashboard">
      <div className="staff-welcome-section">
        <h2>Welcome, {currentUser?.name || "Staff"}</h2>
        <p>Manage your SkillHub courses and students</p>
      </div>

      <div className="staff-stats">
        <div className="staff-stat-card staff-total-card">
          <h3>Total Courses</h3>
          <h2>{myCourses.length}</h2>
        </div>

        <div className="staff-stat-card staff-created-card">
          <h3>Created Courses</h3>
          <h2>{createdCourses.length}</h2>
        </div>

        <div className="staff-stat-card staff-assigned-card">
          <h3>Assigned Courses</h3>
          <h2>{assignedCourses.length}</h2>
        </div>

        <div className="staff-stat-card staff-students-card">
          <h3>My Students</h3>
          <h2>{totalStudents}</h2>
        </div>
      </div>

      <div className="staff-quick-actions">
        <Link to="/staff/courses" className="staff-action-card">
          <div className="staff-action-icon">📚</div>
          <h3>My Courses</h3>
          <p>View and manage your courses</p>
          <span>View Courses →</span>
        </Link>

        <Link to="/staff/course-mapping" className="staff-action-card">
          <div className="staff-action-icon">🔗</div>
          <h3>Course Mapping</h3>
          <p>Assign students to your courses</p>
          <span>Manage Assignments →</span>
        </Link>
      </div>

      <section className="staff-dashboard-section">
        <div className="staff-section-heading">
          <h2>My Recent Courses</h2>
          <Link to="/staff/courses">View All Courses →</Link>
        </div>

        {recentCourses.length > 0 ? (
          <div className="staff-course-grid">
            {recentCourses.map((course) => (
              <div className="staff-course-card" key={course.id}>
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                  />
                ) : (
                  <div className="staff-course-placeholder">
                    📚
                  </div>
                )}

                <div className="staff-course-info">
                  <h3>{course.title}</h3>
                  <p>{course.category}</p>

                  <span>
                    {String(course.createdBy ?? "") === staffId
                      ? "Created by You"
                      : "Assigned Course"}
                  </span>

                  <p>
                    Modules: {course.modules?.length || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="staff-empty-state">
            No courses created or assigned yet.
          </div>
        )}
      </section>
    </div>
  );
}

export default StaffDashboard;
