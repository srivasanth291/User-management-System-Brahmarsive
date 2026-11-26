import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";
import { useAppSelector } from "../store/hooks";
import { useNavigate } from "react-router-dom";
import "./AdminDashoard.css";
import createCourseImage from "../images/create-course.jpg";
import viewCoursesImage from "../images/view-course.jpg";

function AdminDashboard() {
  const { currentUser } = useAuth();

  const { users } = useUsers();
  const navigate = useNavigate();

  const courses = useAppSelector((state) => state.courses.items);

  const registeredUsers = users.filter((user) => {
    const role = (user.role || "").toLowerCase();
    const status = (user.status || "Active").toLowerCase();

    return (
      (role === "staff" || role === "student") &&
      status !== "pending"
    );
  });

  const totalCourses = courses.length;

  const totalAuthors = registeredUsers.filter(
    (user) => user.role.toLowerCase() === "staff"
  ).length;

  const totalUsers = registeredUsers.length;

  const totalStudents = registeredUsers.filter(
    (user) => user.role.toLowerCase() === "student"
  ).length;

  const recentCourses = courses.slice(-4).reverse();

  return (
    <div className="admin-dashboard">

      <div className="welcome-section">
        <h2>Welcome, {currentUser?.name}</h2>
        <p>Manage your SkillHub learning platform</p>
      </div>

      <div className="stats-container">

        <div className="stat-card course-card">
          <h3>Total Courses</h3>
          <h2>{totalCourses}</h2>
        </div>

        <div className="stat-card author-card">
          <h3>Total Authors</h3>
          <h2>{totalAuthors}</h2>
        </div>
        <div className="stat-card student-card">
          <h3>Total Students</h3>
          <h2>{totalStudents}</h2>
        </div>

      </div>

      <div className="dashboard-quick-actions">

        <button
          type="button"
          className="quick-image-card"
          onClick={() => navigate("/admin/courses?create=true")}
          aria-label="Create Course"
        >
          <img src={createCourseImage} alt="Create Course" />
        </button>

        <button
          type="button"
          className="quick-image-card"
          onClick={() => navigate("/admin/courses")}
          aria-label="View Courses"
        >
          <img src={viewCoursesImage} alt="View Courses" />
        </button>

      </div>

      <section className="recent-courses">

        <div className="recent-courses-header">
          <h2>Recent Courses</h2>
        </div>

        <div className="recent-course-grid">

          {recentCourses.length > 0 ? (
            recentCourses.map((course) => (
              <div className="recent-course-card" key={course.id}>

                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                  />
                ) : (
                  <div className="course-placeholder">
                    📚
                  </div>
                )}

                <div className="recent-course-info">
                  <h3>{course.title}</h3>
                  <p>{course.category}</p>
                  <span>
                    Instructor: {course.instructor}
                  </span>
                </div>

              </div>
            ))
          ) : (
            <p>No courses available yet.</p>
          )}

        </div>

      </section>

    </div>
  );
}

export default AdminDashboard;
