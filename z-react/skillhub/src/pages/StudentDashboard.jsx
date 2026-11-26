import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useAppSelector } from "../store/hooks";
import { useCourseMappings } from "../context/useCourseMappings";
import "./AdminDashoard.css";
import "./StudentDashboard.css";
import {
  getStudentProgress,
  getOverallProgress,
  refreshStudentProgress,
} from "../utils/studentProgress";
function StudentDashboard() {
  const { currentUser } = useAuth();
  const courses = useAppSelector((state) => state.courses.items);
  const { mappings } = useCourseMappings();
  const navigate = useNavigate();

  const studentId = String(currentUser?.id ?? "");

  const assignedCourses = useMemo(() => {
    const ids = new Set(mappings.filter(mapping => String(mapping.studentId) === studentId)
      .map(mapping => String(mapping.courseId)));
    return courses.filter(course => ids.has(String(course.id)));
  }, [courses, mappings, studentId]);

  const [, refresh] = useState(0);
  useEffect(() => {
    let active = true;
    refreshStudentProgress(studentId, assignedCourses).then(() => { if(active) refresh(v=>v+1); });
    return () => { active = false; };
  }, [studentId, assignedCourses]);

  const totalCourses = assignedCourses.length;

  const completedCourses = assignedCourses.filter(
    (course) => getStudentProgress(studentId, course).completed,
  ).length;

  const inProgressCourses = assignedCourses.filter((course) => {
    const progress = getStudentProgress(studentId, course);
    return progress.started && !progress.completed;
  }).length;

  const overallProgress = getOverallProgress(studentId, assignedCourses);

  const recentCourses = assignedCourses.slice(0, 4);

  function openCourse(courseId) {
    navigate(`/student/courses/${courseId}`);
  }

  return (
    <div className="admin-dashboard student-dashboard">
      <div className="welcome-section">
        <h2>Welcome, {currentUser?.name || "Student"}</h2>
        <p>Continue your learning journey with SkillHub</p>
      </div>

      <div className="stats-container">
        <div className="stat-card course-card">
          <h3>Assigned Courses</h3>
          <h2>{totalCourses}</h2>
        </div>

        <div className="stat-card author-card">
          <h3>In Progress</h3>
          <h2>{inProgressCourses}</h2>
        </div>

        <div className="stat-card user-card">
          <h3>Completed Courses</h3>
          <h2>{completedCourses}</h2>
        </div>

        <div className="stat-card student-card">
          <h3>Overall Progress</h3>
          <h2>{overallProgress}%</h2>
        </div>
      </div>
      <section className="recent-courses">
        <div className="recent-courses-header">
          <h2>My Assigned Courses</h2>
        </div>

        <div className="recent-course-grid">
          {recentCourses.length > 0 ? (
            recentCourses.map((course) => (
              <button
                type="button"
                className="recent-course-card student-recent-course"
                key={course.id}
                onClick={() => openCourse(course.id)}
              >
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                  <div className="course-placeholder">📚</div>
                )}

                <div className="recent-course-info">
                  <h3>{course.title}</h3>
                  <p>{course.category}</p>
                  <span>Modules: {course.modules?.length || 0}</span>
                </div>
              </button>
            ))
          ) : (
            <p>No courses assigned yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
