import { createContext, useContext, useState } from "react";
import { courses as initialCourses } from "../data/courses";

const CourseContext = createContext(null);

export function CourseProvider({ children }) {
  const [courses, setCourses] = useState(() => {
    try {
      const savedCourses = localStorage.getItem("skillhub_courses");

      return savedCourses ? JSON.parse(savedCourses) : initialCourses;
    } catch {
      return initialCourses;
    }
  });

  function addCourse(course) {
    const newCourse = {
      ...course,
      id: crypto.randomUUID(),
    };

    setCourses((previous) => {
      const updatedCourses = [...previous, newCourse];

      localStorage.setItem("skillhub_courses", JSON.stringify(updatedCourses));

      return updatedCourses;
    });

    return newCourse;
  }
  function updateCourse(courseId, updatedData) {
    setCourses((previous) =>
      previous.map((course) =>
        String(course.id) === String(courseId)
          ? { ...course, ...updatedData, id: course.id }
          : course,
      ),
      
    );
    useEffect(() => {
  localStorage.setItem(
    "skillhub_courses",
    JSON.stringify(courses)
  );
}, [courses]);

  }

  function deleteCourse(courseId) {
    setCourses((previous) =>
      previous.filter((course) => String(course.id) !== String(courseId)),
    );
    useEffect(() => {
  localStorage.setItem(
    "skillhub_courses",
    JSON.stringify(courses)
  );
}, [courses]);
  }

  return (
    <CourseContext.Provider
      value={{ courses, addCourse, updateCourse, deleteCourse }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CourseContext);

  if (!context) {
    throw new Error("useCourses must be used inside CourseProvider");
  }

  return context;
}
