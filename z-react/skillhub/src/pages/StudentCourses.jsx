import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppSelector } from "../store/hooks";
import { useCourseMappings } from "../context/CourseMappingContext";
import { getStudentProgress, refreshStudentProgress } from "../utils/studentProgress";
import "./AdminCourses.css";
import "./StudentCourses.css";

function StudentCourses() {
  const { currentUser } = useAuth();
  const courses = useAppSelector((state) => state.courses.items);
  const { mappings } = useCourseMappings();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const studentId = String(currentUser?.id ?? "");

  const assignedIds = new Set(
    mappings
      .filter((mapping) => String(mapping.studentId) === studentId)
      .map((mapping) => String(mapping.courseId)),
  );

  const myCourses = courses.filter((course) =>
    assignedIds.has(String(course.id)),
  );

  const [, refresh] = useState(0);
  const assignedKey = myCourses.map(c => c.id).join(",");
  useEffect(() => {
    let active = true;
    refreshStudentProgress(myCourses).then(() => { if(active) refresh(v=>v+1); });
    return () => { active = false; };
  }, [assignedKey]);

  const filteredCourses = myCourses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()),
  );

  function openCourse(courseId) {
    navigate(`/student/courses/${courseId}`);
  }

  return (
    <div className="admin-courses student-courses">
      {filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const progress = getStudentProgress(studentId, course);

            return (
              <div
                className="course-item student-course-item"
                key={course.id}
                role="button"
                tabIndex={0}
                onClick={() => openCourse(course.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openCourse(course.id);
                  }
                }}
              >
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                  <div className="course-image-placeholder">📚</div>
                )}

                <div className="course-details">
                  <h3>{course.title}</h3>

                  <p>{course.category}</p>

                  <span>Instructor: {course.instructor || "Not assigned"}</span>

                  <span>Modules: {course.modules?.length || 0}</span>

                  <div className="student-course-progress">
                    <div className="student-progress-info">
                      <span>Course Progress</span>
                      <span>{progress.percentage}%</span>
                    </div>

                    <div className="student-progress-bar">
                      <div
                        style={{
                          width: `${progress.percentage}%`,
                        }}
                      />
                    </div>

                    <span className="student-module-count">
                      {progress.completedCount} of {progress.totalModules}{" "}
                      modules completed
                    </span>
                  </div>

                  <div className="student-course-footer">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openCourse(course.id);
                      }}
                    >
                      {progress.completed
                        ? "Review Course →"
                        : progress.started
                          ? "Continue Learning →"
                          : "Start Learning →"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="courses-empty">
          <h3>{search ? "No matching courses" : "No courses assigned yet"}</h3>
          <p>
            {search
              ? "Try searching with another course name."
              : "Courses assigned by your Admin or Staff will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentCourses;
