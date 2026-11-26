import { createContext, useContext, useEffect, useState } from "react";
import { api, postJson } from "../api/client";
import { useAuth } from "./AuthContext";
const CourseContext = createContext(null);
export function CourseProvider({ children }) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    if (!currentUser) { setCourses([]); return; }
    api("/api/courses").then(data => setCourses(data.courses || [])).catch(console.error);
  }, [currentUser?.id]);
  async function addCourse(course) {
    const result = await api("/api/courses", postJson(course));
    setCourses(previous => [result.course, ...previous]);
    return result.course;
  }
  async function updateCourse(courseId, changes) {
    const result = await api(`/api/courses/${courseId}`, { method: "PATCH", body: JSON.stringify(changes) });
    setCourses(previous => previous.map(course => String(course.id) === String(courseId) ? result.course : course));
    return result.course;
  }
  async function deleteCourse(courseId) {
    await api(`/api/courses/${courseId}`, { method: "DELETE" });
    setCourses(previous => previous.filter(course => String(course.id) !== String(courseId)));
  }
  return <CourseContext.Provider value={{ courses, addCourse, updateCourse, deleteCourse }}>{children}</CourseContext.Provider>;
}
export function useCourses() {
  const value = useContext(CourseContext);
  if (!value) throw new Error("useCourses must be used inside CourseProvider");
  return value;
}
